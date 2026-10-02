<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Kpspams;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class KpspamsController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Kpspams::with(['dusuns', 'billingPolicy'])
            ->withCount(['customers', 'connections', 'cashAccounts']);

        // Jika user dibatasi pada satu KPSPAMS (bukan admin desa/super admin)
        if ($user->kpspams_id && !$user->isSuperAdmin() && !$user->isDesaLevel()) {
            $query->where('id', $user->kpspams_id);
        }

        $units = $query->get();

        return $this->sendResponse($units, 'Daftar unit KPSPAMS berhasil dimuat.');
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->kpspams_id && !$user->isSuperAdmin() && !$user->isDesaLevel() && $user->kpspams_id !== $id) {
            return $this->sendError('Akses ditolak ke unit KPSPAMS lain.', [], 403);
        }

        $kpspams = Kpspams::with(['dusuns', 'billingPolicy', 'tariffs.components', 'cashAccounts'])
            ->withCount(['customers', 'connections'])
            ->findOrFail($id);

        return $this->sendResponse($kpspams, 'Detail unit KPSPAMS berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            return $this->sendError('Akses ditolak. Hanya Administrator Desa yang dapat mendaftarkan KPSPAMS baru.', [], 403);
        }

        $validator = Validator::make($request->all(), [
            'desa_id' => 'required|exists:desa,id',
            'code' => 'required|string|max:20|unique:kpspams,code',
            'name' => 'required|string|max:100',
            'decree_number' => 'nullable|string|max:100',
            'established_date' => 'nullable|date',
            'office_address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:25',
            'contact_email' => 'nullable|email|max:100',
            'bank_account_info' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi data KPSPAMS gagal.', $validator->errors(), 422);
        }

        $kpspams = Kpspams::create($request->all());

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspams->id,
            'action' => 'CREATE_KPSPAMS',
            'entity' => 'Kpspams',
            'entity_id' => $kpspams->id,
            'new_values' => $kpspams->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($kpspams, 'Unit KPSPAMS baru berhasil didaftarkan.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->kpspams_id && !$user->isSuperAdmin() && !$user->isDesaLevel() && $user->kpspams_id !== $id) {
            return $this->sendError('Akses ditolak ke unit KPSPAMS lain.', [], 403);
        }

        $kpspams = Kpspams::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'decree_number' => 'nullable|string|max:100',
            'established_date' => 'nullable|date',
            'office_address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:25',
            'contact_email' => 'nullable|email|max:100',
            'bank_account_info' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembaruan gagal.', $validator->errors(), 422);
        }

        $old = $kpspams->toArray();
        $kpspams->update($request->only([
            'name', 'decree_number', 'established_date', 'office_address',
            'contact_phone', 'contact_email', 'bank_account_info', 'is_active'
        ]));

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspams->id,
            'action' => 'UPDATE_KPSPAMS',
            'entity' => 'Kpspams',
            'entity_id' => $kpspams->id,
            'old_values' => $old,
            'new_values' => $kpspams->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($kpspams, 'Informasi unit KPSPAMS berhasil diperbarui.');
    }

    public function assignDusun(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            return $this->sendError('Akses ditolak. Penetapan wilayah kerja dusun hanya wewenang Pemerintah Desa.', [], 403);
        }

        $kpspams = Kpspams::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'dusun_ids' => 'required|array',
            'dusun_ids.*' => 'exists:dusun,id',
            'primary_dusun_id' => 'nullable|exists:dusun,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi penetapan dusun gagal.', $validator->errors(), 422);
        }

        $dusunIds = $request->input('dusun_ids');
        $primaryId = $request->input('primary_dusun_id', $dusunIds[0] ?? null);

        $syncData = [];
        foreach ($dusunIds as $dusunId) {
            $syncData[$dusunId] = [
                'assigned_date' => now()->toDateString(),
                'is_primary' => ((int)$dusunId === (int)$primaryId),
            ];
        }

        $kpspams->dusuns()->sync($syncData);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspams->id,
            'action' => 'ASSIGN_DUSUN_KPSPAMS',
            'entity' => 'Kpspams',
            'entity_id' => $kpspams->id,
            'new_values' => ['dusun_ids' => $dusunIds, 'primary_id' => $primaryId],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($kpspams->load('dusuns'), 'Wilayah kerja dusun KPSPAMS berhasil disinkronisasi.');
    }
}
