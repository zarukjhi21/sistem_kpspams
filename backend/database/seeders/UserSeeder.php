<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Kuajang2026!');

        $roleSuperAdmin = DB::table('roles')->where('name', 'super_admin')->first();
        $roleAdminDesa  = DB::table('roles')->where('name', 'admin_desa')->first();
        $rolePemdes     = DB::table('roles')->where('name', 'pemerintah_desa')->first();
        $roleKetua      = DB::table('roles')->where('name', 'ketua_kpspams')->first();
        $roleAdminKpsp  = DB::table('roles')->where('name', 'admin_kpspams')->first();
        $roleBendahara  = DB::table('roles')->where('name', 'bendahara_kpspams')->first();
        $rolePetugas    = DB::table('roles')->where('name', 'petugas_lapangan')->first();

        $kpspLemoBaru = DB::table('kpspams')->where('code', 'KP-LMB')->first();
        $kpspLemoTua  = DB::table('kpspams')->where('code', 'KP-LMT')->first();
        $kpspSarampu1 = DB::table('kpspams')->where('code', 'KP-SR1')->first();

        $users = [
            // 1. Super Admin (Global)
            [
                'kpspams_id' => null,
                'name' => 'Super Administrator TI',
                'username' => 'superadmin',
                'email' => 'superadmin@desakuajang.id',
                'phone' => '081111111101',
                'password' => $password,
                'role_id' => $roleSuperAdmin->id,
            ],
            // 2. Admin Desa Kuajang
            [
                'kpspams_id' => null,
                'name' => 'Operator TI Desa Kuajang',
                'username' => 'admin.desa',
                'email' => 'admin.desa@desakuajang.id',
                'phone' => '081111111102',
                'password' => $password,
                'role_id' => $roleAdminDesa->id,
            ],
            // 3. Kepala Desa (Pemerintah Desa)
            [
                'kpspams_id' => null,
                'name' => 'H. Muhammad Basir, S.Sos.',
                'username' => 'kades.kuajang',
                'email' => 'kades@desakuajang.id',
                'phone' => '081111111103',
                'password' => $password,
                'role_id' => $rolePemdes->id,
            ],

            // 4. KPSPAMS Lemo Baru
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'name' => 'Hasanuddin (Ketua LMB)',
                'username' => 'ketua.lemobaru',
                'email' => 'ketua.lmb@desakuajang.id',
                'phone' => '082100000001',
                'password' => $password,
                'role_id' => $roleKetua->id,
            ],
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'name' => 'Nurul Hidayah (Admin LMB)',
                'username' => 'admin.lemobaru',
                'email' => 'admin.lmb@desakuajang.id',
                'phone' => '082100000002',
                'password' => $password,
                'role_id' => $roleAdminKpsp->id,
            ],
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'name' => 'Rahmawati (Bendahara LMB)',
                'username' => 'bendahara.lemobaru',
                'email' => 'bendahara.lmb@desakuajang.id',
                'phone' => '082100000003',
                'password' => $password,
                'role_id' => $roleBendahara->id,
            ],
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'name' => 'Syamsul Bahri (Petugas Lapangan LMB)',
                'username' => 'petugas.lemobaru',
                'email' => 'petugas.lmb@desakuajang.id',
                'phone' => '082100000004',
                'password' => $password,
                'role_id' => $rolePetugas->id,
            ],

            // 5. KPSPAMS Lemo Tua
            [
                'kpspams_id' => $kpspLemoTua->id,
                'name' => 'Abdul Rauf (Ketua LMT)',
                'username' => 'ketua.lemotua',
                'email' => 'ketua.lmt@desakuajang.id',
                'phone' => '082200000001',
                'password' => $password,
                'role_id' => $roleKetua->id,
            ],
            [
                'kpspams_id' => $kpspLemoTua->id,
                'name' => 'Fatimah Az-Zahra (Admin LMT)',
                'username' => 'admin.lemotua',
                'email' => 'admin.lmt@desakuajang.id',
                'phone' => '082200000002',
                'password' => $password,
                'role_id' => $roleAdminKpsp->id,
            ],
            [
                'kpspams_id' => $kpspLemoTua->id,
                'name' => 'Marwah (Bendahara LMT)',
                'username' => 'bendahara.lemotua',
                'email' => 'bendahara.lmt@desakuajang.id',
                'phone' => '082200000003',
                'password' => $password,
                'role_id' => $roleBendahara->id,
            ],
            [
                'kpspams_id' => $kpspLemoTua->id,
                'name' => 'Kamaruddin (Petugas Lapangan LMT)',
                'username' => 'petugas.lemotua',
                'email' => 'petugas.lmt@desakuajang.id',
                'phone' => '082200000004',
                'password' => $password,
                'role_id' => $rolePetugas->id,
            ],

            // 6. KPSPAMS Sarampu 1 (Melayani Dusun Sarampu 1 & Dusun Pakkandoang)
            [
                'kpspams_id' => $kpspSarampu1->id,
                'name' => 'Drs. Usman Ali (Ketua SR1)',
                'username' => 'ketua.sarampu1',
                'email' => 'ketua.sr1@desakuajang.id',
                'phone' => '082300000001',
                'password' => $password,
                'role_id' => $roleKetua->id,
            ],
            [
                'kpspams_id' => $kpspSarampu1->id,
                'name' => 'Sri Wahyuni (Admin SR1)',
                'username' => 'admin.sarampu1',
                'email' => 'admin.sr1@desakuajang.id',
                'phone' => '082300000002',
                'password' => $password,
                'role_id' => $roleAdminKpsp->id,
            ],
            [
                'kpspams_id' => $kpspSarampu1->id,
                'name' => 'Hasnah (Bendahara SR1)',
                'username' => 'bendahara.sarampu1',
                'email' => 'bendahara.sr1@desakuajang.id',
                'phone' => '082300000003',
                'password' => $password,
                'role_id' => $roleBendahara->id,
            ],
            [
                'kpspams_id' => $kpspSarampu1->id,
                'name' => 'Ilham Syarif (Petugas Lapangan SR1 & Pakkandoang)',
                'username' => 'petugas.sarampu1',
                'email' => 'petugas.sr1@desakuajang.id',
                'phone' => '082300000004',
                'password' => $password,
                'role_id' => $rolePetugas->id,
            ],
        ];

        foreach ($users as $u) {
            $userId = DB::table('users')->insertGetId([
                'kpspams_id' => $u['kpspams_id'],
                'name' => $u['name'],
                'username' => $u['username'],
                'email' => $u['email'],
                'phone' => $u['phone'],
                'password' => $u['password'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('user_roles')->insert([
                'user_id' => $userId,
                'role_id' => $u['role_id'],
            ]);
        }
    }
}
