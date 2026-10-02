<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Customer;
use App\Models\Connection;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\CashAccount;
use App\Models\Complaint;
use App\Models\Kpspams;
use App\Models\Dusun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseApiController
{
    /**
     * Mengambil ringkasan metrik dashboard secara dinamis berdasarkan context KPSPAMS.
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();

        // Tentukan target KPSPAMS ID
        $targetKpspamsId = null;
        if (!$user->isDesaLevel() && !$user->isSuperAdmin()) {
            $targetKpspamsId = $user->kpspams_id;
        } elseif ($request->filled('kpspams_id')) {
            $targetKpspamsId = (int) $request->query('kpspams_id');
        }

        // 1. Pelanggan & Sambungan
        $customerQuery = Customer::query();
        $connectionQuery = Connection::query();

        if ($targetKpspamsId) {
            $customerQuery->where('kpspams_id', $targetKpspamsId);
            $connectionQuery->where('kpspams_id', $targetKpspamsId);
        }

        $totalCustomers = $customerQuery->count();
        $activeConnections = (clone $connectionQuery)->where('status', 'ACTIVE')->count();
        $sealedConnections = (clone $connectionQuery)->where('status', 'SEALED')->count();
        $disconnectedConnections = (clone $connectionQuery)->where('status', 'DISCONNECTED')->count();

        // 2. Tagihan & Keuangan Periode Berjalan (Bulan Ini)
        $currentMonth = (int) now()->format('m');
        $currentYear = (int) now()->format('Y');

        $invoiceQuery = Invoice::query()
            ->whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear);

        if ($targetKpspamsId) {
            $invoiceQuery->where('kpspams_id', $targetKpspamsId);
        }

        $totalBilled = (float) (clone $invoiceQuery)->sum('total_amount');
        $totalCollected = (float) (clone $invoiceQuery)->sum('paid_amount');
        $totalArrears = (float) (clone $invoiceQuery)->sum('balance_due');
        $totalUsageM3 = (float) (clone $invoiceQuery)->sum('usage_m3');

        $collectionRate = $totalBilled > 0 ? round(($totalCollected / $totalBilled) * 100, 1) : 0.0;

        // 3. Saldo Kas & Bank
        $cashQuery = CashAccount::query()->where('is_active', true);
        if ($targetKpspamsId) {
            $cashQuery->where('kpspams_id', $targetKpspamsId);
        }
        $totalCash = (float) $cashQuery->sum('current_balance');

        // 4. Pengaduan Aktif
        $complaintQuery = Complaint::query()->whereIn('status', ['RECEIVED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']);
        if ($targetKpspamsId) {
            $complaintQuery->where('kpspams_id', $targetKpspamsId);
        }
        $activeComplaints = $complaintQuery->count();

        // 5. Rincian Per Dusun
        $dusunBreakdown = Dusun::withCount(['connections' => function ($q) use ($targetKpspamsId) {
            if ($targetKpspamsId) {
                $q->where('kpspams_id', $targetKpspamsId);
            }
        }])->get()->map(function ($d) {
            return [
                'dusun_id' => $d->id,
                'code' => $d->code,
                'name' => $d->name,
                'total_connections' => $d->connections_count,
            ];
        });

        // 6. Rincian Per Unit KPSPAMS (untuk tampilan agregat Desa)
        $unitBreakdown = [];
        if ($targetKpspamsId === null) {
            $unitBreakdown = Kpspams::with(['dusuns'])->get()->map(function ($unit) use ($currentMonth, $currentYear) {
                $inv = Invoice::where('kpspams_id', $unit->id)
                    ->whereMonth('invoice_date', $currentMonth)
                    ->whereYear('invoice_date', $currentYear);

                return [
                    'kpspams_id' => $unit->id,
                    'code' => $unit->code,
                    'name' => $unit->name,
                    'dusuns' => $unit->dusuns->pluck('name'),
                    'total_customers' => Customer::where('kpspams_id', $unit->id)->count(),
                    'total_billed' => (float) (clone $inv)->sum('total_amount'),
                    'total_collected' => (float) (clone $inv)->sum('paid_amount'),
                    'total_arrears' => (float) (clone $inv)->sum('balance_due'),
                    'cash_balance' => (float) CashAccount::where('kpspams_id', $unit->id)->sum('current_balance'),
                ];
            });
        }

        return $this->sendResponse([
            'context' => [
                'kpspams_id' => $targetKpspamsId,
                'scope_label' => $targetKpspamsId ? Kpspams::find($targetKpspamsId)?->name : 'Konsolidasi Seluruh Desa Kuajang',
                'period' => now()->translatedFormat('F Y'),
            ],
            'kpi' => [
                'total_customers' => $totalCustomers,
                'active_connections' => $activeConnections,
                'sealed_connections' => $sealedConnections,
                'disconnected_connections' => $disconnectedConnections,
                'total_usage_m3' => $totalUsageM3,
                'total_billed' => $totalBilled,
                'total_collected' => $totalCollected,
                'total_arrears' => $totalArrears,
                'collection_rate_percent' => $collectionRate,
                'total_cash_balance' => $totalCash,
                'active_complaints' => $activeComplaints,
            ],
            'dusun_breakdown' => $dusunBreakdown,
            'unit_breakdown' => $unitBreakdown,
        ], 'Ringkasan dashboard berhasil diambil.');
    }
}
