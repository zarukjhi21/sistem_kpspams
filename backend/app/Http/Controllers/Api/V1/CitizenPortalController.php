<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Connection;
use App\Models\Customer;
use App\Models\Complaint;
use App\Models\Invoice;
use App\Models\MeterReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CitizenPortalController extends BaseApiController
{
    /**
     * Cek data sambungan rumah, tagihan aktif, dan riwayat pemakaian air secara publik.
     */
    public function checkSr(Request $request): JsonResponse
    {
        $sr = trim((string) $request->query('sr', ''));

        if (empty($sr)) {
            return $this->sendError('Parameter nomor SR atau NIK wajib diisi.', [], 422);
        }

        // Cari berdasarkan Connection Number, NIK, atau Code pelanggan
        $connection = Connection::with([
            'customer.customerType',
            'meter',
            'dusun',
            'kpspams',
        ])
        ->where(function ($q) use ($sr) {
            $q->where('connection_no', $sr)
              ->orWhere('connection_no', 'like', "%{$sr}%")
              ->orWhereHas('customer', function ($cq) use ($sr) {
                  $cq->where('nik', $sr)
                     ->orWhere('code', $sr);
              });
        })
        ->first();

        if (!$connection) {
            return $this->sendError("Nomor Sambungan Rumah (No. SR) atau NIK '{$sr}' tidak ditemukan dalam basis data resmi Desa Kuajang.", [], 404);
        }

        $customer = $connection->customer;

        // Ambil Tagihan Aktif / Berjalan (Terbaru)
        $latestInvoice = Invoice::with(['billingPeriod'])
            ->where('connection_id', $connection->id)
            ->orderBy('invoice_date', 'desc')
            ->first();

        // Ambil Riwayat 6 Pembacaan Meter Terakhir
        $readings = MeterReading::with('billingPeriod')
            ->where('connection_id', $connection->id)
            ->orderBy('reading_date', 'desc')
            ->take(6)
            ->get()
            ->reverse()
            ->values();

        $consumptionHistory = $readings->map(function ($r) {
            $monthLabel = date('M', strtotime((string)$r->reading_date));
            $vol = (float) $r->usage_m3;
            return [
                'period_name' => $r->billingPeriod ? $r->billingPeriod->name : date('M Y', strtotime((string)$r->reading_date)),
                'month' => $monthLabel,
                'reading_date' => (string)$r->reading_date,
                'previous_reading' => (float) $r->previous_reading,
                'current_reading' => (float) $r->current_reading,
                'usage_m3' => $vol,
            ];
        });

        // Masking NIK untuk privasi warga (GovTech Standard: 760403******0001)
        $rawNik = $customer?->nik;
        $maskedNik = $rawNik ? substr($rawNik, 0, 6) . '******' . substr($rawNik, -4) : '-';

        $data = [
            'customer' => [
                'id' => $customer?->id,
                'full_name' => $customer?->full_name,
                'nik_masked' => $maskedNik,
                'phone' => $customer?->phone,
                'tariff_type' => $customer?->customerType?->name ?? 'Rumah Tangga',
                'address' => $customer?->identity_address,
                'dusun' => $connection->dusun?->name ?? $customer?->dusun ?? 'Desa Kuajang',
            ],
            'connection' => [
                'id' => $connection->id,
                'connection_no' => $connection->connection_no,
                'meter_serial' => $connection->meter?->serial_number ?? 'MTR-' . $connection->id,
                'meter_brand' => $connection->meter?->brand ?? 'Onda',
                'status' => $connection->status,
                'kpspams_id' => $connection->kpspams_id,
                'kpspams_name' => $connection->kpspams?->name ?? 'KPSPAMS Desa Kuajang',
            ],
            'current_bill' => $latestInvoice ? [
                'invoice_id' => $latestInvoice->id,
                'invoice_number' => $latestInvoice->invoice_number,
                'period_name' => $latestInvoice->billingPeriod?->name ?? 'Periode Berjalan',
                'usage_m3' => (float) $latestInvoice->usage_m3,
                'water_amount' => (float) $latestInvoice->water_amount,
                'admin_fee' => (float) $latestInvoice->admin_fee,
                'maintenance_fee' => (float) $latestInvoice->maintenance_fee,
                'penalty_fee' => (float) $latestInvoice->penalty_fee,
                'total_amount' => (float) $latestInvoice->total_amount,
                'balance_due' => (float) $latestInvoice->balance_due,
                'status' => $latestInvoice->status,
                'due_date' => $latestInvoice->due_date ? date('d F Y', strtotime((string)$latestInvoice->due_date)) : '20 Oktober 2026',
                'is_paid' => $latestInvoice->status === 'PAID',
            ] : null,
            'consumption_history' => $consumptionHistory,
        ];

        return $this->sendResponse($data, 'Data sambungan rumah berhasil ditemukan.');
    }

    /**
     * Submit pengaduan warga secara publik melalui portal.
     */
    public function submitComplaint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connection_no' => 'required|string',
            'category' => 'required|string|in:AIR_MATI,TEKANAN_RENDAH,PIPA_BOCOR,METER_RUSAK,KUALITAS_AIR,TAGIHAN,LAINNYA',
            'description' => 'required|string|min:10|max:1000',
        ]);

        $connection = Connection::with('customer')->where('connection_no', $validated['connection_no'])->first();

        if (!$connection) {
            return $this->sendError('Nomor Sambungan Rumah tidak valid.', [], 404);
        }

        $ticketNumber = 'TCK-' . date('Ym') . '-' . strtoupper(Str::random(4));

        $complaint = Complaint::create([
            'kpspams_id' => $connection->kpspams_id,
            'customer_id' => $connection->customer_id,
            'connection_id' => $connection->id,
            'ticket_number' => $ticketNumber,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'priority' => 'MEDIUM',
            'status' => 'OPEN',
        ]);

        return $this->sendResponse([
            'ticket_number' => $complaint->ticket_number,
            'created_at' => $complaint->created_at->toIso8601String(),
        ], 'Laporan pengaduan berhasil dicatat dalam sistem KPSPAMS.', 201);
    }
}
