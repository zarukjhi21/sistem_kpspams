<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CustomerConnectionSeeder extends Seeder
{
    public function run(): void
    {
        $kpspLemoBaru = DB::table('kpspams')->where('code', 'KP-LMB')->first();
        $kpspLemoTua  = DB::table('kpspams')->where('code', 'KP-LMT')->first();
        $kpspSarampu1 = DB::table('kpspams')->where('code', 'KP-SR1')->first();

        $dusunSarampu1 = DB::table('dusun')->where('code', 'DSN-SR1')->first();
        $dusunLemoBaru = DB::table('dusun')->where('code', 'DSN-LMB')->first();
        $dusunLemoTua  = DB::table('dusun')->where('code', 'DSN-LMT')->first();
        $dusunPakkandoang = DB::table('dusun')->where('code', 'DSN-PKD')->first();

        $typeRumahTangga = DB::table('customer_types')->where('code', 'RUMAH_TANGGA')->first();
        $rolePelanggan   = DB::table('roles')->where('name', 'pelanggan')->first();
        $defaultPassword = Hash::make('Kuajang2026!');

        $samples = [
            // Pelanggan 1: Lemo Baru (Satu-satunya data operasional aktif)
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'dusun_id' => $dusunLemoBaru->id,
                'code' => 'CUST-LMB-0001',
                'nik' => '7604031508850001',
                'no_kk' => '7604031508850000',
                'full_name' => 'Muhammad Yusuf',
                'phone' => '085242000001',
                'email' => 'yusuf@gmail.com',
                'identity_address' => 'Dusun Lemo Baru RT 01, Desa Kuajang',
                'connection_no' => 'SR-LMB-00001',
                'meter_serial' => 'MTR-LMB-1001',
                'brand' => 'Onda',
                'username' => 'warga.yusuf',
            ],
        ];

        foreach ($samples as $s) {
            // 1. Insert Customer
            $customerId = DB::table('customers')->insertGetId([
                'kpspams_id' => $s['kpspams_id'],
                'customer_type_id' => $typeRumahTangga->id,
                'code' => $s['code'],
                'nik' => $s['nik'],
                'no_kk' => $s['no_kk'],
                'full_name' => $s['full_name'],
                'phone' => $s['phone'],
                'email' => $s['email'],
                'identity_address' => $s['identity_address'],
                'status' => 'ACTIVE',
                'registration_date' => '2026-01-01',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Insert Meter
            $meterId = DB::table('meters')->insertGetId([
                'kpspams_id' => $s['kpspams_id'],
                'serial_number' => $s['meter_serial'],
                'brand' => $s['brand'],
                'diameter_inch' => '1/2',
                'initial_reading' => 0.00,
                'installation_date' => '2026-01-01',
                'condition' => 'GOOD',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Insert Connection
            DB::table('connections')->insert([
                'kpspams_id' => $s['kpspams_id'],
                'customer_id' => $customerId,
                'dusun_id' => $s['dusun_id'],
                'meter_id' => $meterId,
                'connection_no' => $s['connection_no'],
                'address_detail' => $s['identity_address'],
                'latitude' => -3.434900,
                'longitude' => 119.376800,
                'status' => 'ACTIVE',
                'installed_date' => '2026-01-01',
                'notes' => 'Sambungan reguler aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Create User login for customer portal
            $userId = DB::table('users')->insertGetId([
                'kpspams_id' => $s['kpspams_id'],
                'customer_id' => $customerId,
                'name' => $s['full_name'],
                'username' => $s['username'],
                'email' => $s['email'],
                'phone' => $s['phone'],
                'password' => $defaultPassword,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('user_roles')->insert([
                'user_id' => $userId,
                'role_id' => $rolePelanggan->id,
            ]);
        }
    }
}
