<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Meter;
use App\Models\Connection;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MeterController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Meter::with(['connection.customer', 'connection.dusun']);

        if ($request->filled('condition')) {
            $query->where('condition', $request->query('condition'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('serial_number', 'like', "%{$s}%")
                  ->orWhere('brand', 'like', "%{$s}%");
            });
        }

        $meters = $query->paginate($request->integer('per_page', 20));

        return $this->sendResponse($meters->items(), 'Daftar meter air berhasil dimuat.', 200, [
            'current_page' => $meters->currentPage(),
            'last_page' => $meters->lastPage(),
            'total' => $meters->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $meter = Meter::with(['connection.customer', 'connection.dusun'])->findOrFail($id);

        return $this->sendResponse($meter, 'Detail meter air berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $validator = Validator::make($request->all(), [
            'serial_number' => 'required|string|max:50|unique:meters,serial_number',
            'brand' => 'required|string|max:50',
            'diameter_inch' => 'nullable|string|max:10',
            'initial_reading' => 'required|numeric|min:0',
            'installation_date' => 'required|date',
            'condition' => 'nullable|in:GOOD,DAMAGED,CALIBRATION_NEEDED,REPLACED',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi meter gagal.', $validator->errors(), 422);
        }

        $meter = Meter::create([
            'kpspams_id' => $kpspamsId,
            'serial_number' => $request->input('serial_number'),
            'brand' => $request->input('brand'),
            'diameter_inch' => $request->input('diameter_inch', '0.5'),
            'initial_reading' => $request->input('initial_reading', 0),
            'installation_date' => $request->input('installation_date'),
            'condition' => $request->input('condition', 'GOOD'),
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_METER',
            'entity' => 'Meter',
            'entity_id' => $meter->id,
            'new_values' => $meter->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($meter, 'Meter air berhasil didaftarkan.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $meter = Meter::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'brand' => 'sometimes|required|string|max:50',
            'diameter_inch' => 'nullable|string|max:10',
            'condition' => 'sometimes|in:GOOD,DAMAGED,CALIBRATION_NEEDED,REPLACED',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembaruan meter gagal.', $validator->errors(), 422);
        }

        $old = $meter->toArray();
        $meter->update($request->only(['brand', 'diameter_inch', 'condition', 'is_active']));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $meter->kpspams_id,
            'action' => 'UPDATE_METER',
            'entity' => 'Meter',
            'entity_id' => $meter->id,
            'old_values' => $old,
            'new_values' => $meter->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($meter, 'Data meter air berhasil diperbarui.');
    }

    public function replaceMeter(Request $request, int $id): JsonResponse
    {
        $oldMeter = Meter::with('connection')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'new_serial_number' => 'required|string|max:50|unique:meters,serial_number',
            'new_brand' => 'required|string|max:50',
            'new_initial_reading' => 'required|numeric|min:0',
            'replacement_date' => 'required|date',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi penggantian meter gagal.', $validator->errors(), 422);
        }

        $newMeter = DB::transaction(function () use ($oldMeter, $request) {
            $user = $request->user();

            // 1. Nonaktifkan meter lama
            $oldMeter->update([
                'condition' => 'REPLACED',
                'is_active' => false,
            ]);

            // 2. Buat meter baru
            $newMeter = Meter::create([
                'kpspams_id' => $oldMeter->kpspams_id,
                'serial_number' => $request->input('new_serial_number'),
                'brand' => $request->input('new_brand'),
                'diameter_inch' => $oldMeter->diameter_inch,
                'initial_reading' => $request->input('new_initial_reading'),
                'installation_date' => $request->input('replacement_date'),
                'condition' => 'GOOD',
                'is_active' => true,
            ]);

            // 3. Update sambungan rumah jika sebelumnya terhubung
            if ($oldMeter->connection) {
                $connection = $oldMeter->connection;
                $connection->meter_id = $newMeter->id;
                $connection->save();
            }

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $oldMeter->kpspams_id,
                'action' => 'REPLACE_METER',
                'entity' => 'Meter',
                'entity_id' => $oldMeter->id,
                'old_values' => ['meter_id' => $oldMeter->id, 'serial' => $oldMeter->serial_number],
                'new_values' => ['new_meter_id' => $newMeter->id, 'new_serial' => $newMeter->serial_number, 'reason' => $request->input('reason')],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $newMeter;
        });

        return $this->sendResponse($newMeter, 'Penggantian meter air berhasil diproses.');
    }
}
