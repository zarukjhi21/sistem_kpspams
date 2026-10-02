<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerTypeTariffSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Customer Types
        $types = [
            ['code' => 'RUMAH_TANGGA', 'name' => 'Rumah Tangga', 'description' => 'Warga umum tempat tinggal keluarga'],
            ['code' => 'NIAGA', 'name' => 'Niaga / Usaha', 'description' => 'Warung, kios, bengkel, peternakan, dan usaha warga'],
            ['code' => 'SOSIAL', 'name' => 'Sosial / Ibadah', 'description' => 'Masjid, musholla, pesantren, dan posyandu'],
            ['code' => 'INSTANSI', 'name' => 'Instansi / Pemerintah', 'description' => 'Kantor desa, sekolah, puskesmas pembantu'],
        ];

        $typeIds = [];
        foreach ($types as $t) {
            $existing = DB::table('customer_types')->where('code', $t['code'])->first();
            if ($existing) {
                $typeIds[$t['code']] = $existing->id;
            } else {
                $typeIds[$t['code']] = DB::table('customer_types')->insertGetId([
                    'code' => $t['code'],
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'is_active' => true,
                    'created_at' => now(),
                ]);
            }
        }

        $kpspLemoBaru = DB::table('kpspams')->where('code', 'KP-LMB')->first();
        $kpspLemoTua  = DB::table('kpspams')->where('code', 'KP-LMT')->first();
        $kpspSarampu1 = DB::table('kpspams')->where('code', 'KP-SR1')->first();

        // Bersihkan tarif lama agar idempotent saat re-seed
        if ($kpspLemoBaru) {
            DB::table('tariffs')->where('kpspams_id', $kpspLemoBaru->id)->delete();
        }
        if ($kpspLemoTua) {
            DB::table('tariffs')->where('kpspams_id', $kpspLemoTua->id)->delete();
        }
        if ($kpspSarampu1) {
            DB::table('tariffs')->where('kpspams_id', $kpspSarampu1->id)->delete();
        }

        // 2. Skema Tarif Masing-Masing KPSPAMS (TIDAK DIASUMSIKAN SAMA)
        // 2.1 Tarif KPSPAMS Lemo Baru (Rumah Tangga)
        // Kebijakan Resmi: Rp10.000/bulan sampai 15 kubik. Lebih dari 15 kubik dikenakan Rp1.000/kubik.
        $tLmbId = DB::table('tariffs')->insertGetId([
            'kpspams_id' => $kpspLemoBaru->id,
            'customer_type_id' => $typeIds['RUMAH_TANGGA'],
            'name' => 'Tarif Air Rumah Tangga Lemo Baru (Beban Min. 15 m³)',
            'effective_from' => '2026-01-01',
            'effective_until' => null,
            'status' => 'ACTIVE',
            'fixed_admin_fee' => 10000.00, // Biaya beban paket dasar bulanan sampai 15 m³
            'maintenance_fee' => 0.00,
            'late_penalty_fee' => 0.00, // MVP: Default Rp0
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tariff_components')->insert([
            ['tariff_id' => $tLmbId, 'tier_order' => 1, 'tier_min_m3' => 0, 'tier_max_m3' => 15, 'rate_per_m3' => 0.00, 'created_at' => now()],
            ['tariff_id' => $tLmbId, 'tier_order' => 2, 'tier_min_m3' => 16, 'tier_max_m3' => null, 'rate_per_m3' => 1000.00, 'created_at' => now()],
        ]);

        // 2.2 Tarif KPSPAMS Lemo Tua (Rumah Tangga - Otonom Lebih Tinggi Karena Pompa Dalam)
        $tLmtId = DB::table('tariffs')->insertGetId([
            'kpspams_id' => $kpspLemoTua->id,
            'customer_type_id' => $typeIds['RUMAH_TANGGA'],
            'name' => 'Tarif Air Rumah Tangga LMT 2026',
            'effective_from' => '2026-01-01',
            'effective_until' => null,
            'status' => 'ACTIVE',
            'fixed_admin_fee' => 6000.00,
            'maintenance_fee' => 3000.00,
            'late_penalty_fee' => 0.00, // MVP: Default Rp0
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tariff_components')->insert([
            ['tariff_id' => $tLmtId, 'tier_order' => 1, 'tier_min_m3' => 0, 'tier_max_m3' => 10, 'rate_per_m3' => 1750.00, 'created_at' => now()],
            ['tariff_id' => $tLmtId, 'tier_order' => 2, 'tier_min_m3' => 11, 'tier_max_m3' => 20, 'rate_per_m3' => 2750.00, 'created_at' => now()],
            ['tariff_id' => $tLmtId, 'tier_order' => 3, 'tier_min_m3' => 21, 'tier_max_m3' => null, 'rate_per_m3' => 3750.00, 'created_at' => now()],
        ]);

        // 2.3 Tarif KPSPAMS Sarampu 1 (Melayani Sarampu 1 & Pakkandoang)
        $tSr1Id = DB::table('tariffs')->insertGetId([
            'kpspams_id' => $kpspSarampu1->id,
            'customer_type_id' => $typeIds['RUMAH_TANGGA'],
            'name' => 'Tarif Air Rumah Tangga SR1 & Pakkandoang 2026',
            'effective_from' => '2026-01-01',
            'effective_until' => null,
            'status' => 'ACTIVE',
            'fixed_admin_fee' => 5000.00,
            'maintenance_fee' => 2500.00,
            'late_penalty_fee' => 0.00, // MVP: Default Rp0
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tariff_components')->insert([
            ['tariff_id' => $tSr1Id, 'tier_order' => 1, 'tier_min_m3' => 0, 'tier_max_m3' => 10, 'rate_per_m3' => 1500.00, 'created_at' => now()],
            ['tariff_id' => $tSr1Id, 'tier_order' => 2, 'tier_min_m3' => 11, 'tier_max_m3' => 20, 'rate_per_m3' => 2500.00, 'created_at' => now()],
            ['tariff_id' => $tSr1Id, 'tier_order' => 3, 'tier_min_m3' => 21, 'tier_max_m3' => null, 'rate_per_m3' => 3500.00, 'created_at' => now()],
        ]);
    }
}
