<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\BillingPeriod;
use App\Models\Connection;
use App\Models\MeterReading;
use App\Models\AuditLog;
use App\Services\BillingEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class BillingPeriodController extends BaseApiController
{
    public function __construct(
        protected BillingEngineService $billingEngine
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = BillingPeriod::with(['kpspams'])
            ->withCount(['meterReadings', 'invoices']);

        if ($request->filled('year')) {
            $query->where('year', $request->integer('year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $periods = $query->orderBy('year', 'desc')->orderBy('month', 'desc')->get();

        return $this->sendResponse($periods, 'Daftar periode tagihan berhasil dimuat.');
    }

    public function show(int $id): JsonResponse
    {
        $period = BillingPeriod::with(['kpspams'])
            ->withCount(['meterReadings', 'invoices'])
            ->findOrFail($id);

        return $this->sendResponse($period, 'Detail periode tagihan berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'year' => 'required|integer|min:2020|max:2050',
            'month' => 'required|integer|min:1|max:12',
            'name' => 'required|string|max:100',
            'reading_start_date' => 'required|date',
            'reading_end_date' => 'required|date|after_or_equal:reading_start_date',
            'billing_date' => 'required|date|after:reading_end_date',
            'due_date' => 'required|date|after:billing_date',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi periode tagihan gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $periodCode = sprintf('%04d%02d', $request->input('year'), $request->input('month'));

        // Cek duplikasi
        $existing = BillingPeriod::where('kpspams_id', $kpspamsId)
            ->where('period_code', $periodCode)
            ->first();

        if ($existing) {
            return $this->sendError("Periode {$periodCode} sudah terdaftar untuk unit KPSPAMS ini.", [], 409);
        }

        $period = BillingPeriod::create([
            'kpspams_id' => $kpspamsId,
            'period_code' => $periodCode,
            'name' => $request->input('name'),
            'year' => $request->input('year'),
            'month' => $request->input('month'),
            'reading_start_date' => $request->input('reading_start_date'),
            'reading_end_date' => $request->input('reading_end_date'),
            'billing_date' => $request->input('billing_date'),
            'due_date' => $request->input('due_date'),
            'status' => 'OPEN',
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_BILLING_PERIOD',
            'entity' => 'BillingPeriod',
            'entity_id' => $period->id,
            'new_values' => $period->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($period, 'Periode tagihan baru berhasil dibuka.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $period = BillingPeriod::findOrFail($id);

        if ($period->status === 'CLOSED') {
            return $this->sendError('Periode yang sudah berstatus CLOSED tidak dapat diubah.', [], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'reading_start_date' => 'sometimes|required|date',
            'reading_end_date' => 'sometimes|required|date',
            'billing_date' => 'sometimes|required|date',
            'due_date' => 'sometimes|required|date',
            'status' => 'sometimes|in:OPEN,READING,BILLED,CLOSED',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $old = $period->toArray();
        $period->update($request->only([
            'name', 'reading_start_date', 'reading_end_date', 'billing_date', 'due_date', 'status'
        ]));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $period->kpspams_id,
            'action' => 'UPDATE_BILLING_PERIOD',
            'entity' => 'BillingPeriod',
            'entity_id' => $period->id,
            'old_values' => $old,
            'new_values' => $period->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($period, 'Periode tagihan berhasil diperbarui.');
    }

    public function generateInvoices(Request $request, int $id): JsonResponse
    {
        $period = BillingPeriod::findOrFail($id);

        if ($period->status === 'CLOSED') {
            return $this->sendError('Tidak dapat menghasilkan tagihan pada periode yang telah ditutup.', [], 400);
        }

        // Ambil semua pembacaan meter yang valid pada periode ini yang belum diterbitkan invoice-nya
        $readings = MeterReading::with(['connection.customer'])
            ->where('billing_period_id', $period->id)
            ->whereIn('status', ['VERIFIED', 'PENDING'])
            ->whereDoesntHave('invoice')
            ->get();

        if ($readings->isEmpty()) {
            return $this->sendError('Tidak ada data pembacaan meter yang siap ditagihkan untuk periode ini.', [], 400);
        }

        $generatedInvoices = [];
        $failedCount = 0;
        $errors = [];

        foreach ($readings as $reading) {
            try {
                $invoice = $this->billingEngine->generateInvoice($reading->connection, $period, $reading);
                $reading->update(['status' => 'INVOICED']);
                $generatedInvoices[] = $invoice;
            } catch (\Throwable $e) {
                $failedCount++;
                $errors[] = [
                    'connection_id' => $reading->connection_id,
                    'connection_number' => $reading->connection->connection_number,
                    'message' => $e->getMessage(),
                ];
            }
        }

        // Update status periode menjadi BILLED jika minimal ada 1 invoice
        if (!empty($generatedInvoices)) {
            $period->update(['status' => 'BILLED']);
        }

        $totalBillingAmount = array_reduce($generatedInvoices, fn($carry, $inv) => $carry + (float) $inv->total_amount, 0.0);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $period->kpspams_id,
            'action' => 'GENERATE_BATCH_INVOICES',
            'entity' => 'BillingPeriod',
            'entity_id' => $period->id,
            'new_values' => [
                'generated_count' => count($generatedInvoices),
                'total_amount' => $totalBillingAmount,
                'failed_count' => $failedCount,
            ],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse([
            'generated_count' => count($generatedInvoices),
            'total_amount' => $totalBillingAmount,
            'failed_count' => $failedCount,
            'errors' => $errors,
        ], 'Batch penerbitan tagihan selesai diproses.');
    }

    public function closePeriod(Request $request, int $id): JsonResponse
    {
        $period = BillingPeriod::findOrFail($id);

        $period->update(['status' => 'CLOSED']);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $period->kpspams_id,
            'action' => 'CLOSE_BILLING_PERIOD',
            'entity' => 'BillingPeriod',
            'entity_id' => $period->id,
            'new_values' => ['status' => 'CLOSED'],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($period, 'Periode tagihan berhasil ditutup.');
    }
}
