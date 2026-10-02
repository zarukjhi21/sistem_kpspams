<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Payment;
use App\Models\PaymentReversal;
use App\Models\Invoice;
use App\Models\CashAccount;
use App\Models\FinancialTransaction;
use App\Models\AuditLog;
use App\Services\PaymentProcessingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PaymentController extends BaseApiController
{
    public function __construct(
        protected PaymentProcessingService $paymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['invoice.billingPeriod', 'customer', 'cashAccount', 'receivedBy', 'reversal']);

        if ($request->filled('date_from')) {
            $query->whereDate('payment_date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('payment_date', '<=', $request->query('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('receipt_number', 'like', "%{$s}%")
                  ->orWhereHas('customer', function ($sq) use ($s) {
                      $sq->where('full_name', 'ilike', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%");
                  });
            });
        }

        $payments = $query->orderBy('payment_date', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($payments->items(), 'Daftar riwayat pembayaran kasir berhasil dimuat.', 200, [
            'current_page' => $payments->currentPage(),
            'last_page' => $payments->lastPage(),
            'total' => $payments->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $payment = Payment::with([
            'invoice.items',
            'invoice.billingPeriod',
            'customer',
            'cashAccount',
            'receivedBy',
            'reversal.requester',
            'reversal.approver'
        ])->findOrFail($id);

        return $this->sendResponse($payment, 'Detail transaksi pembayaran kasir berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            'cash_account_id' => 'required|exists:cash_accounts,id',
            'amount_paid' => 'required|numeric|min:1',
            'payment_method' => 'required|in:CASH,TRANSFER,QRIS',
            'reference_number' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembayaran kasir gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $invoice = Invoice::findOrFail($request->input('invoice_id'));

        if ($invoice->status === 'PAID') {
            return $this->sendError('Tagihan ini sudah lunas.', [], 400);
        }

        $amount = (float) $request->input('amount_paid');
        if ($amount > $invoice->balance_due) {
            return $this->sendError("Nominal pembayaran (Rp " . number_format($amount, 0, ',', '.') . ") melebihi sisa tagihan (Rp " . number_format($invoice->balance_due, 0, ',', '.') . ").", [], 422);
        }

        try {
            $payment = $this->paymentService->processPayment(
                invoice: $invoice,
                amount: $amount,
                cashAccountId: (int) $request->input('cash_account_id'),
                userId: $user->id,
                method: $request->input('payment_method'),
                refNumber: $request->input('reference_number')
            );

            return $this->sendResponse($payment->load(['invoice', 'customer', 'cashAccount', 'receivedBy']), 'Pembayaran kasir berhasil diproses.', 201);
        } catch (\Throwable $e) {
            return $this->sendError('Gagal memproses pembayaran: ' . $e->getMessage(), [], 500);
        }
    }

    public function voidToday(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Alasan pembatalan (VOID) wajib diisi.', $validator->errors(), 422);
        }

        $payment = Payment::findOrFail($id);
        $user = $request->user();

        try {
            $this->paymentService->voidPayment($payment, $user->id, $request->input('reason'));

            return $this->sendResponse($payment->fresh(), 'Pembayaran kasir (T+0) berhasil dibatalkan (VOID).');
        } catch (\Throwable $e) {
            return $this->sendError($e->getMessage(), [], 400);
        }
    }

    public function requestReversal(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Alasan pengajuan reversal harus diisi minimal 10 karakter.', $validator->errors(), 422);
        }

        $payment = Payment::findOrFail($id);

        try {
            $reversal = $this->paymentService->requestReversal($payment, (int) $request->user()->id, $request->input('reason'));
            return $this->sendResponse($reversal, 'Pengajuan reversal pembayaran berhasil dicatat dan menunggu persetujuan pengawas/ketua.', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), [], 400);
        }
    }

    public function approveReversal(Request $request, int $id): JsonResponse
    {
        $reversal = PaymentReversal::with('payment')->findOrFail($id);
        $user = $request->user();

        // Validasi otoritas: hanya ketua_kpspams, admin_desa, super_admin
        if (!$user->hasRole('ketua_kpspams') && !$user->isDesaLevel() && !$user->isSuperAdmin()) {
            return $this->sendError('Akses ditolak. Persetujuan reversal hanya dapat dilakukan oleh Pengawas / Ketua KPSPAMS.', [], 403);
        }

        try {
            $this->paymentService->approveReversal($reversal, (int) $user->id, $user->name);
            return $this->sendResponse($reversal->fresh(['payment', 'approver']), 'Reversal pembayaran berhasil disetujui dan saldo telah disesuaikan.');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), [], 400);
        }
    }

    public function receiptPdf(int $id): JsonResponse
    {
        $payment = Payment::with([
            'invoice.billingPeriod',
            'invoice.items',
            'customer',
            'cashAccount',
            'receivedBy',
            'kpspams'
        ])->findOrFail($id);

        return $this->sendResponse([
            'payment' => $payment,
            'qr_verification_string' => "KUAJANG-KPSPAMS:{$payment->receipt_number}:{$payment->amount_paid}:{$payment->created_at->timestamp}",
            'printable_url' => url("/api/v1/payments/{$id}/render-receipt"),
        ], 'Data kwitansi pembayaran berhasil dimuat.');
    }
}
