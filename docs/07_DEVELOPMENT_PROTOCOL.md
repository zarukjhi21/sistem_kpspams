# SI-KPSPAMS KUAJANG - ENGINEERING & DEVELOPMENT PROTOCOL
**Standar Rekayasa Perangkat Lunak, Alur Kerja Git, & Konvensi Kode**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. STRUKTUR WORKFLOW GIT & BRANCHING

Sistem dikembangkan dengan alur kerja **GitFlow Terstandar** untuk menjamin stabilitas kode produksi:

```
main (Production Ready - Siap Deploy ke Server Desa Kuajang)
  │
  └── staging (Release Candidate & UAT Pengurus KPSPAMS)
        │
        └── develop (Cabang Integrasi Utama Developer)
              │
              ├── feature/auth-sanctum
              ├── feature/meter-anomaly-detection
              ├── feature/billing-engine-tiers
              ├── feature/mobile-field-pwa
              └── bugfix/void-payment-rollback
```

### Aturan Penamaan Branch:
- `feature/<nama-fitur>`: Penambahan modul atau kapabilitas baru.
- `bugfix/<nama-bug>`: Perbaikan kecacatan logika atau keamanan di tahap testing.
- `hotfix/<isu-kritis>`: Perbaikan darurat langsung diturunkan dari `main`.

### Konvensi Commit Message (Conventional Commits):
Format: `<type>(<scope>): <keterangan singkat>`
Contoh:
- `feat(billing): implement tiered tariff calculation for household category`
- `fix(meter): prevent negative usage calculation on rollback reading`
- `refactor(auth): enforce kpspams tenant scope on invoice policy`
- `test(payment): add unit test for supervised payment reversal`
- `docs(api): update swagger spec for work order completion endpoint`

---

## 2. KONVENSI PENGEMBANGAN BACKEND (LARAVEL 11 & PHP 8.3+)

### 2.1 Deklarasi Tipe Ketat (Strict Typing)
Setiap berkas PHP wajib diawali dengan:
```php
<?php

declare(strict_types=1);
```

### 2.2 Arsitektur Service-Action Pattern
Dilarang menaruh logika bisnis yang rumit di dalam Controller.
- **Controller**: Bertanggung jawab menerima request HTTP, memanggil Service/Action, dan mengembalikan `JsonResponse` melalui API Resource.
- **Service/Action**: Berisi murni algoritma bisnis, kalkulasi matematika tarif, validasi logika, dan manipulasi data.
- **Atomic Database Transaction**: Setiap aksi yang melibatkan lebih dari satu mutasi tabel (contoh: Pembayaran Tagihan yang memperbarui tabel `payments`, `invoices`, `cash_accounts`, dan `audit_logs`) **WAJIB** dibungkus dalam `DB::transaction()`:

```php
namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\CashAccount;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentProcessingService
{
    public function processCashPayment(Invoice $invoice, float $amount, int $cashAccountId, int $userId): Payment
    {
        return DB::transaction(function () use ($invoice, $amount, $cashAccountId, $userId) {
            // 1. Lock invoice row untuk mencegah race condition (double payment)
            $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->firstOrFail();

            if ($lockedInvoice->status === 'PAID') {
                throw new Exception("Invoice sudah lunas.");
            }

            // 2. Buat record pembayaran
            $payment = Payment::create([
                'kpspams_id' => $lockedInvoice->kpspams_id,
                'invoice_id' => $lockedInvoice->id,
                'customer_id' => $lockedInvoice->customer_id,
                'cash_account_id' => $cashAccountId,
                'received_by_user_id' => $userId,
                'receipt_number' => $this->generateReceiptNumber($lockedInvoice->kpspams_id),
                'amount_paid' => $amount,
                'payment_method' => 'CASH',
                'status' => 'SUCCESS',
            ]);

            // 3. Update status invoice
            $lockedInvoice->paid_amount += $amount;
            $lockedInvoice->balance_due = max(0, $lockedInvoice->total_amount - $lockedInvoice->paid_amount);
            $lockedInvoice->status = $lockedInvoice->balance_due == 0 ? 'PAID' : 'PARTIALLY_PAID';
            $lockedInvoice->paid_at = now();
            $lockedInvoice->save();

            // 4. Update saldo kas unit
            CashAccount::where('id', $cashAccountId)->increment('current_balance', $amount);

            // 5. Catat mutasi arus kas
            $this->recordFinancialTransaction($payment, $cashAccountId);

            return $payment;
        });
    }
}
```

### 2.3 Form Request Validation Terpusat
Setiap input dari klien harus divalidasi melalui Form Request terdedikasi dengan pesan kesalahan berbahasa Indonesia yang jelas:
```php
namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeterReadingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('meter_reading:input');
    }

    public function rules(): array
    {
        return [
            'connection_id' => ['required', 'exists:connections,id'],
            'current_reading' => ['required', 'numeric', 'min:0'],
            'reading_date' => ['required', 'date'],
            'meter_photo' => ['required', 'image', 'mimes:jpeg,jpg,png', 'max:5120'], // Max 5MB
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
```

---

## 3. KONVENSI PENGEMBANGAN FRONTEND (NEXT.JS & TYPESCRIPT)

### 3.1 Type-Safety & Skema Validasi
1. Dilarang menggunakan tipe `any` pada TypeScript. Semua tipe respon backend harus dipetakan dalam folder `src/types/`.
2. Seluruh form input divalidasi menggunakan pustaka **Zod** yang sinkron dengan Form Request Laravel:
```typescript
import { z } from "zod";

export const meterReadingSchema = z.object({
  connection_id: z.number().int().positive("Pilih sambungan yang valid"),
  current_reading: z.coerce.number().min(0, "Angka meter tidak boleh negatif"),
  reading_date: z.string().min(1, "Tanggal pembacaan wajib diisi"),
  anomaly_notes: z.string().optional(),
});

export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
```

### 3.2 Manajemen State & Network Cache
- **Server State**: Dikelola secara deklaratif menggunakan `@tanstack/react-query`. Kunci cache (`queryKey`) wajib memuat tenant context (`['invoices', currentKpspamsId, page]`) untuk menghindari pencemaran data cache antar unit.
- **Client/UI State**: Dikelola menggunakan pustaka ringan `zustand` (misal: state navigasi sidebar, context switcher aktif).

---

## 4. PROTOKOL DATABASE SEEDING (DETERMINISTIC SEEDER)

Database Seeder harus selalu menghasilkan data awal yang valid dan langsung mencerminkan kondisi lapangan Desa Kuajang:

1. **`DesaSeeder`**:
   - 1 Desa Kuajang (Kec. Binuang, Kab. Polewali Mandar).
2. **`DusunSeeder`**:
   - 5 Dusun: Sarampu 1, Sarampu 2, Lemo Baru, Lemo Tua, Pakkandoang.
3. **`KpspamsSeeder` & `KpspamsDusunSeeder`**:
   - Unit 1: KPSPAMS Lemo Baru $\rightarrow$ Wilayah: Dusun Lemo Baru.
   - Unit 2: KPSPAMS Lemo Tua $\rightarrow$ Wilayah: Dusun Lemo Tua.
   - Unit 3: KPSPAMS Sarampu 1 $\rightarrow$ Wilayah: Dusun Sarampu 1 & Dusun Pakkandoang.
   - Dusun Sarampu 2 **tidak dipetakan** ke unit KPSPAMS manapun.
4. **`RoleAndPermissionSeeder`**:
   - Memetakan 8 peran dan ~60 izin granular.
5. **`UserSeeder`**:
   - 1 Akun Super Admin.
   - 1 Akun Admin Desa Kuajang.
   - 1 Akun Kepala Desa (Pemerintah Desa).
   - Masing-masing 1 Akun Ketua, Admin, Bendahara, dan Petugas Lapangan untuk 3 KPSPAMS.
   - 5 Akun Sampel Pelanggan.
6. **`CustomerTypeAndTariffSeeder`**:
   - Kategori: Rumah Tangga, Niaga, Sosial, Instansi dengan tier tarif bertingkat awal.

---

## 5. DEFINITION OF DONE (DOD) UNTUK SETIAP PULL REQUEST

Sebelum kode digabungkan (*merged*) ke cabang `develop` atau `main`, developer wajib memastikan:
- [ ] Seluruh static analysis dan code linter lolos (`./vendor/bin/pint` untuk PHP dan `npm run lint` untuk Next.js).
- [ ] Seluruh Automated Test lolos (`php artisan test` atau `pest`).
- [ ] Pengujian isolasi multi-KPSPAMS (BOLA/IDOR) terverifikasi dengan unit test.
- [ ] Setiap endpoint yang memutasi data telah tercatat di `audit_logs`.
- [ ] Skema database backward-compatible dan tidak ada penghapusan kolom destruktif tanpa migrasi bertahap.
- [ ] Desain responsif telah diuji pada viewport Desktop ($1920 \times 1080$), Tablet ($768 \times 1024$), dan Mobile ($375 \times 667$).
