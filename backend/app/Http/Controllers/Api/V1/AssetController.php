<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Asset;
use App\Models\MaintenanceRecord;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AssetController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Asset::with(['category', 'kpspams']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->query('condition'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('asset_code', 'like', "%{$s}%")
                  ->orWhere('location_description', 'ilike', "%{$s}%");
            });
        }

        $assets = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return $this->sendResponse($assets->items(), 'Daftar aset fisik KPSPAMS berhasil dimuat.', 200, [
            'current_page' => $assets->currentPage(),
            'last_page' => $assets->lastPage(),
            'total' => $assets->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $asset = Asset::with(['category', 'maintenanceRecords.workOrder', 'kpspams'])
            ->findOrFail($id);

        return $this->sendResponse($asset, 'Detail aset KPSPAMS berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:asset_categories,id',
            'name' => 'required|string|max:150',
            'location_description' => 'required|string',
            'acquisition_year' => 'required|integer|min:1990|max:' . (int) date('Y'),
            'funding_source' => 'required|string|max:100', // e.g. PAMSIMAS, Dana Desa, Swadaya
            'purchase_value' => 'required|numeric|min:0',
            'condition' => 'required|in:GOOD,LIGHT_DAMAGE,HEAVY_DAMAGE,SCRAPPED',
            'photo' => 'nullable|image|max:5120',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'person_in_charge' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi aset gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('asset_photos', 'public');
        }

        $assetCode = 'AST-KP' . str_pad((string) $kpspamsId, 2, '0', STR_PAD_LEFT) . '-' . strtoupper(bin2hex(random_bytes(3)));

        $asset = Asset::create([
            'kpspams_id' => $kpspamsId,
            'category_id' => $request->input('category_id'),
            'asset_code' => $assetCode,
            'name' => $request->input('name'),
            'location_description' => $request->input('location_description'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'acquisition_year' => $request->input('acquisition_year'),
            'funding_source' => $request->input('funding_source'),
            'purchase_value' => $request->input('purchase_value'),
            'condition' => $request->input('condition'),
            'status' => 'OPERATIONAL',
            'photo_path' => $photoPath,
            'person_in_charge' => $request->input('person_in_charge'),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'new_values' => $asset->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($asset, 'Aset baru berhasil didaftarkan.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $asset = Asset::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:150',
            'location_description' => 'sometimes|required|string',
            'condition' => 'sometimes|in:GOOD,LIGHT_DAMAGE,HEAVY_DAMAGE,SCRAPPED',
            'status' => 'sometimes|in:OPERATIONAL,STANDBY,UNDER_MAINTENANCE,DISPOSED',
            'person_in_charge' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $old = $asset->toArray();
        $asset->update($request->only(['name', 'location_description', 'condition', 'status', 'person_in_charge']));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $asset->kpspams_id,
            'action' => 'UPDATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'old_values' => $old,
            'new_values' => $asset->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($asset, 'Data aset berhasil diperbarui.');
    }

    public function logMaintenance(Request $request, int $id): JsonResponse
    {
        $asset = Asset::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'maintenance_type' => 'required|in:PREVENTIVE,CORRECTIVE,EMERGENCY',
            'performed_date' => 'required|date',
            'performed_by' => 'required|string|max:100',
            'description' => 'required|string|min:10',
            'cost' => 'required|numeric|min:0',
            'next_maintenance_date' => 'nullable|date|after:performed_date',
            'new_condition' => 'nullable|in:GOOD,LIGHT_DAMAGE,HEAVY_DAMAGE,SCRAPPED',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi catatan pemeliharaan gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $record = DB::transaction(function () use ($asset, $request, $user) {
            $recordNumber = 'MNT/' . now()->format('Ymd') . '/' . strtoupper(bin2hex(random_bytes(3)));

            $rec = MaintenanceRecord::create([
                'kpspams_id' => $asset->kpspams_id,
                'asset_id' => $asset->id,
                'work_order_id' => $request->input('work_order_id'),
                'record_number' => $recordNumber,
                'maintenance_type' => $request->input('maintenance_type'),
                'performed_date' => $request->input('performed_date'),
                'performed_by' => $request->input('performed_by'),
                'description' => $request->input('description'),
                'cost' => $request->input('cost'),
                'next_maintenance_date' => $request->input('next_maintenance_date'),
                'created_at' => now(),
            ]);

            if ($request->filled('new_condition')) {
                $asset->update([
                    'condition' => $request->input('new_condition'),
                    'status' => 'OPERATIONAL',
                ]);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $asset->kpspams_id,
                'action' => 'LOG_ASSET_MAINTENANCE',
                'entity' => 'MaintenanceRecord',
                'entity_id' => $rec->id,
                'new_values' => $rec->toArray(),
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $rec;
        });

        return $this->sendResponse($record, 'Catatan pemeliharaan aset berhasil disimpan.', 201);
    }
}
