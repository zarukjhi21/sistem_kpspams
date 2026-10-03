<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Customer;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['customerType', 'connections.dusun', 'kpspams']);

        // Filter Dusun
        if ($request->filled('dusun_id')) {
            $query->whereHas('connections', function ($q) use ($request) {
                $q->where('dusun_id', $request->query('dusun_id'));
            });
        }

        // Filter Status
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        // Search NIK / Nama / Kode
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', "%{$s}%")
                  ->orWhere('nik', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%");
            });
        }

        $customers = $query->paginate($request->integer('per_page', 20));

        return $this->sendResponse($customers->items(), 'Data pelanggan berhasil diambil.', 200, [
            'current_page' => $customers->currentPage(),
            'last_page' => $customers->lastPage(),
            'per_page' => $customers->perPage(),
            'total' => $customers->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $customer = Customer::with(['customerType', 'connections.meter', 'connections.dusun', 'kpspams'])
            ->findOrFail($id);

        return $this->sendResponse($customer, 'Detail pelanggan berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_type_id' => 'required|exists:customer_types,id',
            'nik' => ['required', 'string', 'size:16', Rule::unique('customers', 'nik')->whereNull('deleted_at')],
            'no_kk' => 'nullable|string|size:16',
            'full_name' => 'required|string|max:150',
            'birth_place_date' => 'nullable|string|max:100',
            'gender' => 'nullable|string|max:20',
            'phone' => 'required|string|max:25',
            'email' => 'nullable|email|max:100',
            'identity_address' => 'required|string',
            'rt_rw' => 'nullable|string|max:20',
            'dusun' => 'nullable|string|max:100',
            'village' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:30',
            'marital_status' => 'nullable|string|max:50',
            'occupation' => 'nullable|string|max:100',
            'ktp_photo_path' => 'nullable|string|max:255',
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.unique' => 'NIK ini sudah terdaftar sebagai pelanggan.',
            'full_name.required' => 'Nama lengkap wajib diisi.',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $code = 'CUST-KP' . str_pad((string) $kpspamsId, 2, '0', STR_PAD_LEFT) . '-' . strtoupper(bin2hex(random_bytes(3)));

        $customer = Customer::create([
            'kpspams_id' => $kpspamsId,
            'customer_type_id' => $request->input('customer_type_id'),
            'code' => $code,
            'nik' => $request->input('nik'),
            'no_kk' => $request->input('no_kk'),
            'full_name' => $request->input('full_name'),
            'birth_place_date' => $request->input('birth_place_date'),
            'gender' => $request->input('gender'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'identity_address' => $request->input('identity_address'),
            'rt_rw' => $request->input('rt_rw'),
            'dusun' => $request->input('dusun'),
            'village' => $request->input('village', 'KUAJANG'),
            'district' => $request->input('district', 'BINUANG'),
            'religion' => $request->input('religion'),
            'marital_status' => $request->input('marital_status'),
            'occupation' => $request->input('occupation'),
            'ktp_photo_path' => $request->input('ktp_photo_path'),
            'status' => 'ACTIVE',
            'registration_date' => now()->toDateString(),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_CUSTOMER',
            'entity' => 'Customer',
            'entity_id' => $customer->id,
            'new_values' => $customer->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($customer, 'Pelanggan baru berhasil didaftarkan.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:150',
            'birth_place_date' => 'nullable|string|max:100',
            'gender' => 'nullable|string|max:20',
            'phone' => 'sometimes|required|string|max:25',
            'email' => 'nullable|email|max:100',
            'identity_address' => 'sometimes|required|string',
            'rt_rw' => 'nullable|string|max:20',
            'dusun' => 'nullable|string|max:100',
            'village' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:30',
            'marital_status' => 'nullable|string|max:50',
            'occupation' => 'nullable|string|max:100',
            'ktp_photo_path' => 'nullable|string|max:255',
            'status' => 'sometimes|in:ACTIVE,INACTIVE,SUSPENDED',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $old = $customer->toArray();
        $customer->update($request->only([
            'full_name', 'birth_place_date', 'gender', 'phone', 'email',
            'identity_address', 'rt_rw', 'dusun', 'village', 'district',
            'religion', 'marital_status', 'occupation', 'ktp_photo_path', 'status'
        ]));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $customer->kpspams_id,
            'action' => 'UPDATE_CUSTOMER',
            'entity' => 'Customer',
            'entity_id' => $customer->id,
            'old_values' => $old,
            'new_values' => $customer->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($customer, 'Data pelanggan berhasil diperbarui.');
    }
}
