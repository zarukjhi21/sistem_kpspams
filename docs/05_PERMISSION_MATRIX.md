# SI-KPSPAMS KUAJANG - ROLE & PERMISSION MATRIX (RBAC)
**Spesifikasi Hak Akses Granular & Kontrol Otorisasi Berjenjang**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. STRUKTUR ROLE & TINGKATAN DATA SCOPE

Sistem menerapkan model **Role-Based Access Control (RBAC)** dengan penegakan **Data Isolation Boundary**:

| Role Code | Role Name | Deskripsi Singkat | Scope Level | Tenant Constraint |
|---|---|---|---|---|
| `super_admin` | Super Admin | Tim DevOps / Developer teknis | `GLOBAL` | Tidak ada batasan (akses audit & konfigurasi global). |
| `admin_desa` | Admin Desa | Operator TI Kantor Desa Kuajang | `DESA` | Memantau & mengelola seluruh 3 KPSPAMS & 5 dusun. |
| `pemerintah_desa`| Pemerintah Desa | Kepala Desa, BPD, Perangkat Desa | `DESA (READ-ONLY)` | Akses agregat eksekutif & monitoring laporan desa. |
| `ketua_kpspams` | Ketua KPSPAMS | Pimpinan unit KPSPAMS lokal | `KPSPAMS` | Terkunci hanya pada unit KPSPAMS miliknya. Approval SPK, anggaran, dan pembalikan pembayaran. |
| `admin_kpspams` | Admin KPSPAMS | Staf tata usaha operasional | `KPSPAMS` | Terkunci pada unit KPSPAMS miliknya. Kelola pelanggan, sambungan, verifikasi meter, & pengaduan. |
| `bendahara_kpspams`| Bendahara KPSPAMS | Pengelola kas & kasir unit | `KPSPAMS` | Terkunci pada unit KPSPAMS miliknya. Penerimaan bayar, void kasir, buku kas, & pengeluaran. |
| `petugas_lapangan`| Petugas Lapangan | Pembaca meter & teknisi jaringan| `KPSPAMS` | Terkunci pada unit KPSPAMS miliknya. Input angka meter via mobile & eksekusi Work Order. |
| `pelanggan` | Pelanggan / Warga | Warga pengguna air bersih | `OWN_CUSTOMER` | Terkunci ketat hanya pada data pelanggan & sambungan miliknya sendiri. |

---

## 2. MATRIKS PERMISSION GRANULAR LENGKAP

*Keterangan simbol:*
- **Y (Yes)**: Memiliki hak akses penuh.
- **Own**: Hanya dapat mengakses record milik sendiri.
- **R (Read)**: Hanya hak melihat/membaca (read-only).
- **- (No)**: Tidak memiliki akses sama sekali.

| Kategori Permission | Nama Permission | Super Admin | Admin Desa | Pemdes | Ketua KPSP | Admin KPSP | Bendahara | Petugas Lap. | Pelanggan |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Master Kelembagaan** | `desa:read` | Y | Y | R | R | R | R | R | - |
| | `desa:update` | Y | Y | - | - | - | - | - | - |
| | `dusun:manage` | Y | Y | R | - | - | - | - | - |
| | `kpspams:manage` | Y | Y | R | - | - | - | - | - |
| | `wilayah:assign` | Y | Y | - | - | - | - | - | - |
| **Manajemen Pengguna** | `user:read` | Y | Y | R | R | - | - | - | - |
| | `user:create_staff` | Y | Y | - | Y | - | - | - | - |
| | `user:update_staff` | Y | Y | - | Y | - | - | - | - |
| | `user:delete_staff` | Y | Y | - | Y | - | - | - | - |
| **Pelanggan & Sambungan**| `customer:read` | Y | Y | R | Y | Y | Y | Y | Own |
| | `customer:create` | Y | Y | - | Y | Y | - | - | - |
| | `customer:update` | Y | Y | - | Y | Y | - | - | Own (profil) |
| | `customer:delete` | Y | Y | - | - | - | - | - | - |
| | `connection:read` | Y | Y | R | Y | Y | Y | Y | Own |
| | `connection:create` | Y | Y | - | Y | Y | - | - | - |
| | `connection:change_status`| Y | - | - | Y | Y | - | - | - |
| **Meter & Pencatatan** | `meter:read` | Y | Y | R | Y | Y | - | Y | Own |
| | `meter:manage` | Y | Y | - | Y | Y | - | Y | - |
| | `meter_reading:read`| Y | Y | R | Y | Y | Y | Y | Own |
| | `meter_reading:input`| Y | - | - | - | Y | - | Y | - |
| | `meter_reading:verify`| Y | - | - | Y | Y | - | - | - |
| | `meter_reading:resolve_anomaly`| Y | - | - | Y | Y | - | - | - |
| **Tarif & Periode Tagih**| `tariff:read` | Y | Y | R | Y | Y | Y | - | R |
| | `tariff:create` | Y | Y | - | Y | - | - | - | - |
| | `billing_period:open`| Y | - | - | Y | Y | - | - | - |
| | `billing_period:close`| Y | - | - | Y | - | - | - | - |
| **Billing & Invoice** | `invoice:generate` | Y | - | - | Y | Y | - | - | - |
| | `invoice:read` | Y | Y | R | Y | Y | Y | R | Own |
| | `invoice:pdf_download`| Y | Y | R | Y | Y | Y | R | Own |
| | `invoice:void` | Y | - | - | Y | - | - | - | - |
| **Pembayaran & Kasir** | `payment:create` | Y | - | - | - | - | Y | - | - |
| | `payment:read` | Y | Y | R | Y | Y | Y | - | Own |
| | `payment:receipt_pdf`| Y | Y | R | Y | Y | Y | - | Own |
| | `payment:void_today` | Y | - | - | - | - | Y (T+0) | - | - |
| | `payment:request_reversal`| Y | - | - | - | - | Y | - | - |
| | `payment:approve_reversal`| Y | - | - | Y | - | - | - | - |
| **Pengaduan & Tiket** | `complaint:create` | Y | - | - | - | Y | - | - | Own |
| | `complaint:read` | Y | Y | R | Y | Y | Y | Y | Own |
| | `complaint:verify` | Y | - | - | Y | Y | - | - | - |
| | `complaint:reject` | Y | - | - | Y | Y | - | - | - |
| **Work Order (SPK)** | `work_order:create` | Y | - | - | Y | Y | - | - | - |
| | `work_order:read` | Y | Y | R | Y | Y | - | Y | - |
| | `work_order:execute`| Y | - | - | - | - | - | Y | - |
| | `work_order:complete`| Y | - | - | - | - | - | Y | - |
| | `work_order:approve` | Y | - | - | Y | Y | - | - | - |
| **Aset & Pemeliharaan** | `asset:read` | Y | Y | R | Y | Y | - | R | - |
| | `asset:manage` | Y | - | - | Y | Y | - | - | - |
| | `maintenance:log` | Y | - | - | Y | Y | - | Y | - |
| **Inventaris Material** | `inventory:read` | Y | Y | R | Y | Y | - | Y | - |
| | `inventory:manage` | Y | - | - | Y | Y | - | - | - |
| | `inventory:adjust` | Y | - | - | Y | - | - | - | - |
| **Keuangan & Kas** | `cash_account:manage`| Y | - | - | Y | - | Y | - | - |
| | `finance:read` | Y | Y | R | Y | - | Y | - | - |
| | `finance:create_expense`| Y | - | - | - | - | Y | - | - |
| | `finance:approve_expense`| Y | - | - | Y | - | - | - | - |
| | `finance:transfer_cash`| Y | - | - | - | - | Y | - | - |
| **Dashboard & Laporan** | `dashboard:desa_view`| Y | Y | Y | - | - | - | - | - |
| | `dashboard:kpspams_view`| Y | Y | R | Y | Y | Y | Y | - |
| | `dashboard:customer_view`| - | - | - | - | - | - | - | Own |
| | `report:view_all` | Y | Y | Y | - | - | - | - | - |
| | `report:view_kpspams`| Y | Y | R | Y | Y | Y | - | - |
| | `report:export` | Y | Y | R | Y | Y | Y | - | - |
| **Audit & Keamanan** | `audit_log:view` | Y | Y | R | Y | - | - | - | - |
| | `system:settings` | Y | - | - | - | - | - | - | - |

---

## 3. PENEGAKAN OTORISASI DI BACKEND LARAVEL

Otorisasi ditegakkan pada 3 lapis pertahanan (*Defense-in-Depth*):

### 3.1 Lapis 1: Route Middleware (Role & Permission Check)
Memastikan pengguna memiliki izin dasar sebelum mencapai Controller:
```php
Route::middleware(['auth:sanctum', 'permission:payment:create'])->group(function () {
    Route::post('/payments', [PaymentController::class, 'store']);
});
```

### 3.2 Lapis 2: Form Request Authorization
Memvalidasi hak aksi dan parameter context:
```php
public function authorize(): bool
{
    $invoice = Invoice::findOrFail($this->input('invoice_id'));
    // Pengguna KPSPAMS hanya boleh menerima pembayaran invoice KPSPAMS miliknya
    return $this->user()->can('payment:create') && 
           ($this->user()->isDesaLevel() || $this->user()->kpspams_id === $invoice->kpspams_id);
}
```

### 3.3 Lapis 3: Eloquent Policy (BOLA/IDOR Defense)
Mencegah manipulasi resource lewat manipulasi ID pada parameter rute URL:
```php
namespace App\Policies;

use App\Models\User;
use App\Models\Invoice;

class InvoicePolicy
{
    public function view(User $user, Invoice $invoice): bool
    {
        if ($user->isSuperAdmin() || $user->isDesaLevel()) {
            return true;
        }

        if ($user->hasRole('pelanggan')) {
            return $user->customer_id === $invoice->customer_id;
        }

        return $user->kpspams_id === $invoice->kpspams_id;
    }

    public function void(User $user, Invoice $invoice): bool
    {
        return $user->can('invoice:void') && 
               ($user->isDesaLevel() || $user->kpspams_id === $invoice->kpspams_id);
    }
}
```
