<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\MeterReading;
use App\Models\Connection;
use App\Models\BillingPeriod;
use App\Models\AuditLog;
use App\Services\MeterAnomalyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MeterReadingController extends BaseApiController
{
    public function __construct(
        protected MeterAnomalyService $anomalyService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = MeterReading::with(['connection.customer', 'connection.dusun', 'meter', 'reader', 'verifier']);

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
            $query->whereHas('connection', function ($q) use ($s) {
                $q->where('connection_no', 'like', "%{$s}%")
                  ->orWhereHas('customer', function ($sq) use ($s) {
                      $sq->where('full_name', 'ilike', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%");
                  });
            });
        }

        $readings = $query->orderBy('reading_date', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($readings->items(), 'Daftar pembacaan meter berhasil dimuat.', 200, [
            'current_page' => $readings->currentPage(),
            'last_page' => $readings->lastPage(),
            'total' => $readings->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $reading = MeterReading::with(['connection.customer', 'connection.dusun', 'meter', 'reader', 'verifier', 'invoice'])
            ->findOrFail($id);

        return $this->sendResponse($reading, 'Detail pembacaan meter berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'connection_id' => 'required|exists:connections,id',
            'billing_period_id' => 'required|exists:billing_periods,id',
            'current_reading' => 'required|numeric|min:0',
            'reading_date' => 'required|date',
            'meter_photo' => 'nullable|image|max:5120', // max 5MB
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input catat meter gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $connection = Connection::with('meter')->findOrFail($request->input('connection_id'));

        if (!$connection->meter_id) {
            return $this->sendError('Sambungan rumah ini belum memiliki meter air aktif.', [], 422);
        }

        $billingPeriod = BillingPeriod::findOrFail($request->input('billing_period_id'));
        if ($billingPeriod->kpspams_id !== $connection->kpspams_id) {
            return $this->sendError('Periode tagihan tidak sesuai dengan lingkup KPSPAMS sambungan ini.', [], 422);
        }

        // Cek duplikasi catat meter di periode yang sama
        $existing = MeterReading::where('connection_id', $connection->id)
            ->where('billing_period_id', $billingPeriod->id)
            ->first();

        if ($existing) {
            return $this->sendError('Pembacaan meter untuk sambungan ini pada periode yang dipilih sudah pernah dicatat.', [], 409);
        }

        // Ambil stand meter sebelumnya (dari reading terakhir atau initial_reading meter)
        $lastReading = MeterReading::where('connection_id', $connection->id)
            ->latest('reading_date')
            ->first();

        $previousReading = $lastReading ? (float) $lastReading->current_reading : (float) ($connection->meter->initial_reading ?? 0);
        $currentReading = (float) $request->input('current_reading');

        // Evaluasi anomali
        $eval = $this->anomalyService->evaluateReading($connection, $previousReading, $currentReading);

        // Upload foto jika ada
        $photoPath = null;
        if ($request->hasFile('meter_photo')) {
            $photoPath = $request->file('meter_photo')->store('meter_photos', 'public');
        }

        $reading = MeterReading::create([
            'kpspams_id' => $connection->kpspams_id,
            'billing_period_id' => $request->input('billing_period_id'),
            'connection_id' => $connection->id,
            'meter_id' => $connection->meter_id,
            'reader_user_id' => $user->id,
            'reading_date' => $request->input('reading_date'),
            'previous_reading' => $previousReading,
            'current_reading' => $currentReading,
            'usage_m3' => $eval['usage_m3'],
            'meter_photo_path' => $photoPath,
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'status' => $eval['status'],
            'anomaly_reason' => $eval['message'],
            'notes' => $request->input('notes'),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $connection->kpspams_id,
            'action' => 'STORE_METER_READING',
            'entity' => 'MeterReading',
            'entity_id' => $reading->id,
            'new_values' => [
                'current_reading' => $currentReading,
                'previous_reading' => $previousReading,
                'usage_m3' => $eval['usage_m3'],
                'status' => $eval['status'],
            ],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($reading, 'Catat meter berhasil disimpan. Status: ' . $eval['status'], 201);
    }

    public function routeBatch(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->query('kpspams_id');
        }

        $periodId = $request->query('billing_period_id');
        if (!$periodId) {
            $activePeriod = BillingPeriod::where('kpspams_id', $kpspamsId)->where('is_closed', false)->latest()->first();
            $periodId = $activePeriod?->id;
        }

        $query = Connection::with(['customer', 'dusun', 'meter'])
            ->where('status', 'ACTIVE');

        if ($kpspamsId) {
            $query->where('kpspams_id', $kpspamsId);
        }

        if ($request->filled('dusun_id')) {
            $query->where('dusun_id', $request->query('dusun_id'));
        }

        $connections = $query->orderBy('connection_no')->get();

        $routes = $connections->map(function ($conn) use ($periodId) {
            $currentReading = null;
            if ($periodId) {
                $currentReading = MeterReading::where('connection_id', $conn->id)
                    ->where('billing_period_id', $periodId)
                    ->first();
            }

            $lastReading = MeterReading::where('connection_id', $conn->id)
                ->where('billing_period_id', '!=', $periodId)
                ->latest('reading_date')
                ->first();

            return [
                'connection_id' => $conn->id,
                'connection_no' => $conn->connection_no,
                'connection_number' => $conn->connection_no,
                'customer_name' => $conn->customer->full_name,
                'customer_code' => $conn->customer->code,
                'dusun_name' => $conn->dusun->name,
                'install_address' => $conn->address_detail,
                'meter_serial' => $conn->meter?->serial_number,
                'previous_reading' => $lastReading ? $lastReading->current_reading : ($conn->meter?->initial_reading ?? 0),
                'is_read' => $currentReading !== null,
                'current_reading_data' => $currentReading,
            ];
        });

        return $this->sendResponse($routes, 'Daftar rute pembacaan meter berhasil dimuat.');
    }

    public function syncBatch(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'readings' => 'required|array|min:1',
            'readings.*.connection_id' => 'required|exists:connections,id',
            'readings.*.billing_period_id' => 'required|exists:billing_periods,id',
            'readings.*.current_reading' => 'required|numeric|min:0',
            'readings.*.reading_date' => 'required|date',
            'readings.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi sinkronisasi massal gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $items = $request->input('readings');
        $synced = [];
        $errors = [];

        foreach ($items as $idx => $item) {
            try {
                $connection = Connection::with('meter')->findOrFail($item['connection_id']);

                $lastReading = MeterReading::where('connection_id', $connection->id)
                    ->latest('reading_date')
                    ->first();

                $previousReading = $lastReading ? (float) $lastReading->current_reading : (float) ($connection->meter->initial_reading ?? 0);
                $currentReading = (float) $item['current_reading'];

                $eval = $this->anomalyService->evaluateReading($connection, $previousReading, $currentReading);

                $reading = MeterReading::updateOrCreate(
                    [
                        'connection_id' => $connection->id,
                        'billing_period_id' => $item['billing_period_id'],
                    ],
                    [
                        'kpspams_id' => $connection->kpspams_id,
                        'meter_id' => $connection->meter_id,
                        'reader_user_id' => $user->id,
                        'reading_date' => $item['reading_date'],
                        'previous_reading' => $previousReading,
                        'current_reading' => $currentReading,
                        'usage_m3' => $eval['usage_m3'],
                        'status' => $eval['status'],
                        'anomaly_reason' => $eval['message'],
                        'notes' => $item['notes'] ?? null,
                    ]
                );

                $synced[] = $reading;
            } catch (\Throwable $e) {
                $errors[] = [
                    'index' => $idx,
                    'connection_id' => $item['connection_id'],
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $this->sendResponse([
            'synced_count' => count($synced),
            'failed_count' => count($errors),
            'errors' => $errors,
        ], 'Sinkronisasi data catat meter berhasil diproses.');
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $reading = MeterReading::findOrFail($id);
        $user = $request->user();

        $reading->update([
            'status' => 'VERIFIED',
            'verified_by' => $user->id,
            'verified_at' => now(),
            'notes' => ($reading->notes ? $reading->notes . ' | ' : '') . 'Diverifikasi manual oleh ' . $user->name,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $reading->kpspams_id,
            'action' => 'VERIFY_METER_READING',
            'entity' => 'MeterReading',
            'entity_id' => $reading->id,
            'new_values' => ['status' => 'VERIFIED'],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($reading, 'Catatan meter berhasil diverifikasi.');
    }

    public function resolveAnomaly(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'justification' => 'required|string|min:5',
            'adjusted_reading' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Justifikasi anomali wajib diisi.', $validator->errors(), 422);
        }

        $reading = MeterReading::with('connection')->findOrFail($id);
        $user = $request->user();

        $old = $reading->toArray();

        if ($request->filled('adjusted_reading')) {
            $newCurrent = (float) $request->input('adjusted_reading');
            $reading->current_reading = $newCurrent;
            $reading->usage_m3 = max(0, $newCurrent - (float) $reading->previous_reading);
        }

        $reading->status = 'VERIFIED';
        $reading->verified_by = $user->id;
        $reading->verified_at = now();
        $reading->anomaly_reason = 'RESOLVED: ' . $request->input('justification');
        $reading->save();

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $reading->kpspams_id,
            'action' => 'RESOLVE_METER_ANOMALY',
            'entity' => 'MeterReading',
            'entity_id' => $reading->id,
            'old_values' => $old,
            'new_values' => $reading->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($reading, 'Anomali pembacaan meter berhasil diselesaikan.');
    }
}
