<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Invoice;
use App\Models\KpspamsBillingPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['customer', 'connection.dusun', 'billingPeriod']);

        if ($request->filled('billing_period_id')) {
            $query->where('billing_period_id', $request->query('billing_period_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('dusun_id')) {
            $query->whereHas('connection', function ($q) use ($request) {
                $q->where('dusun_id', $request->query('dusun_id'));
            });
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('invoice_number', 'like', "%{$s}%")
                  ->orWhereHas('customer', function ($sq) use ($s) {
                      $sq->where('full_name', 'like', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%");
                  })
                  ->orWhereHas('connection', function ($sq) use ($s) {
                      $sq->where('connection_no', 'like', "%{$s}%");
                  });
            });
        }

        $invoices = $query->orderBy('invoice_date', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($invoices->items(), 'Daftar tagihan berhasil dimuat.', 200, [
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'total' => $invoices->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = Invoice::with([
            'items',
            'customer.customerType',
            'connection.dusun',
            'connection.meter',
            'meterReading',
            'billingPeriod',
            'payments.receivedBy',
            'payments.cashAccount'
        ])->findOrFail($id);

        return $this->sendResponse($invoice, 'Detail tagihan berhasil dimuat.');
    }

    public function arrears(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->query('kpspams_id');
        }

        $policy = null;
        if ($kpspamsId) {
            $policy = KpspamsBillingPolicy::where('kpspams_id', $kpspamsId)->first();
        }

        $sp1Threshold = $policy->sp1_arrears_months ?? 1;
        $sp2Threshold = $policy->sp2_arrears_months ?? 2;
        $disconnectThreshold = $policy->disconnect_recommendation_months ?? 3;

        // Ambil sambungan yang memiliki invoice belum lunas
        $query = Invoice::with(['customer', 'connection.dusun', 'billingPeriod'])
            ->whereIn('status', ['UNPAID', 'PARTIALLY_PAID']);

        if ($kpspamsId) {
            $query->where('kpspams_id', $kpspamsId);
        }

        if ($request->filled('dusun_id')) {
            $query->whereHas('connection', function ($q) use ($request) {
                $q->where('dusun_id', $request->query('dusun_id'));
            });
        }

        $unpaidInvoices = $query->orderBy('due_date', 'asc')->get();

        // Kelompokkan per sambungan rumah
        $arrearsByConnection = $unpaidInvoices->groupBy('connection_id')->map(function ($invoices, $connectionId) use ($sp1Threshold, $sp2Threshold, $disconnectThreshold) {
            $first = $invoices->first();
            $connection = $first->connection;
            $customer = $first->customer;
            $totalArrears = $invoices->sum('balance_due');
            $monthsCount = $invoices->count();

            $statusNotice = 'NORMAL';
            if ($monthsCount >= $disconnectThreshold) {
                $statusNotice = 'REKOMENDASI_PUTUS';
            } elseif ($monthsCount >= $sp2Threshold) {
                $statusNotice = 'PERINGATAN_SP2';
            } elseif ($monthsCount >= $sp1Threshold) {
                $statusNotice = 'PERINGATAN_SP1';
            }

            return [
                'connection_id' => (int) $connectionId,
                'connection_no' => $connection->connection_no,
                'connection_number' => $connection->connection_no,
                'customer_name' => $customer->full_name,
                'customer_code' => $customer->code,
                'phone' => $customer->phone,
                'dusun_name' => $connection->dusun->name,
                'unpaid_months_count' => $monthsCount,
                'total_arrears_amount' => $totalArrears,
                'status_notice' => $statusNotice,
                'oldest_due_date' => $invoices->min('due_date'),
                'invoices' => $invoices->map(fn($inv) => [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'period' => $inv->billingPeriod->name,
                    'due_date' => $inv->due_date,
                    'balance_due' => $inv->balance_due,
                    'status' => $inv->status,
                ]),
            ];
        })->values();

        return $this->sendResponse([
            'summary' => [
                'total_connections_in_arrears' => $arrearsByConnection->count(),
                'total_arrears_nominal' => $arrearsByConnection->sum('total_arrears_amount'),
                'sp1_count' => $arrearsByConnection->where('status_notice', 'PERINGATAN_SP1')->count(),
                'sp2_count' => $arrearsByConnection->where('status_notice', 'PERINGATAN_SP2')->count(),
                'disconnect_recommendations_count' => $arrearsByConnection->where('status_notice', 'REKOMENDASI_PUTUS')->count(),
            ],
            'records' => $arrearsByConnection,
        ], 'Laporan tunggakan dan aging piutang berhasil dimuat.');
    }

    public function downloadPdf(int $id): JsonResponse
    {
        $invoice = Invoice::with([
            'items',
            'customer.customerType',
            'connection.dusun',
            'connection.meter',
            'meterReading',
            'billingPeriod',
            'kpspams'
        ])->findOrFail($id);

        return $this->sendResponse([
            'invoice' => $invoice,
            'printable_url' => url("/api/v1/invoices/{$id}/render-print"),
            'watermark' => ($invoice->status === 'PAID') ? 'LUNAS' : 'BELUM LUNAS',
        ], 'Data cetak invoice berhasil dimuat.');
    }
}
