<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Desa;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DesaController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $desa = Desa::with(['dusuns', 'kpspams'])->first();

        if (!$desa) {
            return $this->sendError('Data Desa belum dikonfigurasi.', [], 404);
        }

        return $this->sendResponse($desa, 'Profil Desa Kuajang berhasil dimuat.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $desa = Desa::findOrFail($id);
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            return $this->sendError('Akses ditolak. Hanya Administrator Desa yang dapat mengubah data profil desa.', [], 403);
        }

        $validator = Validator::make($request->all(), [
            'head_of_village' => 'sometimes|required|string|max:100',
            'office_address' => 'sometimes|required|string',
            'phone' => 'sometimes|nullable|string|max:25',
            'email' => 'sometimes|nullable|email|max:100',
            'postal_code' => 'sometimes|nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi data desa gagal.', $validator->errors(), 422);
        }

        $old = $desa->toArray();
        $desa->update($request->only([
            'head_of_village',
            'office_address',
            'phone',
            'email',
            'postal_code',
        ]));

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'UPDATE_DESA_PROFILE',
            'entity' => 'Desa',
            'entity_id' => $desa->id,
            'old_values' => $old,
            'new_values' => $desa->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($desa, 'Profil Desa Kuajang berhasil diperbarui.');
    }
}
