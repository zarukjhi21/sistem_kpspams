<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = User::with(['roles', 'kpspams']);

        // Scope to tenant for KPSPAMS-level users
        if (!$currentUser->isSuperAdmin() && !$currentUser->isDesaLevel()) {
            $query->where('kpspams_id', $currentUser->kpspams_id);
        } elseif ($request->filled('kpspams_id')) {
            $query->where('kpspams_id', $request->query('kpspams_id'));
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->query('role'));
            });
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('username', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('name', 'asc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($users->items(), 'Daftar pengguna sistem berhasil dimuat.', 200, [
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'total' => $users->total(),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $user = User::with(['roles.permissions', 'kpspams'])->findOrFail($id);

        // Tenant boundary check for KPSPAMS users
        if (!$currentUser->isSuperAdmin() && !$currentUser->isDesaLevel()) {
            if ($user->kpspams_id !== $currentUser->kpspams_id) {
                return $this->sendError('Akses ditolak: Pengguna berada di luar unit KPSPAMS Anda.', [], 403);
            }
        }

        return $this->sendResponse($user, 'Detail pengguna berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:users,username',
            'phone' => 'required|string|max:25',
            'email' => 'nullable|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
            'kpspams_id' => 'nullable|exists:kpspams,id',
        ], [
            'username.unique' => 'Username ini sudah digunakan oleh akun lain.',
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'role.required' => 'Peran / hak akses wajib dipilih.',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        $currentUser = $request->user();
        $roleName = $request->input('role');

        // Privilege Escalation Defense: Only super_admin or admin_desa can create admin/desa roles
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasRole('admin_desa')) {
            if (in_array($roleName, ['super_admin', 'admin_desa', 'pemerintah_desa'])) {
                return $this->sendError('Anda tidak memiliki wewenang untuk membuat akun dengan hak akses tingkat Desa atau Super Admin.', [], 403);
            }
        }

        return DB::transaction(function () use ($request, $currentUser, $roleName) {
            $role = Role::where('name', $roleName)->firstOrFail();

            // KPSPAMS Tenant Isolation Defense: Non-desa/super_admin users can only create users in their own KPSPAMS
            if (!$currentUser->isSuperAdmin() && !$currentUser->isDesaLevel()) {
                $kpspamsId = $currentUser->kpspams_id;
            } else {
                $kpspamsId = $request->input('kpspams_id');
                if (!$kpspamsId && in_array($role->name, ['ketua_kpspams', 'admin_kpspams', 'bendahara_kpspams', 'petugas_lapangan'])) {
                    $kpspamsId = $currentUser->kpspams_id ?? 1;
                }
            }

            $newUser = User::create([
                'kpspams_id' => $kpspamsId,
                'name' => $request->input('name'),
                'username' => strtolower(trim($request->input('username'))),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'is_active' => true,
            ]);

            $newUser->roles()->attach($role->id);

            AuditLog::create([
                'user_id' => $currentUser->id,
                'kpspams_id' => $kpspamsId,
                'action' => 'CREATE_USER',
                'entity' => 'User',
                'entity_id' => $newUser->id,
                'new_values' => [
                    'username' => $newUser->username,
                    'name' => $newUser->name,
                    'role' => $role->name,
                    'kpspams_id' => $kpspamsId,
                ],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $this->sendResponse(
                $newUser->load(['roles', 'kpspams']),
                'Akun pengguna baru berhasil dibuat.',
                201
            );
        });
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Tenant Boundary Defense: KPSPAMS user can only update their own KPSPAMS users
        if (!$currentUser->isSuperAdmin() && !$currentUser->isDesaLevel()) {
            if ($user->kpspams_id !== $currentUser->kpspams_id) {
                return $this->sendError('Akses ditolak: Pengguna berada di luar unit KPSPAMS Anda.', [], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:25',
            'email' => "nullable|email|max:100|unique:users,email,{$id}",
            'is_active' => 'sometimes|boolean',
            'role' => 'sometimes|string|exists:roles,name',
            'kpspams_id' => 'nullable|exists:kpspams,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi input gagal.', $validator->errors(), 422);
        }

        // Privilege Escalation Defense: Non-super_admin / non-desa users cannot assign desa/super_admin roles
        if ($request->filled('role')) {
            $targetRole = $request->input('role');
            if (!$currentUser->isSuperAdmin() && !$currentUser->hasRole('admin_desa')) {
                if (in_array($targetRole, ['super_admin', 'admin_desa', 'pemerintah_desa'])) {
                    return $this->sendError('Anda tidak memiliki wewenang untuk memberikan hak akses tingkat Desa atau Super Admin.', [], 403);
                }
            }
        }

        $user->update($request->only(['name', 'phone', 'email', 'is_active', 'kpspams_id']));

        if ($request->filled('role')) {
            $role = Role::where('name', $request->input('role'))->first();
            if ($role) {
                $user->roles()->sync([$role->id]);
            }
        }

        return $this->sendResponse($user->load(['roles', 'kpspams']), 'Data pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        // Hanya super_admin atau admin_desa yang boleh menghapus user
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasRole('admin_desa')) {
            return $this->sendError('Hanya Administrator yang memiliki wewenang untuk menghapus akun pengguna.', [], 403);
        }

        $user = User::findOrFail($id);

        // Mencegah hapus akun sendiri
        if ($user->id === $currentUser->id) {
            return $this->sendError('Anda tidak dapat menghapus akun Anda sendiri.', [], 400);
        }

        // Mencegah hapus super_admin
        if ($user->isSuperAdmin()) {
            return $this->sendError('Akun Super Administrator tidak dapat dihapus.', [], 400);
        }

        $oldData = $user->toArray();
        $user->delete(); // Soft delete

        AuditLog::create([
            'user_id' => $currentUser->id,
            'kpspams_id' => $user->kpspams_id,
            'action' => 'DELETE_USER',
            'entity' => 'User',
            'entity_id' => $user->id,
            'old_values' => $oldData,
            'new_values' => ['deleted_at' => now()],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse(null, 'Akun pengguna berhasil dihapus/dinonaktifkan (soft delete).');
    }
}

