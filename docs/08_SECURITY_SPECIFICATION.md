# SI-KPSPAMS KUAJANG - SECURITY ARCHITECTURE SPECIFICATION
**Spesifikasi Keamanan Siber, Isolasi Data Multi-Tenant, & Mitigasi Ancaman OWASP**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. PEMODELAN ANCAMAN (STRIDE THREAT MODELING)

| Kategori Ancaman | Skenario Risiko di SI-KPSPAMS Kuajang | Strategi Mitigasi Teknis |
|---|---|---|
| **Spoofing (Pemalsuan Identitas)** | Pihak luar mengaku sebagai petugas lapangan untuk menginput angka meter palsu atau warga mengakses tagihan orang lain. | Otentikasi terenkripsi Laravel Sanctum, pembatasan sesi, hashing password Bcrypt (Cost 12), dan validasi NIK/No KK untuk registrasi akun pelanggan. |
| **Tampering (Manipulasi Data)** | Staf mengubah histori tagihan lama atau mengubah angka meter yang sudah terbit invoice untuk memanipulasi keuangan kas. | Snapshot nilai tarif pada `invoice_items` bersifat *immutable*, validasi anomali meter bertingkat, dan larangan mutasi langsung pada invoice terbayar. |
| **Repudiation (Penyangkalan Aksi)** | Bendahara membantah telah membatalkan (*void*) transaksi kasir atau petugas membantah telah mengubah data sambungan. | Sistem **Audit Log Append-Only**: setiap aksi insert, update, soft delete, void, dan reversal mencatat `old_values`, `new_values`, IP, dan user-agent secara otomatis via Model Observer. |
| **Information Disclosure (Kebocoran Data)** | Staf KPSPAMS Lemo Baru dapat mengintip daftar pelanggan, nomor telepon, atau data keuangan KPSPAMS Lemo Tua atau Sarampu 1. | Penerapan **Scoped Multi-Tenancy**: Eloquent Global Scope `KpspamsScope` dan pemeriksaan Policy lapis tiga di setiap endpoint resource. |
| **Denial of Service (DoS)** | Script bot membanjiri endpoint login atau endpoint sinkronisasi batch meter reading hingga server desa down. | Rate Limiting bertingkat via Nginx dan middleware Laravel Throttle (Login: 5x/menit, General: 120x/menit). |
| **Elevation of Privilege (Eskalasi Hak Akses)** | Petugas lapangan memanipulasi token atau payload untuk memanggil endpoint persetujuan penghapusan utang atau void pembayaran. | Penegakan otorisasi granular berbasis RBAC (Role-Based Access Control) dan Policy Gate di backend Laravel, bukan sekadar validasi menu di frontend. |

---

## 2. PENANGGULANGAN BOLA / IDOR (BROKEN OBJECT LEVEL AUTHORIZATION)

Kerentanan BOLA/IDOR adalah risiko keamanan paling fatal pada sistem multi-unit. Tanpa otorisasi ketat, staf KPSPAMS Lemo Baru dapat mengubah ID pada URL untuk memanipulasi invoice milik KPSPAMS Lemo Tua.

### Skenario Serangan:
`POST /api/v1/payments/1042/void`  
*(Di mana Payment ID 1042 adalah transaksi milik KPSPAMS Lemo Tua, namun dikirim oleh Bendahara KPSPAMS Lemo Baru).*

### Mekanisme Pertahanan 3 Lapis:
1. **Lapis 1: Global Query Scoping**:
   Ketika Controller mengeksekusi `Payment::findOrFail(1042)`, Global Scope otomatis menginjeksi filter tenant:
   ```sql
   SELECT * FROM payments WHERE id = 1042 AND kpspams_id = 1; -- (KPSPAMS Lemo Baru)
   ```
   Kueri ini langsung menghasilkan `404 Not Found` karena Payment 1042 memiliki `kpspams_id = 2` (Lemo Tua).
2. **Lapis 2: Route Model Binding & Policy Authorization**:
   Sekalipun kueri dipanggil oleh akun dengan hak akses luas (misal Admin Desa), Policy tetap mengevaluasi hak akses aksi:
   ```php
   public function void(User $user, Payment $payment): bool
   {
       // Admin Desa sekalipun tidak boleh sembarangan me-void transaksi kasir internal KPSPAMS
       // kecuali melalui pengajuan reversal resmi
       return $user->can('payment:void_today') && $user->kpspams_id === $payment->kpspams_id;
   }
   ```
3. **Lapis 3: Customer Ownership Scope**:
   Pelanggan yang mengakses `/api/v1/invoices/{id}` diverifikasi secara ketat:
   ```php
   if ($user->hasRole('pelanggan') && $invoice->customer_id !== $user->customer_id) {
       abort(403, 'Akses Ditolak: Tagihan ini bukan milik akun Anda.');
   }
   ```

---

## 3. KEAMANAN UNGGAH BERKAS (FILE UPLOAD SECURITY)

Sistem menerima berkas gambar krusial: foto angka fisik meter air, foto bukti kebocoran pipa, dan nota kuitansi belanja kas.

### Protokol Validasi & Penyimpanan Berkas:
1. **Inspeksi Magic Bytes (Bukan Sekadar Ekstensi Berkas)**:
   Backend memeriksa tipe MIME sebenarnya menggunakan ekstensi `fileinfo` PHP untuk mencegah pengunggahan file PHP/Shell yang disamarkan menjadi `.jpg`:
   ```php
   $request->validate([
       'meter_photo' => [
           'required',
           'file',
           'mimetypes:image/jpeg,image/png',
           'max:5120', // Batas maksimum 5 Megabytes
       ],
   ]);
   ```
2. **Pengacakan Nama Berkas (UUID Generation)**:
   Berkas tidak pernah disimpan dengan nama asli yang diberikan klien. Sistem menghasilkan UUID acak:
   `storage/app/private/meters/2026/10/a8f1b2c4-9d3e-4f1a-b62e-5f91e847c012.jpg`
3. **Isolasi di Luar Webroot Publik**:
   Seluruh foto meter dan bukti pengaduan diletakkan pada direktori `storage/app/private/` yang **TIDAK DAPAT** diakses langsung melalui URL publik Nginx (`/storage/meters/...` dimatikan).
4. **Streaming Controller Terotorisasi**:
   Akses berkas dilayani melalui endpoint aman:
   `GET /api/v1/media/stream?file=meters/2026/10/uuid.jpg`
   Controller memvalidasi token Sanctum dan memeriksa apakah user berhak melihat entity terkait sebelum memanggil `Storage::disk('private')->response(...)`.

---

## 4. KEAMANAN TRANSAKSI KEUANGAN & AUDIT TRAIL IMMUTABLE

### 4.1 Anti-Fraud & Aturan Larangan Hard Delete
1. Data pada tabel `payments`, `invoices`, dan `financial_transactions` **TIDAK MEMILIKI AKSI DELETE**.
2. Setiap koreksi kasir dilakukan via:
   - **`VOID`**: Hanya untuk transaksi hari yang sama ($T+0$) sebelum tutup kas harian, otomatis mengembalikan status invoice menjadi `UNPAID` dan mencatat mutasi pengurang kas.
   - **`REVERSAL`**: Untuk transaksi yang sudah lewat hari atau antar-periode, wajib diverifikasi dan disetujui berjenjang oleh Ketua KPSPAMS.

### 4.2 Arsitektur Audit Log yang Kebal Manipulasi
1. Tabel `audit_logs` hanya memiliki operasi `INSERT` (Append-Only).
2. Dilarang menyediakan endpoint API untuk mengubah atau menghapus rekaman di tabel `audit_logs`.
3. Model Observer mencatat otomatis perubahan kolom sebelum dan sesudah:
```php
namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function updated(Model $model): void
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'kpspams_id' => auth()->user()?->kpspams_id ?? $model->kpspams_id ?? null,
            'action' => 'UPDATE',
            'entity' => class_basename($model),
            'entity_id' => $model->getKey(),
            'old_values' => json_encode($model->getOriginal()),
            'new_values' => json_encode($model->getChanges()),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
```

---

## 5. ATURAN RATE LIMITING & PERTAHANAN BRUTE FORCE

Konfigurasi rate limiting diterapkan pada level API Gateway (Nginx) dan Route Middleware (Laravel):

| Lingkup / Aksi | Batas Maksimum | Tindakan Saat Pelanggaran |
|---|---|---|
| **Login API** (`/api/v1/auth/login`) | 5 kali percobaan per menit per kombinasi IP & Username | Blokir sementara (HTTP 429 Too Many Requests) selama 5 menit; catat indikasi brute-force ke log keamanan. |
| **Input Angka Meter** (`/api/v1/meter-readings`) | 60 kali submit per menit per akun petugas lapangan | Mencegah loop otomatisasi bot/script flooding. |
| **Void Pembayaran** (`/api/v1/payments/*/void`) | 10 kali per jam per bendahara | Alert ke Ketua KPSPAMS jika terjadi frekuensi void tinggi yang tidak wajar. |
| **Endpoint Publik Umum** | 120 request per menit per alamat IP | Throttle standar pencegahan scraping data. |

---

## 6. PENGELOLAAN RAHASIA & VARIABEL LINGKUNGAN (ENVIRONMENT SECRETS)

1. **Zero Secret in Codebase**:
   - Dilarang keras melakukan commit berkas `.env`, kredensial database, JWT secret, atau API keys pihak ketiga ke repositori Git.
   - File `.gitignore` wajib mengecualikan `.env`, `.env.production`, file sertifikat TLS (`*.pem`, `*.crt`, `*.key`), dan direktori `storage/app/`.
2. **Kunci Enkripsi Aplikasi**:
   - `APP_KEY` digenerate menggunakan algoritma kriptografi kuat (`php artisan key:generate`) dengan panjang 256-bit (AES-256-CBC).
   - Seluruh token otentikasi Sanctum disimpan dalam bentuk hash SHA-256 pada database PostgreSQL.
