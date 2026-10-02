<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DesaDusunSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Master Desa Kuajang
        $desaId = DB::table('desa')->insertGetId([
            'code' => '76.04.03.2001',
            'name' => 'Desa Kuajang',
            'subdistrict' => 'Kecamatan Binuang',
            'district' => 'Kabupaten Polewali Mandar',
            'province' => 'Sulawesi Barat',
            'postal_code' => '91353',
            'office_address' => 'Jl. Poros Binuang - Kuajang No. 01, Desa Kuajang',
            'head_of_village' => 'H. Muhammad Basir, S.Sos.',
            'phone' => '082345678901',
            'email' => 'kantordesa@desakuajang.id',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Master 5 Dusun di Desa Kuajang
        $dusuns = [
            ['code' => 'DSN-SR1', 'name' => 'Sarampu 1', 'notes' => 'Wilayah pemukiman Sarampu 1, dilayani KPSPAMS Sarampu 1.'],
            ['code' => 'DSN-SR2', 'name' => 'Sarampu 2', 'notes' => 'Wilayah Sarampu 2. Master dusun aktif, belum memiliki unit KPSPAMS operasional pada rilis awal.'],
            ['code' => 'DSN-LMB', 'name' => 'Lemo Baru', 'notes' => 'Wilayah Dusun Lemo Baru, dilayani KPSPAMS Lemo Baru.'],
            ['code' => 'DSN-LMT', 'name' => 'Lemo Tua', 'notes' => 'Wilayah Dusun Lemo Tua, dilayani KPSPAMS Lemo Tua.'],
            ['code' => 'DSN-PKD', 'name' => 'Pakkandoang', 'notes' => 'Wilayah Dusun Pakkandoang. BUKAN KPSPAMS mandiri, dilayani di bawah KPSPAMS Sarampu 1.'],
        ];

        foreach ($dusuns as $dusun) {
            DB::table('dusun')->insert([
                'desa_id' => $desaId,
                'code' => $dusun['code'],
                'name' => $dusun['name'],
                'notes' => $dusun['notes'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
