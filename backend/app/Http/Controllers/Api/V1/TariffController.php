<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Tariff;
use App\Models\TariffComponent;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TariffController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Tariff::with(['customerType', 'components', 'kpspams']);

        if ($request->filled('customer_type_id')) {
            $query->where('customer_type_id', $request->query('customer_type_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $tariffs = $query->orderBy('effective_from', 'desc')->get();

        return $this->sendResponse($tariffs, 'Daftar skema tarif air berhasil dimuat.');
    }

    public function show(int $id): JsonResponse
    {
        $tariff = Tariff::with(['customerType', 'components', 'kpspams'])->findOrFail($id);

        return $this->sendResponse($tariff, 'Detail skema tarif berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_type_id' => 'required|exists:customer_types,id',
            'name' => 'required|string|max:100',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'fixed_admin_fee' => 'required|numeric|min:0',
            'maintenance_fee' => 'required|numeric|min:0',
            'late_penalty_fee' => 'nullable|numeric|min:0',
            'components' => 'required|array|min:1',
            'components.*.tier_order' => 'required|integer|min:1',
            'components.*.tier_min_m3' => 'required|integer|min:0',
            'components.*.tier_max_m3' => 'nullable|integer|gt:components.*.tier_min_m3',
            'components.*.rate_per_m3' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi skema tarif gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $tariff = DB::transaction(function () use ($request, $kpspamsId, $user) {
            $tariff = Tariff::create([
                'kpspams_id' => $kpspamsId,
                'customer_type_id' => $request->input('customer_type_id'),
                'name' => $request->input('name'),
                'effective_from' => $request->input('effective_from'),
                'effective_until' => $request->input('effective_until'),
                'status' => 'ACTIVE',
                'fixed_admin_fee' => $request->input('fixed_admin_fee'),
                'maintenance_fee' => $request->input('maintenance_fee'),
                'late_penalty_fee' => $request->input('late_penalty_fee', 0),
            ]);

            foreach ($request->input('components') as $comp) {
                TariffComponent::create([
                    'tariff_id' => $tariff->id,
                    'tier_order' => $comp['tier_order'],
                    'tier_min_m3' => $comp['tier_min_m3'],
                    'tier_max_m3' => $comp['tier_max_m3'] ?? null,
                    'rate_per_m3' => $comp['rate_per_m3'],
                ]);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $kpspamsId,
                'action' => 'CREATE_TARIFF',
                'entity' => 'Tariff',
                'entity_id' => $tariff->id,
                'new_values' => $tariff->load('components')->toArray(),
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $tariff->load('components');
        });

        return $this->sendResponse($tariff, 'Skema tarif baru berhasil dibuat.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tariff = Tariff::with('components')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'effective_from' => 'sometimes|required|date',
            'effective_until' => 'nullable|date',
            'status' => 'sometimes|in:ACTIVE,INACTIVE,DRAFT',
            'fixed_admin_fee' => 'sometimes|required|numeric|min:0',
            'maintenance_fee' => 'sometimes|required|numeric|min:0',
            'late_penalty_fee' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembaruan tarif gagal.', $validator->errors(), 422);
        }

        $old = $tariff->toArray();
        $tariff->update($request->only([
            'name', 'effective_from', 'effective_until', 'status',
            'fixed_admin_fee', 'maintenance_fee', 'late_penalty_fee'
        ]));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $tariff->kpspams_id,
            'action' => 'UPDATE_TARIFF',
            'entity' => 'Tariff',
            'entity_id' => $tariff->id,
            'old_values' => $old,
            'new_values' => $tariff->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($tariff, 'Skema tarif berhasil diperbarui.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tariff = Tariff::findOrFail($id);

        $tariff->update(['status' => 'INACTIVE']);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $tariff->kpspams_id,
            'action' => 'DEACTIVATE_TARIFF',
            'entity' => 'Tariff',
            'entity_id' => $tariff->id,
            'new_values' => ['status' => 'INACTIVE'],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse(null, 'Skema tarif berhasil dinonaktifkan.');
    }
}
