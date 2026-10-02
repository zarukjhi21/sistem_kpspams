<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Hanya role pengawas, admin_desa, super_admin, ketua_kpspams yang dapat melihat audit logs
        if (!$user->isSuperAdmin() && !$user->isDesaLevel() && !$user->hasRole('ketua_kpspams')) {
            return $this->sendError('Akses ditolak. Log audit hanya dapat diakses oleh Administrator Desa dan Pengawas KPSPAMS.', [], 403);
        }

        $query = AuditLog::with(['user', 'kpspams']);

        if ($user->kpspams_id && !$user->isSuperAdmin() && !$user->isDesaLevel()) {
            $query->where('kpspams_id', $user->kpspams_id);
        } elseif ($request->filled('kpspams_id')) {
            $query->where('kpspams_id', $request->query('kpspams_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('entity')) {
            $query->where('entity', $request->query('entity'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 25));

        return $this->sendResponse($logs->items(), 'Log audit kepatuhan berhasil dimuat.', 200, [
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'total' => $logs->total(),
        ]);
    }
}
