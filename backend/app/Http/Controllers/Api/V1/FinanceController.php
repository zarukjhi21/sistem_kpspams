<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CashAccount;
use App\Models\FinancialTransaction;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class FinanceController extends BaseApiController
{
    public function cashAccounts(Request $request): JsonResponse
    {
        $accounts = CashAccount::with('kpspams')
            ->where('is_active', true)
            ->get();

        $totalBalance = $accounts->sum('current_balance');

        return $this->sendResponse([
            'total_balance' => $totalBalance,
            'accounts' => $accounts,
        ], 'Daftar akun kas & bank KPSPAMS berhasil dimuat.');
    }

    public function storeCashAccount(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'account_code' => 'required|string|max:20|unique:cash_accounts,account_code',
            'account_name' => 'required|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'opening_balance' => 'required|numeric|min:0',
            'opening_balance_date' => 'required|date',
            'opening_balance_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi akun kas gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $openBal = (float) $request->input('opening_balance');

        $account = CashAccount::create([
            'kpspams_id' => $kpspamsId,
            'account_code' => $request->input('account_code'),
            'account_name' => $request->input('account_name'),
            'bank_name' => $request->input('bank_name'),
            'account_number' => $request->input('account_number'),
            'opening_balance' => $openBal,
            'opening_balance_date' => $request->input('opening_balance_date'),
            'opening_balance_notes' => $request->input('opening_balance_notes'),
            'current_balance' => $openBal,
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_CASH_ACCOUNT',
            'entity' => 'CashAccount',
            'entity_id' => $account->id,
            'new_values' => $account->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($account, 'Akun kas baru berhasil ditambahkan.', 201);
    }

    public function setOpeningBalance(Request $request, int $id): JsonResponse
    {
        $account = CashAccount::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'opening_balance' => 'required|numeric|min:0',
            'opening_balance_date' => 'required|date',
            'notes' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembaharuan saldo awal gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $account = DB::transaction(function () use ($account, $request, $user) {
            $old = $account->toArray();
            $newOpenBal = (float) $request->input('opening_balance');
            $diff = $newOpenBal - (float) $account->opening_balance;

            $account->update([
                'opening_balance' => $newOpenBal,
                'opening_balance_date' => $request->input('opening_balance_date'),
                'opening_balance_notes' => $request->input('notes'),
                'current_balance' => max(0, (float) $account->current_balance + $diff),
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $account->kpspams_id,
                'action' => 'SET_OPENING_BALANCE',
                'entity' => 'CashAccount',
                'entity_id' => $account->id,
                'old_values' => $old,
                'new_values' => $account->getChanges(),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $account;
        });

        return $this->sendResponse($account, 'Saldo awal (Opening Balance) akun kas berhasil diperbarui.');
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = FinancialTransaction::with(['cashAccount', 'creator']);

        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->query('transaction_type'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('cash_account_id')) {
            $query->where('cash_account_id', $request->query('cash_account_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->query('date_to'));
        }

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 25));

        return $this->sendResponse($transactions->items(), 'Daftar transaksi arus kas berhasil dimuat.', 200, [
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'total' => $transactions->total(),
        ]);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cash_account_id' => 'required|exists:cash_accounts,id',
            'transaction_type' => 'required|in:INCOME,EXPENSE',
            'category' => 'required|string|max:50',
            'amount' => 'required|numeric|min:1',
            'transaction_date' => 'required|date',
            'description' => 'required|string|min:5',
            'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi transaksi keuangan gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $receiptPath = null;
        if ($request->hasFile('receipt_file')) {
            $receiptPath = $request->file('receipt_file')->store('receipt_attachments', 'public');
        }

        $tx = DB::transaction(function () use ($request, $user, $receiptPath) {
            $account = CashAccount::where('id', $request->input('cash_account_id'))->lockForUpdate()->firstOrFail();
            $amount = (float) $request->input('amount');
            $type = $request->input('transaction_type');

            if ($type === 'EXPENSE') {
                if ($account->current_balance < $amount) {
                    throw new \Exception("Saldo kas {$account->account_name} tidak mencukupi untuk pengeluaran ini. Saldo: Rp " . number_format($account->current_balance, 0, ',', '.'));
                }
                $account->decrement('current_balance', $amount);
            } else {
                $account->increment('current_balance', $amount);
            }

            $txNumber = 'TX-' . strtoupper(substr($type, 0, 3)) . '-' . now()->format('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

            $tx = FinancialTransaction::create([
                'kpspams_id' => $account->kpspams_id,
                'cash_account_id' => $account->id,
                'transaction_number' => $txNumber,
                'transaction_date' => $request->input('transaction_date'),
                'transaction_type' => $type,
                'category' => $request->input('category'),
                'amount' => $amount,
                'reference_type' => 'MANUAL_ENTRY',
                'reference_id' => null,
                'description' => $request->input('description'),
                'receipt_attachment_path' => $receiptPath,
                'created_by' => $user->id,
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $account->kpspams_id,
                'action' => 'STORE_FINANCIAL_TRANSACTION',
                'entity' => 'FinancialTransaction',
                'entity_id' => $tx->id,
                'new_values' => $tx->toArray(),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $tx;
        });

        return $this->sendResponse($tx->load(['cashAccount', 'creator']), 'Transaksi keuangan berhasil dibukukan.', 201);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_account_id' => 'required|exists:cash_accounts,id',
            'to_account_id' => 'required|exists:cash_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:1',
            'transfer_date' => 'required|date',
            'notes' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pemindahan kas gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $res = DB::transaction(function () use ($request, $user) {
            $fromAcc = CashAccount::where('id', $request->input('from_account_id'))->lockForUpdate()->firstOrFail();
            $toAcc = CashAccount::where('id', $request->input('to_account_id'))->lockForUpdate()->firstOrFail();
            $amount = (float) $request->input('amount');

            if ($fromAcc->current_balance < $amount) {
                throw new \Exception("Saldo pada akun sumber ({$fromAcc->account_name}) tidak mencukupi. Saldo saat ini: Rp " . number_format($fromAcc->current_balance, 0, ',', '.'));
            }

            // Potong sumber dan tambah tujuan
            $fromAcc->decrement('current_balance', $amount);
            $toAcc->increment('current_balance', $amount);

            $transferRef = 'TRF-' . now()->format('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

            // Catat pengeluaran dari sumber
            $txOut = FinancialTransaction::create([
                'kpspams_id' => $fromAcc->kpspams_id,
                'cash_account_id' => $fromAcc->id,
                'transaction_number' => $transferRef . '-OUT',
                'transaction_date' => $request->input('transfer_date'),
                'transaction_type' => 'EXPENSE',
                'category' => 'TRANSFER_ANTAR_KAS',
                'amount' => $amount,
                'reference_type' => 'INTERNAL_TRANSFER',
                'reference_id' => null,
                'description' => "Transfer ke {$toAcc->account_name}: " . $request->input('notes'),
                'created_by' => $user->id,
            ]);

            // Catat penerimaan di tujuan
            $txIn = FinancialTransaction::create([
                'kpspams_id' => $toAcc->kpspams_id,
                'cash_account_id' => $toAcc->id,
                'transaction_number' => $transferRef . '-IN',
                'transaction_date' => $request->input('transfer_date'),
                'transaction_type' => 'INCOME',
                'category' => 'TRANSFER_ANTAR_KAS',
                'amount' => $amount,
                'reference_type' => 'INTERNAL_TRANSFER',
                'reference_id' => null,
                'description' => "Transfer masuk dari {$fromAcc->account_name}: " . $request->input('notes'),
                'created_by' => $user->id,
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $fromAcc->kpspams_id,
                'action' => 'INTERNAL_CASH_TRANSFER',
                'entity' => 'CashAccount',
                'entity_id' => $fromAcc->id,
                'new_values' => [
                    'from' => $fromAcc->account_name,
                    'to' => $toAcc->account_name,
                    'amount' => $amount,
                    'transfer_ref' => $transferRef,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return [
                'out_transaction' => $txOut,
                'in_transaction' => $txIn,
                'from_account_new_balance' => $fromAcc->current_balance,
                'to_account_new_balance' => $toAcc->current_balance,
            ];
        });

        return $this->sendResponse($res, 'Pemindahan dana antar akun kas berhasil diselesaikan.');
    }
}
