# SI-KPSPAMS KUAJANG - QUALITY ASSURANCE & TESTING PLAN
**Rencana Pengujian Komprehensif, Skenario Isolasi Multi-Tenant, & Otomasi CI**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. PIRAMIDA PENGUJIAN (TESTING PYRAMID)

Sistem Informasi Pengelolaan KPSPAMS Kuajang menerapkan strategi pengujian berlapis untuk menjamin keandalan kalkulasi billing, integritas keuangan kas, dan keamanan isolasi data antar-KPSPAMS:

```
                  / \
                 /   \       E2E Tests (Playwright / Cypress)
                / E2E \      - Siklus Catat Meter s.d. Kwitansi
               /-------\     - Siklus Pengaduan s.d. Work Order
              / Feature \    Feature & API Integration Tests (Pest / PHPUnit)
             /   & API   \   - Validasi Endpoint, Sanitasi Input, Status Code
            /-------------\  - PENGUJIAN ISOLASI MULTI-TENANT & IDOR (KRUSIAL)
           /  Unit Tests   \ Unit Tests (Pest PHP & Vitest)
          /                 \- Algoritma Tarif Bertingkat, Anomali Rollback,
         /-------------------\- Kalkulasi Arus Kas, Formatter Angka
```

---

## 2. MATRIKS SKENARIO PENGUJIAN KRUSIAL (TEST SUITES)

### 2.1 Pengujian Isolasi Data Multi-KPSPAMS (Cross-Tenant Security Tests)
Ini adalah pengujian paling penting untuk menjamin kedaulatan data masing-masing unit KPSPAMS di Desa Kuajang.

| ID Tes | Skenario Pengujian | Akun Penguji | Target Resource | Ekspektasi Hasil |
|---|---|---|---|---|
| `SEC-TENANT-001` | Staf KPSPAMS Lemo Baru mencoba mengambil daftar pelanggan KPSPAMS Lemo Tua via API. | Admin KPSPAMS Lemo Baru (`kpspams_id=1`) | `GET /api/v1/customers` | Sistem **hanya** mengembalikan pelanggan dengan `kpspams_id=1`. Pelanggan Lemo Tua tidak muncul sama sekali. |
| `SEC-TENANT-002` | Staf KPSPAMS Lemo Baru mencoba mengakses detail invoice milik pelanggan KPSPAMS Lemo Tua via manipulasi URL ID (IDOR Attack). | Admin KPSPAMS Lemo Baru (`kpspams_id=1`) | `GET /api/v1/invoices/99` *(di mana invoice 99 milik KPSPAMS Lemo Tua)* | HTTP `404 Not Found` (tertahan oleh Global Scope) atau HTTP `403 Forbidden` (tertahan oleh Policy). |
| `SEC-TENANT-003` | Staf KPSPAMS Lemo Baru mencoba melakukan void pembayaran kasir milik KPSPAMS Sarampu 1. | Bendahara Lemo Baru | `POST /api/v1/payments/45/void` | Ditolak keras dengan HTTP `403 Forbidden` atau `404 Not Found`. Tidak ada mutasi kas yang terjadi. |
| `SEC-TENANT-004` | Staf KPSPAMS Sarampu 1 mengelola pelanggan di **Dusun Pakkandoang**. | Admin KPSPAMS Sarampu 1 (`kpspams_id=3`) | `GET /api/v1/customers?dusun_id=5` *(Pakkandoang)* | Berhasil (HTTP `200 OK`) karena Dusun Pakkandoang terdaftar resmi sebagai wilayah binaan KPSPAMS Sarampu 1. |
| `SEC-TENANT-005` | Admin Desa Kuajang memantau data seluruh KPSPAMS. | Admin Desa (`kpspams_id=NULL`) | `GET /api/v1/invoices` | Berhasil menampilkan agregat tagihan dari Lemo Baru, Lemo Tua, dan Sarampu 1. |
| `SEC-TENANT-006` | Pelanggan mencoba melihat tagihan tetangganya. | Pelanggan A (`customer_id=12`) | `GET /api/v1/invoices/88` *(milik customer_id=15)* | HTTP `403 Forbidden` (Pelanggan hanya boleh melihat `customer_id` miliknya sendiri). |

### 2.2 Pengujian Billing Engine & Deteksi Anomali Meter

| ID Tes | Skenario Pengujian | Input Data | Ekspektasi Hasil |
|---|---|---|---|
| `BIL-MTR-001` | Pembacaan Normal dengan Tarif Bertingkat (Tiered). | Stand Awal: $100\ m^3$, Stand Akhir: $125\ m^3$. Pemakaian: $25\ m^3$. Tarif: Tier 1 ($0-10\ m^3$ @ Rp 1.500), Tier 2 ($11-20\ m^3$ @ Rp 2.500), Tier 3 ($>20\ m^3$ @ Rp 3.500). Beban: Rp 5.000. | Subtotal Air = $(10 \times 1.500) + (10 \times 2.500) + (5 \times 3.500) = 15.000 + 25.000 + 17.500 = \text{Rp } 57.500$. Total Tagihan = $57.500 + 5.000 = \text{Rp } 62.500$. Invoice sukses terbentuk. |
| `BIL-MTR-002` | Deteksi Anomali Rollback (Stand Mundur). | Stand Awal: $150\ m^3$, Stand Akhir: $120\ m^3$. | Sistem **menolak pembuatan invoice langsung**. Status pembacaan diubah ke `ANOMALY_ROLLBACK`. Muncul warning validasi: *"Stand meter mundur, butuh verifikasi penggantian meter atau salah ketik."* |
| `BIL-MTR-003` | Verifikasi Penggantian Unit Meter Baru. | Meter lama diganti pada angka $155\ m^3$ (pemakaian meter lama = $155 - 150 = 5\ m^3$). Meter baru dipasang dari angka $0\ m^3$ dan terbaca $15\ m^3$. | Total Pemakaian = $5 + 15 = 20\ m^3$. Tagihan dihitung atas $20\ m^3$. Record meter baru dipasangkan ke sambungan. |
| `BIL-MTR-004` | Deteksi Lonjakan Ekstrem (Spike). | Rata-rata 3 bulan: $10\ m^3$. Bulan ini terbaca: $45\ m^3$ ($>300\%$). | Status ditandai `WARNING_SPIKE`. Tagihan ditahan sementara menunggu verifikasi teknisi lapangan. |
| `BIL-MTR-005` | Immutability Tarif Lama. | Tarif dinaikkan per 1 November 2026. Tagihan Oktober 2026 yang belum lunas dibuka kembali. | Nilai tagihan Oktober 2026 **TIDAK BERUBAH**, karena nilai `snapshot_rate` terkunci permanen di tabel `invoice_items`. |

### 2.3 Pengujian Transaksi Pembayaran, Void, & Konkurensi Kas

| ID Tes | Skenario Pengujian | Mekanisme & Input | Ekspektasi Hasil |
|---|---|---|---|
| `PAY-CON-001` | Pencegahan Pembayaran Ganda Bersamaan (Race Condition). | Dua kasir menekan tombol "Terima Pembayaran" secara serentak untuk invoice yang sama pada milidetik yang sama. | Mekanisme `DB::table('invoices')->lockForUpdate()` memastikan hanya 1 transaksi yang berhasil. Transaksi kedua melempar exception *"Invoice sudah dibayar"*. Saldo kas tidak terjadi selisih ganda. |
| `PAY-VOID-002` | Pembatalan Kasir Hari yang Sama ($T+0$). | Bendahara salah memasukkan nominal pembayaran tunai dan melakukan `VOID` sebelum tutup kas. | Baris `payments` ditandai status `VOIDED`. Invoice kembali ke status `UNPAID`. Saldo `cash_accounts` berkurang sejumlah nominal yang dibatalkan. Jejak audit mencatat alasan pembatalan. |
| `PAY-REV-003` | Pembalikan Pembayaran Lewat Hari (Reversal Berjenjang). | Bendahara mengajukan reversal atas pembayaran transfer bank yang gagal kliring 3 hari lalu. | Pengajuan berstatus `PENDING_APPROVAL`. Hanya setelah Ketua KPSPAMS menyetujui (`payment:approve_reversal`), status invoice kembali `UNPAID` dan transaksi jurnal balik dicatat di buku kas. |

---

## 3. IMPLEMENTASI KODE AUTOMATED TEST (CONTOH PEST TEST)

Contoh pengujian isolasi multi-tenant menggunakan framework **Pest PHP**:

```php
<?php

use App\Models\User;
use App\Models\Kpspams;
use App\Models\Invoice;
use App\Models\Customer;

test('staf kpspams lemo baru dilarang keras melihat tagihan kpspams lemo tua', function () {
    // 1. Arrange: Buat dua unit KPSPAMS
    $kpspamsLemoBaru = Kpspams::factory()->create(['name' => 'KPSPAMS Lemo Baru']);
    $kpspamsLemoTua  = Kpspams::factory()->create(['name' => 'KPSPAMS Lemo Tua']);

    // 2. Buat akun staf di Lemo Baru
    $userLemoBaru = User::factory()->create([
        'kpspams_id' => $kpspamsLemoBaru->id,
    ]);
    $userLemoBaru->assignRole('admin_kpspams');

    // 3. Buat invoice milik pelanggan Lemo Tua
    $customerLemoTua = Customer::factory()->create(['kpspams_id' => $kpspamsLemoTua->id]);
    $invoiceLemoTua = Invoice::factory()->create([
        'kpspams_id' => $kpspamsLemoTua->id,
        'customer_id' => $customerLemoTua->id,
    ]);

    // 4. Act & Assert: Staf Lemo Baru memanggil API invoice Lemo Tua
    $response = $this->actingAs($userLemoBaru, 'sanctum')
                     ->getJson("/api/v1/invoices/{$invoiceLemoTua->id}");

    // Harus 404 (karena terfilter oleh Global Scope) atau 403 Forbidden
    expect($response->status())->toBeIn([403, 404]);
});
```

---

## 4. TARGET COVERAGE & INTEGRASI CI/CD PIPELINE

- **Target Code Coverage**:
  - Service Layer & Business Rules (Billing, Anomaly, Payment): $\ge 90\%$
  - API Controllers & Form Requests: $\ge 85\%$
  - Eloquent Policies & Tenancy Scopes: $100\%$
  - Frontend User Journey Kritis: $\ge 80\%$
- **CI Pipeline Workflow** (Dijalankan setiap push ke branch `develop` & `main`):
  1. Jalankan `php artisan pint --test` (Linter PHP PSR-12).
  2. Jalankan `npm run lint` & `tsc --noEmit` (TypeScript Type Checker).
  3. Jalankan `php artisan test --coverage-clover=coverage.xml`.
  4. Jalankan E2E smoke tests pada Docker test container.
  5. Hanya rilis bila seluruh tahapan hijau ($100\%$ lulus).
