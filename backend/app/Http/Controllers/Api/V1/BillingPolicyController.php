<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\KpspamsBillingPolicy;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BillingPolicyController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->query('kpspams_id');
        }

        if (!$kpspamsId) {
            // Jika user adalah super admin/desa dan tidak spesifik kpspams, ambil semua
            $policies = KpspamsBillingPolicy::with('kpspams')->get();
            return $this->sendResponse($policies, 'Daftar kebijakan penagihan berhasil dimuat.');
        }

        $policy = KpspamsBillingPolicy::with('kpspams')->where('kpspams_id', $kpspamsId)->first();

        if (!$policy) {
            // Buat default policy jika belum ada
            $policy = KpspamsBillingPolicy::create([
                'kpspams_id' => $kpspamsId,
                'due_day_of_month' => 20,
                'late_penalty_type' => 'NONE',
                'late_penalty_amount' => 0.00,
                'sp1_arrears_months' => 1,
                'sp2_arrears_months' => 2,
                'disconnect_recommendation_months' => 3,
                'reconnect_fee' => 25000.00,
                'is_auto_disconnect' => false,
            ]);
        }

        return $this->sendResponse($policy, 'Kebijakan penagihan unit KPSPAMS berhasil dimuat.');
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS ID wajib ditentukan.', [], 400);
        }

        $validator = Validator::make($request->all(), [
            'due_day_of_month' => 'required|integer|min:1|max:28',
            'late_penalty_type' => 'required|in:NONE,FLAT,PERCENTAGE',
            'late_penalty_amount' => 'required|numeric|min:0',
            'sp1_arrears_months' => 'required|integer|min:1|max:12',
            'sp2_arrears_months' => 'required|integer|min:1|max:12',
            'disconnect_recommendation_months' => 'required|integer|min:1|max:24',
            'reconnect_fee' => 'required|numeric|min:0',
            'is_auto_disconnect' => 'required|boolean',
        ], [
            'due_day_of_month.min' => 'Tanggal jatuh tempo minimal tanggal 1.',
            'due_day_of_month.max' => 'Tanggal jatuh tempo maksimal tanggal 28.',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi kebijakan gagal.', $validator->errors(), 422);
        }

        $policy = KpspamsBillingPolicy::firstOrCreate(
            ['kpspams_id' => $kpspamsId],
            [
                'due_day_of_month' => 20,
                'late_penalty_type' => 'NONE',
                'late_penalty_amount' => 0.00,
                'sp1_arrears_months' => 1,
                'sp2_arrears_months' => 2,
                'disconnect_recommendation_months' => 3,
                'reconnect_fee' => 25000.00,
                'is_auto_disconnect' => false,
            ]
        );

        $old = $policy->toArray();
        $policy->update($request->only([
            'due_day_of_month',
            'late_penalty_type',
            'late_penalty_amount',
            'sp1_arrears_months',
            'sp2_arrears_months',
            'disconnect_recommendation_months',
            'reconnect_fee',
            'is_auto_disconnect',
        ]));

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'UPDATE_BILLING_POLICY',
            'entity' => 'KpspamsBillingPolicy',
            'entity_id' => $policy->id,
            'old_values' => $old,
            'new_values' => $policy->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($policy, 'Kebijakan penagihan berhasil diperbarui.');
    }
}
