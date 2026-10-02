<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Dusun;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DusunController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $dusuns = Dusun::with(['kpspams'])
            ->withCount('connections')
            ->orderBy('id', 'asc')
            ->get();

        return $this->sendResponse($dusuns, 'Daftar dusun Desa Kuajang berhasil dimuat.');
    }

    public function show(int $id): JsonResponse
    {
        $dusun = Dusun::with(['kpspams', 'connections.customer', 'connections.meter'])
            ->withCount('connections')
            ->findOrFail($id);

        return $this->sendResponse($dusun, 'Detail dusun berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            return $this->sendError('Akses ditolak. Hanya Administrator Desa yang dapat menambahkan dusun baru.', [], 403);
        }

        $validator = Validator::make($request->all(), [
            'desa_id' => 'required|exists:desa,id',
            'code' => 'required|string|max:20|unique:dusun,code',
            'name' => 'required|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input dusun gagal.', $validator->errors(), 422);
        }

        $dusun = Dusun::create($request->only(['desa_id', 'code', 'name', 'notes']));

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'CREATE_DUSUN',
            'entity' => 'Dusun',
            'entity_id' => $dusun->id,
            'new_values' => $dusun->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($dusun, 'Dusun baru berhasil ditambahkan.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            return $this->sendError('Akses ditolak. Hanya Administrator Desa yang dapat mengubah data dusun.', [], 403);
        }

        $dusun = Dusun::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $old = $dusun->toArray();
        $dusun->update($request->only(['name', 'notes']));

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'UPDATE_DUSUN',
            'entity' => 'Dusun',
            'entity_id' => $dusun->id,
            'old_values' => $old,
            'new_values' => $dusun->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($dusun, 'Data dusun berhasil diperbarui.');
    }
}
