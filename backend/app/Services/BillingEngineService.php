<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Connection;
use App\Models\BillingPeriod;
use App\Models\MeterReading;
use App\Models\Tariff;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\KpspamsBillingPolicy;
use Illuminate\Support\Facades\DB;
use Exception;

class BillingEngineService
{
    /**
     * Generate invoice resmi untuk satu sambungan rumah pada periode tagihan tertentu.
     */
    public function generateInvoice(Connection $connection, BillingPeriod $period, MeterReading $reading): Invoice
    {
        return DB::transaction(function () use ($connection, $period, $reading) {
            // 1. Ambil skema tarif aktif spesifik untuk KPSPAMS dan tipe pelanggan sambungan
            $tariff = Tariff::where('kpspams_id', $connection->kpspams_id)
                ->where('customer_type_id', $connection->customer->customer_type_id)
                ->where('effective_from', '<=', $period->billing_date)
                ->where(function ($query) use ($period) {
                    $query->whereNull('effective_until')
                          ->orWhere('effective_until', '>=', $period->billing_date);
                })
                ->where('status', 'ACTIVE')
                ->latest('effective_from')
                ->first();

            if (!$tariff) {
                throw new Exception("Skema tarif aktif tidak ditemukan untuk KPSPAMS ID {$connection->kpspams_id} dan tipe pelanggan ID {$connection->customer->customer_type_id}.");
            }

            $usageM3 = (float) $reading->usage_m3;
            $itemsData = [];
            $waterSubtotal = 0.0;

            // 2. Kalkulasi tarif bertingkat (Tiered Progressive Rates)
            $components = $tariff->components;
            $remainingUsage = $usageM3;

            foreach ($components as $component) {
                if ($remainingUsage <= 0 && $component->tier_order > 1) {
                    break;
                }

                $tierMin = $component->tier_min_m3;
                $tierMax = $component->tier_max_m3;
                $rate = (float) $component->rate_per_m3;

                $tierCapacity = $tierMax !== null ? ($tierMin === 0 ? ($tierMax - $tierMin) : ($tierMax - $tierMin + 1)) : $remainingUsage;
                $volumeInTier = min($remainingUsage, (float) $tierCapacity);

                if ($volumeInTier > 0) {
                    $tierCost = $volumeInTier * $rate;
                    $waterSubtotal += $tierCost;
                    $remainingUsage -= $volumeInTier;

                    $tierDesc = ($rate == 0)
                        ? "Pemakaian Air Paket Dasar ({$tierMin}-" . ($tierMax ?? 'dst') . " m³ - Termasuk Beban Bulanan)"
                        : ($tierMax === null
                            ? "Kelebihan Pemakaian Air (> " . ($tierMin - 1) . " m³)"
                            : "Pemakaian Air Tier {$component->tier_order} ({$tierMin}-{$tierMax} m³)");

                    $itemsData[] = [
                        'item_type' => "WATER_USAGE_TIER_{$component->tier_order}",
                        'description' => $tierDesc,
                        'volume' => $volumeInTier,
                        'unit_rate' => $rate,
                        'total_price' => $tierCost,
                    ];
                }
            }

            // 3. Komponen Biaya Tetap (Admin & Pemeliharaan)
            $adminFee = (float) $tariff->fixed_admin_fee;
            if ($adminFee > 0) {
                $firstComp = $components->first();
                $hasFreeBaseTier = $firstComp && ((float) $firstComp->rate_per_m3 === 0.0) && $firstComp->tier_max_m3 !== null;

                $adminDesc = $hasFreeBaseTier
                    ? "Biaya Beban Tetap Bulanan (Termasuk s.d {$firstComp->tier_max_m3} m³)"
                    : 'Biaya Administrasi Pengelolaan';

                $itemsData[] = [
                    'item_type' => 'ADMIN_FEE',
                    'description' => $adminDesc,
                    'volume' => 1.00,
                    'unit_rate' => $adminFee,
                    'total_price' => $adminFee,
                ];
            }

            $maintenanceFee = (float) $tariff->maintenance_fee;
            if ($maintenanceFee > 0) {
                $itemsData[] = [
                    'item_type' => 'MAINTENANCE_FEE',
                    'description' => 'Biaya Pemeliharaan Meter & Jaringan',
                    'volume' => 1.00,
                    'unit_rate' => $maintenanceFee,
                    'total_price' => $maintenanceFee,
                ];
            }

            // 4. Denda Keterlambatan (Berdasarkan KpspamsBillingPolicy, MVP: Default Rp0)
            $policy = KpspamsBillingPolicy::where('kpspams_id', $connection->kpspams_id)->first();
            $penaltyFee = 0.00;
            if ($policy && $policy->late_penalty_type === 'FLAT') {
                $penaltyFee = (float) $policy->late_penalty_amount;
            }

            $totalAmount = $waterSubtotal + $adminFee + $maintenanceFee + $penaltyFee;

            // 5. Buat Record Invoice (Snapshot Immutability)
            $invoiceNumber = $this->generateInvoiceNumber($connection->kpspams_id, $period);

            $invoice = Invoice::create([
                'kpspams_id' => $connection->kpspams_id,
                'billing_period_id' => $period->id,
                'connection_id' => $connection->id,
                'customer_id' => $connection->customer_id,
                'meter_reading_id' => $reading->id,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $period->billing_date,
                'due_date' => $period->due_date,
                'usage_m3' => $usageM3,
                'water_amount' => $waterSubtotal,
                'admin_fee' => $adminFee,
                'maintenance_fee' => $maintenanceFee,
                'penalty_fee' => $penaltyFee,
                'total_amount' => $totalAmount,
                'paid_amount' => 0.00,
                'balance_due' => $totalAmount,
                'status' => 'UNPAID',
            ]);

            // 6. Simpan detail item dengan snapshot harga
            foreach ($itemsData as $item) {
                $item['invoice_id'] = $invoice->id;
                InvoiceItem::create($item);
            }

            return $invoice;
        });
    }

    protected function generateInvoiceNumber(int $kpspamsId, BillingPeriod $period): string
    {
        $code = str_pad((string) $kpspamsId, 2, '0', STR_PAD_LEFT);
        $random = strtoupper(bin2hex(random_bytes(3)));
        return "INV/{$period->year}{$period->month}/KP{$code}/{$random}";
    }
}
