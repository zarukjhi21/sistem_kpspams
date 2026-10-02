<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BillingPolicyAndOpeningBalanceSeeder extends Seeder
{
    public function run(): void
    {
        $kpspLemoBaru = DB::table('kpspams')->where('code', 'KP-LMB')->first();
        $kpspLemoTua  = DB::table('kpspams')->where('code', 'KP-LMT')->first();
        $kpspSarampu1 = DB::table('kpspams')->where('code', 'KP-SR1')->first();

        $units = [$kpspLemoBaru, $kpspLemoTua, $kpspSarampu1];

        // 1. Kebijakan Billing & Rekomendasi Pemutusan (Configurable Policy)
        foreach ($units as $u) {
            DB::table('kpspams_billing_policies')->insert([
                'kpspams_id' => $u->id,
                'due_day_of_month' => 20,                // Jatuh tempo tanggal 20 setiap bulan
                'late_penalty_type' => 'NONE',           // MVP: Belum ada denda otomatis
                'late_penalty_amount' => 0.00,           // MVP: Default Rp0
                'sp1_arrears_months' => 1,               // 1 bulan tunggakan -> Status SP1
                'sp2_arrears_months' => 2,               // 2 bulan tunggakan -> Status SP2
                'disconnect_recommendation_months' => 3, // 3 bulan tunggakan -> Rekomendasi Administratif Putus
                'reconnect_fee' => 0.00,                 // Biaya reconnect belum dipungut
                'is_auto_disconnect' => false,           // Sistem TIDAK melakukan pemutusan fisik otomatis
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Fitur Saldo Awal (Opening Balance) Resmi Per Unit KPSPAMS
        // Sesuai instruksi peluncuran 5 Oktober 2026: Saldo awal dinolkan (Rp 0 / Clean Slate)
        // Pengurus dapat menginput saldo awal riil saat serah terima kas resmi.

        // 2.1 KPSPAMS Lemo Baru
        DB::table('cash_accounts')->insert([
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'account_code' => 'KAS-LMB-TUNAI',
                'account_name' => 'Kas Tunai Bendahara Lemo Baru',
                'bank_name' => 'KAS TUNAI',
                'account_number' => null,
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo awal kas tunai per 5 Oktober 2026 (Siap input serah terima pengurus)',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kpspams_id' => $kpspLemoBaru->id,
                'account_code' => 'BANK-LMB-BRI',
                'account_name' => 'Rekening BRI KPSPAMS Lemo Baru',
                'bank_name' => 'Bank BRI',
                'account_number' => '0214-01-002345-53-1',
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo awal rekening bank operasional LMB per 5 Okt 2026',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2.2 KPSPAMS Lemo Tua
        DB::table('cash_accounts')->insert([
            [
                'kpspams_id' => $kpspLemoTua->id,
                'account_code' => 'KAS-LMT-TUNAI',
                'account_name' => 'Kas Tunai Bendahara Lemo Tua',
                'bank_name' => 'KAS TUNAI',
                'account_number' => null,
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo awal kas tunai per 5 Oktober 2026 (Persiapan Tahap 2)',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kpspams_id' => $kpspLemoTua->id,
                'account_code' => 'BANK-LMT-SULSELBAR',
                'account_name' => 'Rekening BPD Sulselbar Lemo Tua',
                'bank_name' => 'Bank Sulselbar',
                'account_number' => '510-02-004321-7',
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo awal buku tabungan kas LMT per 5 Okt 2026',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2.3 KPSPAMS Sarampu 1 (Sarampu 1 & Pakkandoang)
        DB::table('cash_accounts')->insert([
            [
                'kpspams_id' => $kpspSarampu1->id,
                'account_code' => 'KAS-SR1-TUNAI',
                'account_name' => 'Kas Tunai Bendahara Sarampu 1 & Pakkandoang',
                'bank_name' => 'KAS TUNAI',
                'account_number' => null,
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo awal kas tunai unit gabungan Sarampu 1 & Pakkandoang per 5 Okt 2026',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kpspams_id' => $kpspSarampu1->id,
                'account_code' => 'BANK-SR1-BRI',
                'account_name' => 'Rekening BRI KPSPAMS Sarampu 1',
                'bank_name' => 'Bank BRI',
                'account_number' => '0214-01-007890-53-4',
                'opening_balance' => 0.00,
                'opening_balance_date' => '2026-10-05',
                'opening_balance_notes' => 'Saldo rekening giro/tabungan BRI SR1 per 5 Okt 2026',
                'current_balance' => 0.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
