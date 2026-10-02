<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentReversal;
use App\Models\CashAccount;
use App\Models\FinancialTransaction;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentProcessingService
{
    /**
     * Memproses pelunasan pembayaran kasir secara atomik.
     */
    public function processPayment(Invoice $invoice, float $amount, int $cashAccountId, int $userId, string $method = 'CASH', ?string $refNumber = null): Payment
    {
        return DB::transaction(function () use ($invoice, $amount, $cashAccountId, $userId, $method, $refNumber) {
            // 1. Lock invoice row untuk mencegah pembayaran ganda (Race condition defense)
            $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->firstOrFail();

            if ($lockedInvoice->status === 'PAID') {
                throw new Exception("Tagihan ini sudah lunas.");
            }

            if ($amount <= 0) {
                throw new Exception("Nominal pembayaran harus lebih besar dari 0.");
            }

            if ($amount > $lockedInvoice->balance_due) {
                $formattedAmount = number_format($amount, 0, ',', '.');
                $formattedDue = number_format($lockedInvoice->balance_due, 0, ',', '.');
                throw new Exception("Nominal pembayaran (Rp {$formattedAmount}) melebihi sisa tagihan (Rp {$formattedDue}).");
            }

            // Validasi & Kunci Akun Kas (Tenant Isolation & Concurrency Guard)
            $cashAccount = CashAccount::where('id', $cashAccountId)->lockForUpdate()->first();
            if (!$cashAccount || $cashAccount->kpspams_id !== $lockedInvoice->kpspams_id) {
                throw new Exception("Akun kas tidak valid atau berada di luar lingkup KPSPAMS tagihan.");
            }
            if (!$cashAccount->is_active) {
                throw new Exception("Akun kas sedang tidak aktif.");
            }

            // 2. Buat entri pembayaran resmi
            $receiptNumber = $this->generateReceiptNumber($lockedInvoice->kpspams_id);

            $payment = Payment::create([
                'kpspams_id' => $lockedInvoice->kpspams_id,
                'invoice_id' => $lockedInvoice->id,
                'customer_id' => $lockedInvoice->customer_id,
                'cash_account_id' => $cashAccountId,
                'received_by_user_id' => $userId,
                'receipt_number' => $receiptNumber,
                'payment_date' => now(),
                'amount_paid' => $amount,
                'payment_method' => $method,
                'reference_number' => $refNumber,
                'status' => 'SUCCESS',
            ]);

            // 3. Perbarui status invoice
            $lockedInvoice->paid_amount += $amount;
            $lockedInvoice->balance_due = max(0, $lockedInvoice->total_amount - $lockedInvoice->paid_amount);
            $lockedInvoice->status = ($lockedInvoice->balance_due <= 0) ? 'PAID' : 'PARTIALLY_PAID';
            $lockedInvoice->paid_at = ($lockedInvoice->status === 'PAID') ? now() : null;
            $lockedInvoice->save();

            // 4. Tambah saldo pada akun kas unit KPSPAMS
            $cashAccount->increment('current_balance', $amount);

            // 5. Catat mutasi arus kas pemasukan
            FinancialTransaction::create([
                'kpspams_id' => $lockedInvoice->kpspams_id,
                'cash_account_id' => $cashAccountId,
                'transaction_number' => 'TX-IN-' . strtoupper(bin2hex(random_bytes(4))),
                'transaction_date' => now()->toDateString(),
                'transaction_type' => 'INCOME',
                'category' => 'AIR_PAYMENT',
                'amount' => $amount,
                'reference_type' => 'PAYMENT',
                'reference_id' => $payment->id,
                'description' => "Penerimaan pembayaran air tagihan {$lockedInvoice->invoice_number} ({$receiptNumber})",
                'created_by' => $userId,
            ]);

            // 6. Jejak Audit
            AuditLog::create([
                'user_id' => $userId,
                'kpspams_id' => $lockedInvoice->kpspams_id,
                'action' => 'CREATE_PAYMENT',
                'entity' => 'Payment',
                'entity_id' => $payment->id,
                'new_values' => ['receipt_number' => $receiptNumber, 'amount' => $amount, 'method' => $method],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $payment;
        });
    }

    /**
     * Void pembayaran kasir hari yang sama (T+0).
     */
    public function voidPayment(Payment $payment, int $userId, string $reason): void
    {
        DB::transaction(function () use ($payment, $userId, $reason) {
            if ($payment->status !== 'SUCCESS') {
                throw new Exception("Pembayaran ini tidak dapat di-void karena berstatus {$payment->status}.");
            }

            // Validasi T+0 (Hanya boleh pada tanggal yang sama)
            if ($payment->payment_date->toDateString() !== now()->toDateString()) {
                throw new Exception("Pembatalan kasir (VOID) hanya diizinkan pada hari yang sama (T+0). Untuk hari yang berbeda, gunakan mekanisme REVERSAL.");
            }

            // 1. Tandai payment VOIDED (DILARANG HARD DELETE)
            $payment->status = 'VOIDED';
            $payment->notes = ($payment->notes ? $payment->notes . ' | ' : '') . "VOID: {$reason}";
            $payment->save();

            // 2. Kembalikan status invoice
            $invoice = Invoice::findOrFail($payment->invoice_id);
            $invoice->paid_amount = max(0, $invoice->paid_amount - $payment->amount_paid);
            $invoice->balance_due = $invoice->total_amount - $invoice->paid_amount;
            $invoice->status = ($invoice->paid_amount <= 0) ? 'UNPAID' : 'PARTIALLY_PAID';
            $invoice->paid_at = null;
            $invoice->save();

            // 3. Potong kembali saldo akun kas dengan verifikasi kecukupan saldo & pessimistic lock
            $cashAccount = CashAccount::where('id', $payment->cash_account_id)->lockForUpdate()->firstOrFail();
            if ((float) $cashAccount->current_balance < (float) $payment->amount_paid) {
                $formattedBal = number_format((float) $cashAccount->current_balance, 0, ',', '.');
                $formattedAmt = number_format((float) $payment->amount_paid, 0, ',', '.');
                throw new Exception("Saldo akun kas '{$cashAccount->account_name}' tidak mencukupi untuk melakukan pembatalan (VOID). Saldo saat ini: Rp {$formattedBal}, dibutuhkan: Rp {$formattedAmt}.");
            }
            $cashAccount->decrement('current_balance', $payment->amount_paid);

            // 4. Catat mutasi pengurang kas
            FinancialTransaction::create([
                'kpspams_id' => $payment->kpspams_id,
                'cash_account_id' => $payment->cash_account_id,
                'transaction_number' => 'TX-VOID-' . strtoupper(bin2hex(random_bytes(4))),
                'transaction_date' => now()->toDateString(),
                'transaction_type' => 'EXPENSE',
                'category' => 'KOREKSI_VOID',
                'amount' => $payment->amount_paid,
                'reference_type' => 'PAYMENT_VOID',
                'reference_id' => $payment->id,
                'description' => "Koreksi Void Pembayaran {$payment->receipt_number}: {$reason}",
                'created_by' => $userId,
            ]);

            // 5. Catat ke audit log
            AuditLog::create([
                'user_id' => $userId,
                'kpspams_id' => $payment->kpspams_id,
                'action' => 'VOID_PAYMENT',
                'entity' => 'Payment',
                'entity_id' => $payment->id,
                'old_values' => ['status' => 'SUCCESS'],
                'new_values' => ['status' => 'VOIDED', 'reason' => $reason],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Pengajuan pembalikan pembayaran beda hari (Supervised Reversal).
     */
    public function requestReversal(Payment $payment, int $userId, string $reason): PaymentReversal
    {
        if ($payment->status !== 'SUCCESS') {
            throw new Exception("Pembayaran dengan status {$payment->status} tidak dapat diajukan reversal.");
        }

        if (PaymentReversal::where('payment_id', $payment->id)->exists()) {
            throw new Exception("Pengajuan reversal untuk transaksi ini sudah ada dalam antrean persetujuan.");
        }

        $reversal = PaymentReversal::create([
            'payment_id' => $payment->id,
            'kpspams_id' => $payment->kpspams_id,
            'requested_by' => $userId,
            'approved_by' => null,
            'reason' => $reason,
            'reversal_type' => 'SUPERVISED_REVERSAL',
            'created_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $userId,
            'kpspams_id' => $payment->kpspams_id,
            'action' => 'REQUEST_PAYMENT_REVERSAL',
            'entity' => 'PaymentReversal',
            'entity_id' => $reversal->id,
            'new_values' => $reversal->toArray(),
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return $reversal;
    }

    /**
     * Persetujuan resmi reversal oleh Ketua KPSPAMS / Admin Desa.
     */
    public function approveReversal(PaymentReversal $reversal, int $approverId, string $approverName): void
    {
        if ($reversal->approved_by !== null) {
            throw new Exception("Reversal ini sudah disetujui sebelumnya.");
        }

        $payment = $reversal->payment;

        DB::transaction(function () use ($reversal, $payment, $approverId, $approverName) {
            // 1. Update status reversal
            $reversal->approved_by = $approverId;
            $reversal->save();

            // 2. Update payment status
            $payment->status = 'REVERSED';
            $payment->notes = ($payment->notes ? $payment->notes . ' | ' : '') . "REVERSED disetujui oleh {$approverName}: {$reversal->reason}";
            $payment->save();

            // 3. Kembalikan status invoice
            $invoice = Invoice::findOrFail($payment->invoice_id);
            $invoice->paid_amount = max(0, $invoice->paid_amount - $payment->amount_paid);
            $invoice->balance_due = $invoice->total_amount - $invoice->paid_amount;
            $invoice->status = ($invoice->paid_amount <= 0) ? 'UNPAID' : 'PARTIALLY_PAID';
            $invoice->paid_at = null;
            $invoice->save();

            // 4. Koreksi saldo kas dengan verifikasi kecukupan saldo & pessimistic lock
            $cashAccount = CashAccount::where('id', $payment->cash_account_id)->lockForUpdate()->firstOrFail();
            if ((float) $cashAccount->current_balance < (float) $payment->amount_paid) {
                $formattedBal = number_format((float) $cashAccount->current_balance, 0, ',', '.');
                $formattedAmt = number_format((float) $payment->amount_paid, 0, ',', '.');
                throw new Exception("Saldo akun kas '{$cashAccount->account_name}' tidak mencukupi untuk persetujuan pembalikan (REVERSAL). Saldo saat ini: Rp {$formattedBal}, dibutuhkan: Rp {$formattedAmt}.");
            }
            $cashAccount->decrement('current_balance', $payment->amount_paid);

            // 5. Catat mutasi pengurang kas
            FinancialTransaction::create([
                'kpspams_id' => $payment->kpspams_id,
                'cash_account_id' => $payment->cash_account_id,
                'transaction_number' => 'TX-REV-' . strtoupper(bin2hex(random_bytes(4))),
                'transaction_date' => now()->toDateString(),
                'transaction_type' => 'EXPENSE',
                'category' => 'REVERSAL_KAS',
                'amount' => $payment->amount_paid,
                'reference_type' => 'PAYMENT_REVERSAL',
                'reference_id' => $payment->id,
                'description' => "Reversal Pembayaran {$payment->receipt_number} disetujui Ketua: {$reversal->reason}",
                'created_by' => $approverId,
            ]);

            // 6. Jejak Audit
            AuditLog::create([
                'user_id' => $approverId,
                'kpspams_id' => $payment->kpspams_id,
                'action' => 'APPROVE_PAYMENT_REVERSAL',
                'entity' => 'Payment',
                'entity_id' => $payment->id,
                'old_values' => ['status' => 'SUCCESS'],
                'new_values' => ['status' => 'REVERSED', 'approved_by' => $approverName],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });
    }

    protected function generateReceiptNumber(int $kpspamsId): string
    {
        $code = str_pad((string) $kpspamsId, 2, '0', STR_PAD_LEFT);
        $date = now()->format('Ymd');
        $random = strtoupper(bin2hex(random_bytes(3)));
        return "KW/{$date}/KP{$code}/{$random}";
    }
}
