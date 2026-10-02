# LAPORAN AUDIT TAHAP 05: BUSINESS LOGIC, BILLING ENGINE & FINANCIAL INTEGRITY
**Sistem Informasi KPSPAMS Desa Kuajang**
*Tanggal Audit: 2 Oktober 2026*
*Auditor: Tim Lead Auditor SI-KPSPAMS (Pre-Deployment Audit Team)*
*Status Kesiapan: PASSED WITH REMEDIATION (Semua Temuan High/Medium Terselesaikan)*

---

## 1. Ringkasan Eksekutif

Audit Tahap 05 memfokuskan pengujian mendalam dan pembuktian empiris (*evidence-based*) terhadap seluruh logika bisnis inti, mesin kalkulasi tagihan air (*Billing Engine*), deteksi anomali meter, integritas mutasi kas, mekanisme pembatalan (*Void T+0*), dan persetujuan bertingkat pembalikan pembayaran (*Supervised Reversal*) sesuai amanat Dokumen PRD, ERD, dan Dokumen Keamanan SI-KPSPAMS Desa Kuajang.

Seluruh pengujian dijalankan langsung melalui pengujian otomatis PHPUnit / Pest framework, static code analysis, dan simulasi skenario riil per 5 Oktober 2026.

---

## 2. Metodologi & Parameter Audit

Audit dilakukan terhadap komponen-komponen kritis berikut:
1. **Billing Engine Service (`BillingEngineService.php`)**:
   - Pemenuhan aturan tarif spesifik Dusun Lemo Baru (sistem gravitasi alam pegunungan, 0% beban listrik PLN, abonemen dasar Rp10.000 untuk 0–15 m³, kelebihan dihitung flat Rp1.000/m³).
   - Skema tarif progresif bertingkat (*tiered progressive rates*) untuk unit KPSPAMS lainnya (Lemo Tua & Sarampu 1/Pakkandoang).
   - Snapshot keabadian harga (*immutability snapshot*) pada invoice items saat penagihan dicetak.
2. **Meter Anomaly Detection (`MeterAnomalyService.php`)**:
   - Deteksi *Rollback* (stand meter mundur akibat salah catat atau pergantian fisik meter).
   - Deteksi *Usage Spike* (pemakaian melonjak > 300% dari rata-rata historis 3 bulan).
3. **Payment Processing & Cash Flow Integrity (`PaymentProcessingService.php`)**:
   - Eksekusi transaksi atomik via database lock (`lockForUpdate`).
   - Penambahan saldo kas KPSPAMS dan pencatatan mutasi arus kas masuk (`INCOME / AIR_PAYMENT`).
   - Perlindungan anti-pembayaran berlebih (*anti-overpayment guard*).
   - Pembatalan kasir hari yang sama (*Void T+0*) dengan pembalikan saldo kas dan catatan mutasi pengurang kas (`EXPENSE / KOREKSI_VOID`).
   - Mekanisme pengajuan dan persetujuan reversal beda hari (*Supervised Reversal*) oleh Ketua KPSPAMS / Admin Desa.

---

## 3. Daftar Temuan Audit (Audit Findings)

### FINDING-BIZ-001 (SEVERITY: HIGH)
- **ID**: `FINDING-BIZ-001`
- **Kategori**: Database Schema Integrity / Business Logic Failure
- **Lokasi**: `backend/database/migrations/2026_10_01_000007_create_invoice_and_payment_tables.php` & tabel `payment_reversals`
- **Deskripsi**: Kolom `approved_by` pada tabel `payment_reversals` didefinisikan tanpa flag `->nullable()`. Padahal alur bisnis resmi (PRD Seksi 4.3 dan ERD) mewajibkan bendahara/kasir mengajukan permohonan reversal dengan status awal pending approval (`approved_by = NULL`).
- **Bukti (Evidence)**:
  Pada migrasi awal:
  ```php
  $table->unsignedBigInteger('approved_by'); // NOT NULL
  ```
  Saat kasir memanggil endpoint `POST /api/v1/payments/{id}/request-reversal`, sistem menginput `['approved_by' => null]`. Pada RDBMS produksi seperti MySQL / MariaDB / PostgreSQL dengan strict mode aktif, transaksi akan gagal secara fatal dengan exception `SQLSTATE[23000]: Column 'approved_by' cannot be null`.
- **Dampak (Impact)**: Kasir tidak dapat mengajukan reversal pembayaran jika terjadi kesalahan kliring atau sengketa transaksi.
- **Rekomendasi**: Ubah kolom `approved_by` menjadi `->nullable()` pada skema migrasi dan buat file migrasi pembaruan.
- **Tindakan Perbaikan (Remediation)**:
  1. Memperbarui migrasi dasar `2026_10_01_000007_create_invoice_and_payment_tables.php` menambahkan `->nullable()`.
  2. Membuat migrasi baru `2026_10_02_000013_make_approved_by_nullable_in_payment_reversals_table.php` dan menjalankan `php artisan migrate`.
- **Status Verifikasi**: **CLOSED (FIXED & VERIFIED)**

---

### FINDING-BIZ-002 (SEVERITY: MEDIUM)
- **ID**: `FINDING-BIZ-002`
- **Kategori**: Transaction Guard & Anti-Tampering
- **Lokasi**: `backend/app/Services/PaymentProcessingService.php` (`processPayment`)
- **Deskripsi**: Tidak adanya validasi batas atas pembayaran terhadap sisa tagihan (`$lockedInvoice->balance_due`).
- **Bukti (Evidence)**:
  Sebelum perbaikan, metode hanya memeriksa `$amount <= 0`. Jika kasir salah ketik nominal (misal tagihan Rp10.000 diketik Rp100.000), sistem langsung menerima dan mencatat kas masuk Rp100.000 serta menaikkan saldo buku kas secara tidak akurat.
- **Dampak (Impact)**: Risiko ketidaksesuaian fisik kas dengan catatan digital akibat kesalahan input kasir (human error).
- **Rekomendasi**: Tambahkan pemeriksaan `if ($amount > $lockedInvoice->balance_due)` sebelum membuat record pembayaran.
- **Tindakan Perbaikan (Remediation)**:
  Menambahkan guard condition pada `PaymentProcessingService.php`:
  ```php
  if ($amount > $lockedInvoice->balance_due) {
      $formattedAmount = number_format($amount, 0, ',', '.');
      $formattedDue = number_format($lockedInvoice->balance_due, 0, ',', '.');
      throw new Exception("Nominal pembayaran (Rp {$formattedAmount}) melebihi sisa tagihan (Rp {$formattedDue}).");
  }
  ```
- **Status Verifikasi**: **CLOSED (FIXED & VERIFIED via unit test `test_it_rejects_overpayment`)**

---

### FINDING-BIZ-003 (SEVERITY: MEDIUM)
- **ID**: `FINDING-BIZ-003`
- **Kategori**: Clean Architecture & Separation of Concerns
- **Lokasi**: `backend/app/Http/Controllers/Api/V1/PaymentController.php` & `PaymentProcessingService.php`
- **Deskripsi**: Alur pengajuan (`requestReversal`) dan persetujuan reversal (`approveReversal`) sebelumnya ditulis langsung di controller HTTP, tidak terenkapsulasi di dalam domain service `PaymentProcessingService`.
- **Bukti (Evidence)**: Controller memuat puluhan baris database transaction dan pembuatan jurnal kas manual yang menyulitkan pengujian unit otomatis dan melanggar prinsip Single Responsibility.
- **Dampak (Impact)**: Risiko inkonsistensi mutasi jika reversal dipicu dari saluran lain (misalnya job worker / CLI reconciliation tool).
- **Rekomendasi**: Pindahkan seluruh alur bisnis reversal ke dalam `PaymentProcessingService` dan delegasikan pemanggilan dari controller.
- **Tindakan Perbaikan (Remediation)**:
  1. Menambahkan metode `requestReversal` dan `approveReversal` pada `PaymentProcessingService`.
  2. Memperbarui `PaymentController` untuk memanggil kedua metode service tersebut.
  3. Menyusun unit test komprehensif `PaymentProcessingTest.php` untuk menguji siklus hidup lengkap reversal.
- **Status Verifikasi**: **CLOSED (FIXED & VERIFIED)**

---

### FINDING-BIZ-004 (SEVERITY: INFORMATIONAL)
- **ID**: `FINDING-BIZ-004`
- **Kategori**: Business Rule Parity Verification
- **Lokasi**: `backend/app/Services/BillingEngineService.php`, `frontend/src/lib/demo-data.ts`, `docs/01_PRD.md`
- **Deskripsi**: Verifikasi keselarasan formula kalkulasi tagihan Lemo Baru antara backend Laravel dan antarmuka Next.js.
- **Bukti (Evidence)**:
  - Backend: Tier 1 (0-15 m³) tarif Rp0, Fixed Admin Fee Rp10.000, Tier 2 (>15 m³) tarif Rp1.000/m³.
  - Frontend: `calculateWaterBill(1, usageM3)` menghitung formula identik:
    - 0 m³ -> Rp10.000
    - 10 m³ -> Rp10.000
    - 15 m³ -> Rp10.000
    - 16 m³ -> Rp11.000
    - 18 m³ -> Rp13.000
    - 20 m³ -> Rp15.000
  - Unit test `test_billing_engine_service_generates_accurate_invoice_with_items` menguji invoice 18 m³ dan menghasilkan:
    - `water_amount` = Rp3.000
    - `admin_fee` = Rp10.000
    - `total_amount` = Rp13.000
    - Total 3 item invoice terperinci (Tier 1, Tier 2, Beban Bulanan).
- **Status Verifikasi**: **VERIFIED (PARITY CONFIRMED 100%)**

---

## 4. Hasil Eksekusi Test Suite (Automated Testing Evidence)

Pengujian otomatis dieksekusi menggunakan runner Laravel / Pest testing suite:

```bash
& "C:\xampp\php\php.exe" artisan test
```

### Hasil Log Pengujian:
```text
   PASS  Tests\Unit\MeterAnomalyTest
  ✓ it detects rollback anomaly when current reading is less than previous          0.13s  
  ✓ it verifies normal meter consumption                                            0.01s  
  ✓ it flags warning spike when usage exceeds 300 percent of average                0.01s  

   PASS  Tests\Unit\PaymentProcessingTest
  ✓ it successfully processes atomic payment                                        0.18s  
  ✓ it rejects overpayment                                                          0.04s  
  ✓ it successfully voids same day payment                                          0.04s  
  ✓ it rejects void for different day payment                                       0.04s  
  ✓ it handles supervised reversal lifecycle                                        0.05s  

   PASS  Tests\Unit\TieredTariffCalculationTest
  ✓ it correctly calculates progressive water tariff                                0.01s  
  ✓ it correctly calculates lemo baru tariff policy                                 0.01s  
  ✓ billing engine service generates accurate invoice with items                    0.04s  

   PASS  Tests\Feature\MultiTenantIsolationTest
  ✓ kpspams scope injects correct tenant id for regular kpspams user                0.02s  

  Tests:    12 passed (62 assertions)
  Duration: 0.77s
```

Semua 12 pengujian lulus dengan 62 assertion sukses tanpa kegagalan.

---

## 5. Matriks Verifikasi Kepatuhan Logika Bisnis

| Fitur / Aturan Bisnis | Dokumen Rujukan | Implementasi Sistem | Status Hasil Uji |
| :--- | :--- | :--- | :--- |
| **Tarif Lemo Baru (Gravitasi)** | PRD 3.2, 4.2 | `BillingEngineService` + Tariff Seeder | LULUS (Abonemen Rp10.000, 15 m³ gratis, Rp1.000/m³ kelebihan) |
| **Bebas Beban Listrik LMB** | PRD 3.2 | Flag `SUMUR_BOR` vs `GRAVITASI` | LULUS (Listrik PLN 0%) |
| **Penagihan Tgl 5 Oktober** | SK Kepala Desa 2026 | Seeder `BillingPeriod` (start: 01, bill: 05, due: 20) | LULUS (Jatuh tempo tgl 20) |
| **Clean Slate Rp 0 Saldo Awal** | Instruksi Peluncuran | `cash_accounts.current_balance = 0.00` | LULUS (Semua 6 rekening Rp 0) |
| **Atomisitas Pembayaran Kasir** | PRD 4.3 | `PaymentProcessingService::processPayment` | LULUS (DB Transaction + lock) |
| **Pencegahan Overpayment** | PRD 4.3 | Exception if amount > balance_due | LULUS (Ditolak dengan pesan jelas) |
| **Void Hari yang Sama (T+0)** | PRD 4.3 | `PaymentProcessingService::voidPayment` | LULUS (Status VOIDED, kas & invoice balik) |
| **Penolakan Void Beda Hari** | PRD 4.3 | Validasi `payment_date == now()` | LULUS (Wajib lewat Supervised Reversal) |
| **Supervised Reversal Berjenjang** | PRD 4.3, Matrix 4.1 | `requestReversal` & `approveReversal` | LULUS (Hanya Ketua/Admin Desa yg berhak approve) |
| **Deteksi Anomali Rollback** | PRD 4.1 | `MeterAnomalyService::evaluateReading` | LULUS (`ANOMALY_ROLLBACK` terpicu) |
| **Deteksi Lonjakan > 300%** | PRD 4.1 | `MeterAnomalyService::evaluateReading` | LULUS (`WARNING_SPIKE` terpicu) |

---

## 6. Kesimpulan Tahap 05

Tahap 05 (Business Logic, Billing Engine, and Financial Integrity Audit) dinyatakan **LULUS (PASSED)**. Tiga temuan (1 High, 2 Medium) telah diperbaiki tuntas dan dibuktikan dengan 12 unit/feature tests yang mencakup 62 assertions. Sistem siap dilanjutkan ke **Tahap 06: Frontend UX, Accessibility & Client-Side Audit**.
