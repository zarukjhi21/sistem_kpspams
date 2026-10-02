<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['name' => 'super_admin', 'display_name' => 'Super Admin', 'description' => 'Akses penuh teknis & DevOps', 'scope_level' => 'GLOBAL'],
            ['name' => 'admin_desa', 'display_name' => 'Admin Desa', 'description' => 'Operator IT Desa Kuajang, agregat seluruh unit', 'scope_level' => 'DESA'],
            ['name' => 'pemerintah_desa', 'display_name' => 'Pemerintah Desa', 'description' => 'Kepala Desa & BPD (Monitoring Eksekutif)', 'scope_level' => 'DESA'],
            ['name' => 'ketua_kpspams', 'display_name' => 'Ketua KPSPAMS', 'description' => 'Pimpinan unit KPSPAMS lokal', 'scope_level' => 'KPSPAMS'],
            ['name' => 'admin_kpspams', 'display_name' => 'Admin KPSPAMS', 'description' => 'Tata usaha, pelanggan, billing & tiket pengaduan', 'scope_level' => 'KPSPAMS'],
            ['name' => 'bendahara_kpspams', 'display_name' => 'Bendahara KPSPAMS', 'description' => 'Kasir, penerimaan pembayaran, kas & pengeluaran', 'scope_level' => 'KPSPAMS'],
            ['name' => 'petugas_lapangan', 'display_name' => 'Petugas Lapangan', 'description' => 'Pencatat meter & teknisi Work Order', 'scope_level' => 'KPSPAMS'],
            ['name' => 'pelanggan', 'display_name' => 'Pelanggan / Warga', 'description' => 'Warga pengguna air (self-service portal)', 'scope_level' => 'CUSTOMER'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert([
                'name' => $role['name'],
                'display_name' => $role['display_name'],
                'description' => $role['description'],
                'scope_level' => $role['scope_level'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Granular Permissions
        $permissions = [
            // Master
            ['name' => 'desa:read', 'category' => 'Master', 'display_name' => 'Lihat Profil Desa'],
            ['name' => 'desa:update', 'category' => 'Master', 'display_name' => 'Ubah Profil Desa'],
            ['name' => 'dusun:manage', 'category' => 'Master', 'display_name' => 'Kelola Master Dusun'],
            ['name' => 'kpspams:manage', 'category' => 'Master', 'display_name' => 'Kelola Master KPSPAMS'],
            ['name' => 'wilayah:assign', 'category' => 'Master', 'display_name' => 'Kelola Wilayah Layanan'],

            // Users & RBAC
            ['name' => 'user:read', 'category' => 'User', 'display_name' => 'Lihat Daftar Pengguna'],
            ['name' => 'user:create_staff', 'category' => 'User', 'display_name' => 'Buat Pengguna Staf'],
            ['name' => 'user:update_staff', 'category' => 'User', 'display_name' => 'Ubah Pengguna Staf'],
            ['name' => 'user:delete_staff', 'category' => 'User', 'display_name' => 'Hapus Pengguna Staf'],

            // Pelanggan & Sambungan
            ['name' => 'customer:read', 'category' => 'Pelanggan', 'display_name' => 'Lihat Data Pelanggan'],
            ['name' => 'customer:create', 'category' => 'Pelanggan', 'display_name' => 'Tambah Pelanggan Baru'],
            ['name' => 'customer:update', 'category' => 'Pelanggan', 'display_name' => 'Ubah Data Pelanggan'],
            ['name' => 'customer:delete', 'category' => 'Pelanggan', 'display_name' => 'Hapus Pelanggan'],
            ['name' => 'connection:read', 'category' => 'Sambungan', 'display_name' => 'Lihat Sambungan Rumah'],
            ['name' => 'connection:create', 'category' => 'Sambungan', 'display_name' => 'Tambah Sambungan Baru'],
            ['name' => 'connection:change_status', 'category' => 'Sambungan', 'display_name' => 'Ubah Status Sambungan (Segel/Putus)'],

            // Meter & Catat Meter
            ['name' => 'meter:read', 'category' => 'Meter', 'display_name' => 'Lihat Register Meter'],
            ['name' => 'meter:manage', 'category' => 'Meter', 'display_name' => 'Kelola Fisik Meter Air'],
            ['name' => 'meter_reading:read', 'category' => 'Catat Meter', 'display_name' => 'Lihat Histori Pembacaan'],
            ['name' => 'meter_reading:input', 'category' => 'Catat Meter', 'display_name' => 'Input Stand Meter & Foto'],
            ['name' => 'meter_reading:verify', 'category' => 'Catat Meter', 'display_name' => 'Verifikasi Pembacaan Meter'],
            ['name' => 'meter_reading:resolve_anomaly', 'category' => 'Catat Meter', 'display_name' => 'Penyelesaian Anomali Rollback'],

            // Tarif & Periode
            ['name' => 'tariff:read', 'category' => 'Tarif', 'display_name' => 'Lihat Master Tarif'],
            ['name' => 'tariff:create', 'category' => 'Tarif', 'display_name' => 'Buat Versi Tarif Baru'],
            ['name' => 'billing_policy:manage', 'category' => 'Billing', 'display_name' => 'Kelola Kebijakan Jatuh Tempo & Denda'],
            ['name' => 'billing_period:open', 'category' => 'Billing', 'display_name' => 'Buka Periode Tagihan Baru'],
            ['name' => 'billing_period:close', 'category' => 'Billing', 'display_name' => 'Tutup Buku Periode Tagihan'],

            // Billing & Invoices
            ['name' => 'invoice:generate', 'category' => 'Invoice', 'display_name' => 'Generate Tagihan Bulanan'],
            ['name' => 'invoice:read', 'category' => 'Invoice', 'display_name' => 'Lihat Data Tagihan'],
            ['name' => 'invoice:pdf_download', 'category' => 'Invoice', 'display_name' => 'Download Cetak Tagihan PDF'],
            ['name' => 'invoice:void', 'category' => 'Invoice', 'display_name' => 'Batalkan Tagihan'],

            // Kasir & Pembayaran
            ['name' => 'payment:create', 'category' => 'Kasir', 'display_name' => 'Proses Penerimaan Pembayaran'],
            ['name' => 'payment:read', 'category' => 'Kasir', 'display_name' => 'Lihat Histori Pembayaran'],
            ['name' => 'payment:receipt_pdf', 'category' => 'Kasir', 'display_name' => 'Cetak Kwitansi Pembayaran PDF'],
            ['name' => 'payment:void_today', 'category' => 'Kasir', 'display_name' => 'Void Kasir Hari Sama (T+0)'],
            ['name' => 'payment:request_reversal', 'category' => 'Kasir', 'display_name' => 'Ajukan Pembalikan Pembayaran'],
            ['name' => 'payment:approve_reversal', 'category' => 'Kasir', 'display_name' => 'Persetujuan Pembalikan Kasir'],

            // Layanan & Work Order
            ['name' => 'complaint:create', 'category' => 'Pengaduan', 'display_name' => 'Buat Laporan Pengaduan'],
            ['name' => 'complaint:read', 'category' => 'Pengaduan', 'display_name' => 'Lihat Daftar Pengaduan'],
            ['name' => 'complaint:verify', 'category' => 'Pengaduan', 'display_name' => 'Verifikasi Pengaduan Warga'],
            ['name' => 'complaint:reject', 'category' => 'Pengaduan', 'display_name' => 'Tolak Laporan Pengaduan'],
            ['name' => 'work_order:create', 'category' => 'Work Order', 'display_name' => 'Terbitkan Surat Perintah Kerja'],
            ['name' => 'work_order:read', 'category' => 'Work Order', 'display_name' => 'Lihat Daftar Work Order'],
            ['name' => 'work_order:execute', 'category' => 'Work Order', 'display_name' => 'Mulai Pengerjaan Lapangan'],
            ['name' => 'work_order:complete', 'category' => 'Work Order', 'display_name' => 'Selesaikan Work Order & Material'],

            // Aset, Pemeliharaan & Material
            ['name' => 'asset:read', 'category' => 'Aset', 'display_name' => 'Lihat Register Aset'],
            ['name' => 'asset:manage', 'category' => 'Aset', 'display_name' => 'Kelola Aset Jaringan & Pompa'],
            ['name' => 'maintenance:log', 'category' => 'Aset', 'display_name' => 'Catat Riwayat Pemeliharaan'],
            ['name' => 'inventory:read', 'category' => 'Inventaris', 'display_name' => 'Lihat Stok Material'],
            ['name' => 'inventory:manage', 'category' => 'Inventaris', 'display_name' => 'Kelola Stok & Pembelian Material'],

            // Keuangan & Kas
            ['name' => 'cash_account:manage', 'category' => 'Keuangan', 'display_name' => 'Kelola Akun Kas & Rekening Bank'],
            ['name' => 'finance:read', 'category' => 'Keuangan', 'display_name' => 'Lihat Buku Kas & Arus Kas'],
            ['name' => 'finance:create_expense', 'category' => 'Keuangan', 'display_name' => 'Catat Pengeluaran Operasional'],
            ['name' => 'finance:transfer_cash', 'category' => 'Keuangan', 'display_name' => 'Transfer Antar Rekening Kas'],

            // Dashboard & Laporan
            ['name' => 'dashboard:desa_view', 'category' => 'Dashboard', 'display_name' => 'Dashboard Agregat Seluruh Desa'],
            ['name' => 'dashboard:kpspams_view', 'category' => 'Dashboard', 'display_name' => 'Dashboard Operasional KPSPAMS'],
            ['name' => 'dashboard:customer_view', 'category' => 'Dashboard', 'display_name' => 'Dashboard Mandiri Pelanggan'],
            ['name' => 'report:view_all', 'category' => 'Laporan', 'display_name' => 'Laporan Konsolidasi Seluruh KPSPAMS'],
            ['name' => 'report:view_kpspams', 'category' => 'Laporan', 'display_name' => 'Laporan Unit KPSPAMS'],
            ['name' => 'report:export', 'category' => 'Laporan', 'display_name' => 'Ekspor Laporan PDF & Excel'],

            // Audit & Sistem
            ['name' => 'audit_log:view', 'category' => 'Keamanan', 'display_name' => 'Lihat Jejak Audit Sistem'],
        ];

        foreach ($permissions as $perm) {
            DB::table('permissions')->insert([
                'name' => $perm['name'],
                'category' => $perm['category'],
                'display_name' => $perm['display_name'],
                'created_at' => now(),
            ]);
        }
    }
}
