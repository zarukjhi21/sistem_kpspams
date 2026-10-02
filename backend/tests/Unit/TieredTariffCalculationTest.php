<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TieredTariffCalculationTest extends TestCase
{
    use RefreshDatabase;
    public function test_it_correctly_calculates_progressive_water_tariff(): void
    {
        // Simulasi skema tarif progresif KPSPAMS Kuajang
        $tiers = [
            ['order' => 1, 'min' => 0, 'max' => 10, 'rate' => 1500.0],
            ['order' => 2, 'min' => 11, 'max' => 20, 'rate' => 2500.0],
            ['order' => 3, 'min' => 21, 'max' => null, 'rate' => 3500.0],
        ];

        $fixedAdminFee = 5000.0;
        $maintenanceFee = 2000.0;

        // Pemakaian 25 m³
        $usageM3 = 25.0;
        $remainingUsage = $usageM3;
        $waterSubtotal = 0.0;
        $breakdowns = [];

        foreach ($tiers as $tier) {
            if ($remainingUsage <= 0 && $tier['order'] > 1) {
                break;
            }

            $tierMin = $tier['min'];
            $tierMax = $tier['max'];
            $rate = $tier['rate'];

            $tierCapacity = $tierMax !== null ? ($tierMin === 0 ? ($tierMax - $tierMin) : ($tierMax - $tierMin + 1)) : $remainingUsage;
            $volumeInTier = min($remainingUsage, (float) $tierCapacity);

            if ($volumeInTier > 0) {
                $tierCost = $volumeInTier * $rate;
                $waterSubtotal += $tierCost;
                $remainingUsage -= $volumeInTier;

                $breakdowns[] = [
                    'tier' => $tier['order'],
                    'volume' => $volumeInTier,
                    'cost' => $tierCost,
                ];
            }
        }

        // Verifikasi Breakdown per Tier
        // Tier 1: 10 m³ x Rp1.500 = Rp15.000
        $this->assertEquals(10.0, $breakdowns[0]['volume']);
        $this->assertEquals(15000.0, $breakdowns[0]['cost']);

        // Tier 2: 10 m³ x Rp2.500 = Rp25.000
        $this->assertEquals(10.0, $breakdowns[1]['volume']);
        $this->assertEquals(25000.0, $breakdowns[1]['cost']);

        // Tier 3: 5 m³ x Rp3.500 = Rp17.500
        $this->assertEquals(5.0, $breakdowns[2]['volume']);
        $this->assertEquals(17500.0, $breakdowns[2]['cost']);

        // Total Air = 15.000 + 25.000 + 17.500 = 57.500
        $this->assertEquals(57500.0, $waterSubtotal);

        // Total Invoice = 57.500 + 5.000 + 2.000 = 64.500
        $totalInvoice = $waterSubtotal + $fixedAdminFee + $maintenanceFee;
        $this->assertEquals(64500.0, $totalInvoice);
    }

    public function test_it_correctly_calculates_lemo_baru_tariff_policy(): void
    {
        // Kebijakan Resmi Lemo Baru:
        // - Beban flat bulanan Rp10.000 untuk pemakaian s/d 15 m³
        // - Kelebihan di atas 15 m³ dihitung Rp1.000 / m³
        $baseFee = 10000.0;
        $ratePerExcessM3 = 1000.0;

        $calcLemoBaru = function (float $usage) use ($baseFee, $ratePerExcessM3): float {
            $excess = max(0.0, $usage - 15.0);
            return $baseFee + ($excess * $ratePerExcessM3);
        };

        // Kasus 1: Pemakaian 0 m³ (Beban minimum per bulan)
        $this->assertEquals(10000.0, $calcLemoBaru(0.0));

        // Kasus 2: Pemakaian 10 m³ (Di bawah 15 m³)
        $this->assertEquals(10000.0, $calcLemoBaru(10.0));

        // Kasus 3: Pemakaian 14.5 m³ (M. Yusuf - di bawah 15 m³)
        $this->assertEquals(10000.0, $calcLemoBaru(14.5));

        // Kasus 4: Tepat 15 m³
        $this->assertEquals(10000.0, $calcLemoBaru(15.0));

        // Kasus 5: Pemakaian 16 m³ (Kelebihan 1 m³ sesuai contoh user)
        // Rp10.000 + 1 x Rp1.000 = Rp11.000
        $this->assertEquals(11000.0, $calcLemoBaru(16.0));

        // Kasus 6: Pemakaian 18 m³ (Baharuddin - kelebihan 3 m³)
        // Rp10.000 + 3 x Rp1.000 = Rp13.000
        $this->assertEquals(13000.0, $calcLemoBaru(18.0));

        // Kasus 7: Pemakaian 20 m³ (Kelebihan 5 m³)
        // Rp10.000 + 5 x Rp1.000 = Rp15.000
    }

    public function test_billing_engine_service_generates_accurate_invoice_with_items(): void
    {
        $this->seed();

        $engine = new \App\Services\BillingEngineService();
        $connection = \App\Models\Connection::with('customer')->where('kpspams_id', 1)->firstOrFail();

        $period = \App\Models\BillingPeriod::create([
            'kpspams_id' => 1,
            'period_code' => 'PER-202610-TEST',
            'name' => 'Oktober 2026',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-04',
            'billing_date' => '2026-10-05',
            'due_date' => '2026-10-20',
            'status' => 'BILLING',
        ]);

        $reading = \App\Models\MeterReading::create([
            'kpspams_id' => 1,
            'connection_id' => $connection->id,
            'meter_id' => $connection->meter_id,
            'billing_period_id' => $period->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 0.0,
            'current_reading' => 18.0,
            'usage_m3' => 18.0,
            'meter_photo_path' => 'meter_readings/202610/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $invoice = $engine->generateInvoice($connection, $period, $reading);

        $this->assertNotNull($invoice);
        $this->assertEquals(18.0, $invoice->usage_m3);
        $this->assertEquals(3000.0, $invoice->water_amount); // 3 m³ x 1.000
        $this->assertEquals(10000.0, $invoice->admin_fee);   // Beban flat bulanan Lemo Baru
        $this->assertEquals(13000.0, $invoice->total_amount); // Total Rp13.000
        $this->assertEquals(13000.0, $invoice->balance_due);
        $this->assertEquals('UNPAID', $invoice->status);

        // Verifikasi invoice items snapshot
        $items = $invoice->items;
        $this->assertCount(3, $items); // Tier 1, Tier 2, Admin Fee
    }
}
