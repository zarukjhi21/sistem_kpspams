<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KpspamsSeeder extends Seeder
{
    public function run(): void
    {
        $desa = DB::table('desa')->where('code', '76.04.03.2001')->first();
        if (!$desa) {
            return;
        }

        // Ambil ID seluruh dusun
        $dusunSarampu1 = DB::table('dusun')->where('code', 'DSN-SR1')->first();
        $dusunSarampu2 = DB::table('dusun')->where('code', 'DSN-SR2')->first();
        $dusunLemoBaru = DB::table('dusun')->where('code', 'DSN-LMB')->first();
        $dusunLemoTua  = DB::table('dusun')->where('code', 'DSN-LMT')->first();
        $dusunPakkandoang = DB::table('dusun')->where('code', 'DSN-PKD')->first();

        // 1. KPSPAMS Lemo Baru
        $kpspamsLemoBaruId = DB::table('kpspams')->insertGetId([
            'desa_id' => $desa->id,
            'code' => 'KP-LMB',
            'name' => 'KPSPAMS Lemo Baru',
            'decree_number' => 'SK.DESA/014/KUAJANG/2019',
            'established_date' => '2019-03-15',
            'office_address' => 'Dusun Lemo Baru RT 02, Desa Kuajang',
            'contact_phone' => '082199887766',
            'contact_email' => 'lemobaru@kpspams.desakuajang.id',
            'bank_account_info' => 'BRI Cabang Polewali: 0214-01-002345-53-1 a.n KPSPAMS Lemo Baru',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mapping Wilayah: KPSPAMS Lemo Baru melayani Dusun Lemo Baru
        DB::table('kpspams_dusun')->insert([
            'kpspams_id' => $kpspamsLemoBaruId,
            'dusun_id' => $dusunLemoBaru->id,
            'assigned_date' => '2019-03-15',
            'is_primary' => true,
            'created_at' => now(),
        ]);

        // 2. KPSPAMS Lemo Tua
        $kpspamsLemoTuaId = DB::table('kpspams')->insertGetId([
            'desa_id' => $desa->id,
            'code' => 'KP-LMT',
            'name' => 'KPSPAMS Lemo Tua',
            'decree_number' => 'SK.DESA/018/KUAJANG/2020',
            'established_date' => '2020-07-20',
            'office_address' => 'Dusun Lemo Tua RT 01, Desa Kuajang',
            'contact_phone' => '082188776655',
            'contact_email' => 'lemotua@kpspams.desakuajang.id',
            'bank_account_info' => 'BPD Sulselbar Binuang: 510-02-004321-7 a.n KPSPAMS Lemo Tua',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mapping Wilayah: KPSPAMS Lemo Tua melayani Dusun Lemo Tua
        DB::table('kpspams_dusun')->insert([
            'kpspams_id' => $kpspamsLemoTuaId,
            'dusun_id' => $dusunLemoTua->id,
            'assigned_date' => '2020-07-20',
            'is_primary' => true,
            'created_at' => now(),
        ]);

        // 3. KPSPAMS Sarampu 1
        // CATATAN PENTING: KPSPAMS Sarampu 1 melayani 2 Dusun: Dusun Sarampu 1 & Dusun Pakkandoang.
        // Pakkandoang BUKAN KPSPAMS mandiri.
        $kpspamsSarampu1Id = DB::table('kpspams')->insertGetId([
            'desa_id' => $desa->id,
            'code' => 'KP-SR1',
            'name' => 'KPSPAMS Sarampu 1',
            'decree_number' => 'SK.DESA/009/KUAJANG/2018',
            'established_date' => '2018-05-10',
            'office_address' => 'Dusun Sarampu 1 RT 03, Desa Kuajang',
            'contact_phone' => '082177665544',
            'contact_email' => 'sarampu1@kpspams.desakuajang.id',
            'bank_account_info' => 'BRI Cabang Polewali: 0214-01-007890-53-4 a.n KPSPAMS Sarampu 1',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mapping Wilayah: KPSPAMS Sarampu 1 melayani Dusun Sarampu 1
        DB::table('kpspams_dusun')->insert([
            'kpspams_id' => $kpspamsSarampu1Id,
            'dusun_id' => $dusunSarampu1->id,
            'assigned_date' => '2018-05-10',
            'is_primary' => true,
            'created_at' => now(),
        ]);

        // Mapping Wilayah: KPSPAMS Sarampu 1 melayani Dusun Pakkandoang
        DB::table('kpspams_dusun')->insert([
            'kpspams_id' => $kpspamsSarampu1Id,
            'dusun_id' => $dusunPakkandoang->id,
            'assigned_date' => '2018-05-10',
            'is_primary' => false,
            'created_at' => now(),
        ]);

        // CATATAN: Dusun Sarampu 2 ($dusunSarampu2->id) sengaja TIDAK dimasukkan ke kpspams_dusun,
        // sesuai requirement bahwa Sarampu 2 belum memiliki unit KPSPAMS aktif.
    }
}
