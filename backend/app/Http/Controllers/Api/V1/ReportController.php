<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\MeterReading;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\FinancialTransaction;
use App\Models\CashAccount;
use App\Models\Dusun;
use App\Models\BillingPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseApiController
{
    public function waterConsumption(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id ?? $request->query('kpspams_id');

        $query = MeterReading::with(['connection.dusun', 'connection.customer.customerType', 'billingPeriod']);

        if ($kpspamsId) {
            $query->where('meter_readings.kpspams_id', $kpspamsId);
        }

        if ($request->filled('billing_period_id')) {
            $query->where('billing_period_id', $request->query('billing_period_id'));
        }

        $readings = $query->get();

        $byDusun = $readings->groupBy(fn($r) => $r->connection->dusun->name ?? 'Lainnya')
            ->map(fn($group) => [
                'connection_count' => $group->count(),
                'total_usage_m3' => round($group->sum('usage_m3'), 2),
                'avg_usage_m3' => round($group->avg('usage_m3') ?? 0, 2),
            ]);

        $byCustomerType = $readings->groupBy(fn($r) => $r->connection->customer->customerType->name ?? 'Umum')
            ->map(fn($group) => [
                'connection_count' => $group->count(),
                'total_usage_m3' => round($group->sum('usage_m3'), 2),
                'avg_usage_m3' => round($group->avg('usage_m3') ?? 0, 2),
            ]);

        return $this->sendResponse([
            'summary' => [
                'total_readings' => $readings->count(),
                'total_usage_m3' => round($readings->sum('usage_m3'), 2),
                'avg_usage_m3' => round($readings->avg('usage_m3') ?? 0, 2),
            ],
            'by_dusun' => $byDusun,
            'by_customer_type' => $byCustomerType,
        ], 'Laporan konsumsi air berhasil dihitung.');
    }

    public function billingCollection(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id ?? $request->query('kpspams_id');

        $query = Invoice::with('billingPeriod');

        if ($kpspamsId) {
            $query->where('kpspams_id', $kpspamsId);
        }

        if ($request->filled('billing_period_id')) {
            $query->where('billing_period_id', $request->query('billing_period_id'));
        }

        $invoices = $query->get();

        $totalBilled = $invoices->sum('total_amount');
        $totalCollected = $invoices->sum('paid_amount');
        $totalOutstanding = $invoices->sum('balance_due');
        $collectionRate = ($totalBilled > 0) ? round(($totalCollected / $totalBilled) * 100, 2) : 0.0;

        $byStatus = [
            'PAID' => $invoices->where('status', 'PAID')->count(),
            'PARTIALLY_PAID' => $invoices->where('status', 'PARTIALLY_PAID')->count(),
            'UNPAID' => $invoices->where('status', 'UNPAID')->count(),
        ];

        return $this->sendResponse([
            'total_invoices' => $invoices->count(),
            'total_billed_amount' => $totalBilled,
            'total_collected_amount' => $totalCollected,
            'total_outstanding_amount' => $totalOutstanding,
            'collection_rate_percentage' => $collectionRate,
            'invoices_by_status' => $byStatus,
        ], 'Laporan efektivitas penagihan (Billing & Collection) berhasil dihitung.');
    }

    public function arrearsAging(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id ?? $request->query('kpspams_id');

        $query = Invoice::whereIn('status', ['UNPAID', 'PARTIALLY_PAID']);

        if ($kpspamsId) {
            $query->where('kpspams_id', $kpspamsId);
        }

        $now = now();
        $unpaidInvoices = $query->get();

        $current = 0.0;     // <= 30 hari
        $aging3060 = 0.0;   // 31 - 60 hari (SP1)
        $aging6090 = 0.0;   // 61 - 90 hari (SP2)
        $aging90plus = 0.0; // > 90 hari (Rekomendasi Putus)

        foreach ($unpaidInvoices as $inv) {
            $daysOverdue = max(0, $now->diffInDays($inv->due_date, false) * -1);

            if ($daysOverdue <= 30) {
                $current += $inv->balance_due;
            } elseif ($daysOverdue <= 60) {
                $aging3060 += $inv->balance_due;
            } elseif ($daysOverdue <= 90) {
                $aging6090 += $inv->balance_due;
            } else {
                $aging90plus += $inv->balance_due;
            }
        }

        return $this->sendResponse([
            'total_arrears' => $unpaidInvoices->sum('balance_due'),
            'total_unpaid_invoices' => $unpaidInvoices->count(),
            'aging_buckets' => [
                'current_under_30_days' => ['nominal' => $current, 'label' => 'Jatuh Tempo Lancar (< 30 hari)'],
                'overdue_31_60_days' => ['nominal' => $aging3060, 'label' => 'SP-1 (31 - 60 hari)'],
                'overdue_61_90_days' => ['nominal' => $aging6090, 'label' => 'SP-2 (61 - 90 hari)'],
                'overdue_over_90_days' => ['nominal' => $aging90plus, 'label' => 'Rekomendasi Pemutusan (> 90 hari)'],
            ],
        ], 'Laporan aging tunggakan piutang berhasil dimuat.');
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id ?? $request->query('kpspams_id');

        $query = FinancialTransaction::with('cashAccount');

        if ($kpspamsId) {
            $query->where('kpspams_id', $kpspamsId);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->query('date_to'));
        }

        $transactions = $query->get();

        $income = $transactions->where('transaction_type', 'INCOME');
        $expense = $transactions->where('transaction_type', 'EXPENSE');

        $incomeByCategory = $income->groupBy('category')->map(fn($g) => $g->sum('amount'));
        $expenseByCategory = $expense->groupBy('category')->map(fn($g) => $g->sum('amount'));

        $totalIncome = $income->sum('amount');
        $totalExpense = $expense->sum('amount');
        $netCashFlow = $totalIncome - $totalExpense;

        return $this->sendResponse([
            'summary' => [
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_cash_flow' => $netCashFlow,
            ],
            'income_by_category' => $incomeByCategory,
            'expense_by_category' => $expenseByCategory,
        ], 'Laporan arus kas (Cash Flow) berhasil dimuat.');
    }

    public function exportPdf(Request $request): JsonResponse
    {
        $reportType = $request->query('type', 'general');

        return $this->sendResponse([
            'download_url' => url("/api/v1/reports/render-pdf?type={$reportType}"),
            'file_name' => "Laporan_{$reportType}_" . now()->format('Ymd_His') . ".pdf",
            'format' => 'PDF',
            'generated_at' => now()->toIso8601String(),
        ], 'Ekspor laporan PDF siap diunduh.');
    }

    public function exportExcel(Request $request): JsonResponse
    {
        $reportType = $request->query('type', 'general');

        return $this->sendResponse([
            'download_url' => url("/api/v1/reports/render-excel?type={$reportType}"),
            'file_name' => "Laporan_{$reportType}_" . now()->format('Ymd_His') . ".xlsx",
            'format' => 'XLSX',
            'generated_at' => now()->toIso8601String(),
        ], 'Ekspor laporan Excel siap diunduh.');
    }
}
