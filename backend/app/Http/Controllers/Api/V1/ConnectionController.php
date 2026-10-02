<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Connection;
use App\Models\Meter;
use App\Models\Customer;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConnectionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Connection::with(['customer', 'meter', 'dusun', 'kpspams']);

        if ($request->filled('dusun_id')) {
            $query->where('dusun_id', $request->query('dusun_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        $connections = $query->paginate($request->integer('per_page', 20));

        return $this->sendResponse($connections->items(), 'Data sambungan rumah berhasil diambil.', 200, [
            'current_page' => $connections->currentPage(),
            'last_page' => $connections->lastPage(),
            'total' => $connections->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $conn = Connection::with(['customer', 'meter', 'dusun', 'meterReadings' => function ($q) {
            $q->latest('reading_date')->take(6);
        }])->findOrFail($id);

        return $this->sendResponse($conn, 'Detail sambungan berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'dusun_id' => 'required|exists:dusun,id',
            'meter_serial' => 'required|string|max:50',
            'meter_brand' => 'required|string|max:50',
            'initial_reading' => 'required|numeric|min:0',
            'address_detail' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $customer = Customer::findOrFail($request->input('customer_id'));
        $kpspamsId = $customer->kpspams_id;

        return DB::transaction(function () use ($request, $customer, $kpspamsId) {
            // 1. Buat unit meter fisik
            $meter = Meter::create([
                'kpspams_id' => $kpspamsId,
                'serial_number' => $request->input('meter_serial'),
                'brand' => $request->input('meter_brand'),
                'diameter_inch' => $request->input('diameter_inch', '1/2'),
                'initial_reading' => (float) $request->input('initial_reading'),
                'installation_date' => now()->toDateString(),
                'condition' => 'GOOD',
                'is_active' => true,
            ]);

            // 2. Buat nomor sambungan
            $seq = str_pad((string) (Connection::where('kpspams_id', $kpspamsId)->count() + 1), 5, '0', STR_PAD_LEFT);
            $connNo = "SR-KP{$kpspamsId}-{$seq}";

            // 3. Pasangkan sambungan
            $conn = Connection::create([
                'kpspams_id' => $kpspamsId,
                'customer_id' => $customer->id,
                'dusun_id' => $request->input('dusun_id'),
                'meter_id' => $meter->id,
                'connection_no' => $connNo,
                'address_detail' => $request->input('address_detail'),
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'status' => 'ACTIVE',
                'installed_date' => now()->toDateString(),
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'kpspams_id' => $kpspamsId,
                'action' => 'CREATE_CONNECTION',
                'entity' => 'Connection',
                'entity_id' => $conn->id,
                'new_values' => ['connection_no' => $connNo, 'meter_serial' => $meter->serial_number],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $this->sendResponse($conn->load(['meter', 'customer', 'dusun']), 'Sambungan rumah baru berhasil dipasang.', 201);
        });
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $conn = Connection::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:ACTIVE,SEALED,DISCONNECTED,TERMINATED',
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $oldStatus = $conn->status;
        $conn->status = $request->input('status');
        $conn->notes = ($conn->notes ? $conn->notes . ' | ' : '') . "Status diubah ke {$conn->status}: " . $request->input('notes');
        $conn->save();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $conn->kpspams_id,
            'action' => 'CHANGE_CONNECTION_STATUS',
            'entity' => 'Connection',
            'entity_id' => $conn->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $conn->status, 'notes' => $request->input('notes')],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($conn, "Status sambungan berhasil diubah menjadi {$conn->status}.");
    }
}
