<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends BaseApiController
{
    /**
     * Otentikasi pengguna dan penerbitan Bearer Token Sanctum.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'Username atau nomor handphone wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi gagal.', $validator->errors(), 422);
        }

        $input = $request->input('username');

        // Cari berdasarkan username atau nomor telepon
        $user = User::with(['roles.permissions', 'kpspams'])
            ->where('username', $input)
            ->orWhere('phone', $input)
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return $this->sendError('Username atau kata sandi tidak cocok.', [], 401, 'INVALID_CREDENTIALS');
        }

        if (!$user->is_active) {
            return $this->sendError('Akun Anda dinonaktifkan. Silakan hubungi Administrator.', [], 403, 'ACCOUNT_INACTIVE');
        }

        // Catat update login terakhir
        $user->last_login_at = now();
        $user->last_login_ip = $request->ip();
        $user->save();

        // Terbitkan Sanctum token dengan nama client/device
        $token = $user->createToken('auth_token')->plainTextToken;

        // Kumpulkan daftar permissions
        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions->pluck('name');
        })->unique()->values();

        // Jejak audit login
        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'LOGIN',
            'entity' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'phone' => $user->phone,
                'email' => $user->email,
                'kpspams_id' => $user->kpspams_id,
                'kpspams_name' => $user->kpspams?->name,
                'roles' => $user->roles->pluck('name'),
                'role_labels' => $user->roles->pluck('display_name'),
                'permissions' => $permissions,
            ],
        ], 'Login berhasil.');
    }

    /**
     * Ambil data profil pengguna yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load(['roles.permissions', 'kpspams', 'customer']);

        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions->pluck('name');
        })->unique()->values();

        return $this->sendResponse([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'phone' => $user->phone,
            'email' => $user->email,
            'kpspams_id' => $user->kpspams_id,
            'kpspams' => $user->kpspams,
            'customer' => $user->customer,
            'roles' => $user->roles->pluck('name'),
            'role_labels' => $user->roles->pluck('display_name'),
            'permissions' => $permissions,
            'is_desa_level' => $user->isDesaLevel(),
        ], 'Profil berhasil diambil.');
    }

    /**
     * Logout dan pencabutan token aktif.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'LOGOUT',
            'entity' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $user->currentAccessToken()->delete();

        return $this->sendResponse(null, 'Logout berhasil. Sesi token telah dicabut.');
    }

    /**
     * Ubah kata sandi sendiri.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => [
                'required',
                'string',
                \Illuminate\Validation\Rules\Password::min(8)->letters()->numbers(),
                'different:current_password',
            ],
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'new_password.required' => 'Kata sandi baru wajib diisi.',
            'new_password.different' => 'Kata sandi baru harus berbeda dari kata sandi lama.',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return $this->sendError('Kata sandi saat ini tidak cocok.', [], 400);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        // Cabut seluruh token lain untuk keamanan
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return $this->sendResponse(null, 'Kata sandi berhasil diperbarui.');
    }
}
