# SI-KPSPAMS KUAJANG - SYSTEM ARCHITECTURE DOCUMENT
**Arsitektur Perangkat Lunak, Multi-Tenancy Scoping, & Spesifikasi Teknologi**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. DESAIN ARSITEKTUR KESELURUHAN (HIGH-LEVEL ARCHITECTURE)

Sistem Informasi Pengelolaan KPSPAMS Desa Kuajang (**SI-KPSPAMS Kuajang**) menggunakan pendekatan **Decoupled Modern Architecture** (Frontend & Backend Terpisah). Seluruh interaksi data dan aturan bisnis dieksekusi secara terpusat oleh backend API Laravel, sedangkan Next.js menangani rendering antarmuka pengguna web responsif, dan Flutter disiapkan untuk aplikasi mobile masa depan.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT LAYER                                       |
|                                                                                   |
|   +----------------------------------+       +--------------------------------+   |
|   |         Web Application          |       |         Mobile App             |   |
|   |   Next.js (App Router, TS)       |       |       (Future Flutter)         |   |
|   |   Tailwind CSS, TanStack Query   |       |       Android & iOS            |   |
|   +-----------------+----------------+       +---------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | HTTPS (REST API / JSON)                | HTTPS (REST API / JSON)
                      | Bearer Token (Sanctum)                 | Bearer Token (Sanctum)
+---------------------v----------------------------------------v--------------------+
|                         GATEWAY & APPLICATION LAYER (DOCKER)                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                           Nginx Reverse Proxy                             |   |
|   |         TLS Termination, Rate Limiting, CORS, Static Cache / Security     |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         | FastCGI                                 |
|   +-------------------------------------v-------------------------------------+   |
|   |                       Laravel 11.x REST API Core                          |   |
|   |                                                                           |   |
|   |  [Auth: Sanctum] ──> [Tenant Context Scoping] ──> [Gate / Policy RBAC]   |   |
|   |                             |                                             |   |
|   |  [Form Request Validation] ─+─> [Action / Service Layer (Business Logic)] |   |
|   |                                            |                              |   |
|   |                       [Eloquent ORM + KpspamsScope]                       |   |
|   +----------------------+-----------------------------+----------------------+   |
+--------------------------|-----------------------------|--------------------------+
                           | PDO Connection              | Redis Protocol (TCP 6379)
+--------------------------v----+                   +----v--------------------------+
|       DATA PERSISTENCE        |                   |      QUEUE, CACHE & JOBS      |
|                               |                   |                               |
|   PostgreSQL 16 Engine        |                   |   Redis 7 Container           |
|   - Relational Core Data      |                   |   - Background Queue Worker   |
|   - Multi-tenant Foreign Keys |                   |   - Batch Billing Generator   |
|   - Partial & Unique Indexes  |                   |   - PDF Invoice & Kwitansi    |
|   - WAL Logging & Backups     |                   |   - Session & Cache           |
+-------------------------------+                   +-------------------------------+
```

---

## 2. PILIHAN TEKNOLOGI & RASIONALISASI

| Komponen | Pilihan Teknologi | Alasan Pemilihan & Nilai Teknis |
|---|---|---|
| **Frontend Framework** | **Next.js (React, TypeScript)** | Mendukung Server-Side Rendering (SSR) untuk performa muat awal tinggi, Client-Side Rendering (CSR) interaktif untuk dashboard dan portal pelanggan, serta ekosistem TypeScript yang menjamin type-safety dari API contracts. |
| **Styling & UI Engine** | **Tailwind CSS + Lucide Icons** | Utility-first CSS memungkinkan styling ringan, bebas dari tampilan template generik, kustomisasi penuh token warna identitas Desa Kuajang (Maroon, Gold, Hitam, Putih), dan responsivitas mobile-first. |
| **Backend API Engine** | **Laravel 11.x (PHP 8.3+)** | Framework enterprise matang dengan sistem ORM (Eloquent) kuat untuk relasi multi-tabel, ekosistem otentikasi siap pakai (Sanctum), middleware fleksibel untuk data isolation, dan integrasi queue bawaan. |
| **API Authentication** | **Laravel Sanctum** | Menyediakan token berbasis Bearer Token yang aman dan ringan untuk SPA (Single Page Application) Next.js dan klien Mobile Flutter tanpa overhead kompleksitas OAuth2 penuh. |
| **Database RDBMS** | **PostgreSQL 16** | Relational Database standar industri dengan integritas referensial tinggi, dukungan transactional DDL (aman untuk migrasi), index komposit yang efisien, dan stabilitas konkurensi (MVCC). |
| **Asynchronous Engine** | **Redis 7 (In-Memory Data Store)** | Menangani antrean tugas berat (*background jobs*) seperti generate tagihan bulanan ribuan pelanggan secara serentak, pembuatan file PDF invoice/kwitansi, dan pengiriman notifikasi tanpa memblokir thread HTTP. |
| **Infrastruktur & Kontainer** | **Docker & Docker Compose** | Menstandarkan lingkungan pengembangan dan produksi, mencegah inkonsistensi environment antar pengembang (*works on my machine*), dan mempermudah orkestrasi multi-service. |

---

## 3. MULTI-KPSPAMS DATA ISOLATION ARCHITECTURE

Kebutuhan isolasi data multi-KPSPAMS adalah parameter keamanan paling krusial dalam sistem ini. Data operasional KPSPAMS Lemo Baru, KPSPAMS Lemo Tua, dan KPSPAMS Sarampu 1 tidak boleh saling bocor atau dapat dimanipulasi lintas-organisasi.

### 3.1 Model Isolasi: Scoped Multi-Tenancy (Row-Level Tenancy)
Sistem menggunakan pendekatan **Shared Database, Shared Schema with Scoped Tenancy**. Setiap tabel yang memuat data operasional wajib menyertakan kolom referensi `kpspams_id`.

```
[Users Table]
  - id: 101
  - name: "Staf Lemo Baru"
  - kpspams_id: 1  (KPSPAMS Lemo Baru)
  - role: "admin_kpspams"

Request: GET /api/v1/invoices
          │
          ▼
[Tenant Context Middleware]
  - Ekstrak auth()->user()
  - Ambil auth()->user()->kpspams_id
          │
          ▼
[Laravel Global Scope: KpspamsScope]
  - Otomatis menginjeksi klausul WHERE:
    SELECT * FROM invoices WHERE kpspams_id = 1;
```

### 3.2 Implementasi Teknis di Backend Laravel
1. **Trait `BelongsToKpspams`**:
   Semua model Eloquent operasional (Pelanggan, Sambungan, Meter, Pembacaan, Tagihan, Pembayaran, Pengaduan, Work Order, Aset, Kas, Mutasi Keuangan) menggunakan trait ini.
   ```php
   namespace App\Models\Traits;

   use App\Models\Scopes\KpspamsScope;
   use App\Models\Kpspams;
   use Illuminate\Database\Eloquent\Relations\BelongsTo;

   trait BelongsToKpspams
   {
       protected static function bootBelongsToKpspams(): void
       {
           static::addGlobalScope(new KpspamsScope);

           static::creating(function ($model) {
               if (auth()->check() && !auth()->user()->isDesaLevel() && empty($model->kpspams_id)) {
                   $model->kpspams_id = auth()->user()->kpspams_id;
               }
           });
       }

       public function kpspams(): BelongsTo
       {
           return $this->belongsTo(Kpspams::class);
       }
   }
   ```

2. **Global Scope `KpspamsScope`**:
   ```php
   namespace App\Models\Scopes;

   use Illuminate\Database\Eloquent\Builder;
   use Illuminate\Database\Eloquent\Model;
   use Illuminate\Database\Eloquent\Scope;

   class KpspamsScope implements Scope
   {
       public function apply(Builder $builder, Model $model): void
       {
           if (!auth()->check()) {
               return;
           }

           $user = auth()->user();

           // Super Admin & Level Desa (Admin Desa, Pemerintah Desa) bebas memantau seluruh KPSPAMS
           if ($user->isDesaLevel() || $user->isSuperAdmin()) {
               // Jika request menyertakan filter spesifik kpspams_id, terapkan filter tersebut
               if (request()->filled('kpspams_id')) {
                   $builder->where($model->getTable() . '.kpspams_id', request()->query('kpspams_id'));
               }
               return;
           }

           // Pengguna level KPSPAMS terkunci hanya pada kpspams_id miliknya
           if ($user->kpspams_id) {
               $builder->where($model->getTable() . '.kpspams_id', $user->kpspams_id);
           }
       }
   }
   ```

3. **Logika Khusus KPSPAMS Sarampu 1**:
   - Dusun Sarampu 1 dan Dusun Pakkandoang terhubung melalui tabel pivot `kpspams_dusun` ke record `kpspams_id` KPSPAMS Sarampu 1.
   - Sambungan rumah di Dusun Pakkandoang memiliki `dusun_id = Pakkandoang` dan `kpspams_id = KPSPAMS Sarampu 1`.
   - Dengan struktur ini, staf KPSPAMS Sarampu 1 otomatis memiliki akses resmi ke pelanggan di kedua dusun tersebut tanpa melanggar prinsip isolasi data.

---

## 4. STRUKTUR LAYER & ARSITEKTUR KODE BACKEND (LARAVEL)

Backend mengadopsi arsitektur **Clean Architecture / Service-Action Pattern** untuk memisahkan business logic dari controller:

```
app/
├── Http/
│   ├── Controllers/Api/V1/    <-- Hanya menangani HTTP Request, Response, Status Code
│   │   ├── BillingController.php
│   │   ├── MeterReadingController.php
│   │   └── PaymentController.php
│   ├── Requests/              <-- Form Request Validation & Authorization Rules
│   │   ├── StoreMeterReadingRequest.php
│   │   └── ProcessPaymentRequest.php
│   ├── Resources/V1/          <-- API Data Transformers (mencegah leak data internal)
│   │   ├── InvoiceResource.php
│   │   └── CustomerResource.php
│   └── Middleware/            <-- Tenant Context, Role Enforcement, Force JSON
│       ├── EnforceKpspamsScope.php
│       └── AuditContextMiddleware.php
├── Services/                  <-- Pure Business Logic & Domain Algorithms
│   ├── BillingEngineService.php     (Perhitungan kubikasi & tarif bertingkat)
│   ├── MeterAnomalyService.php      (Validasi rollback & lonjakan konsumsi)
│   ├── PaymentProcessingService.php (Pencatatan kas, void, dan reversal)
│   └── StockMovementService.php     (Pengurangan stok saat WO selesai)
├── Models/                    <-- Eloquent Models, Scopes, Casts, Observers
│   ├── Invoice.php
│   ├── MeterReading.php
│   └── Payment.php
├── Policies/                  <-- Otorisasi Granular & Pengecekan IDOR
│   ├── InvoicePolicy.php
│   └── PaymentPolicy.php
└── Jobs/                      <-- Background Jobs antrean Redis
    ├── GenerateMonthlyInvoicesJob.php
    ├── GenerateKwitansiPdfJob.php
    └── SendBillNotificationJob.php
```

---

## 5. ARSITEKTUR FRONTEND (NEXT.JS APP ROUTER)

Aplikasi frontend dibangun dengan Next.js memanfaatkan struktur App Router modular:

```
src/
├── app/
│   ├── (auth)/                <-- Layout Otentikasi Bersih (Login, Forgot Password)
│   │   └── login/
│   ├── (dashboard)/           <-- Layout Admin Desa & KPSPAMS (Sidebar, Header, Context Switcher)
│   │   ├── dashboard/
│   │   ├── master/            <-- Dusun, KPSPAMS, Tarif, User, Role
│   │   ├── pelanggan/         <-- Customer, Sambungan, Meter
│   │   ├── operasional/       <-- Catat Meter, Pengaduan, Work Order, Pemeliharaan
│   │   ├── billing/           <-- Periode, Invoice, Pembayaran, Kwitansi
│   │   ├── aset-inventaris/   <-- Register Aset, Stok Material
│   │   ├── keuangan/          <-- Transaksi Kas, Mutasi, Buku Kas
│   │   └── laporan/           <-- Export Laporan Multi-dimensi
│   ├── (field)/               <-- Layout Petugas Lapangan (Mobile-first, Quick Action Bar)
│   │   └── catat-meter/
│   ├── (portal)/              <-- Portal Warga/Pelanggan Mandiri
│   │   └── my-account/
│   └── api/                   <-- Next.js Internal BFF Proxy (opsional)
├── components/
│   ├── ui/                    <-- Primitive components (Button, Modal, Input, Badge)
│   ├── forms/                 <-- Formik/React Hook Form + Zod Validations
│   ├── tables/                <-- Reusable Data Table (Sort, Filter, Pagination)
│   └── charts/                <-- Dashboard Visualization (Recharts)
├── hooks/                     <-- Custom hooks (useAuth, useTenant, usePermissions)
├── lib/
│   ├── api-client.ts          <-- Axios/Fetch client dengan interceptor Bearer Token
│   └── formatters.ts          <-- Format mata uang Rupiah, kubikasi m3, tanggal ID
└── types/                     <-- TypeScript Type Definitions sinkron dengan API Response
```

---

## 6. PENYIMPANAN BERKAS & KEAMANAN ASET DIGITAL (STORAGE ARCHITECTURE)

Sistem mengelola berkas media sensitif:
- Foto fisik dial meter air (pembuktian penagihan).
- Foto bukti kerusakan pengaduan & foto sebelum/sesudah pengerjaan Work Order.
- Foto kuitansi manual/nota belanja operasional keuangan.
- Dokumen PDF tagihan dan kwitansi resmi.

### Mekanisme Keamanan Berkas:
1. **Pemisahan Storage**:
   - `public/`: Hanya lambang desa, logo KPSPAMS, dan aset branding statis.
   - `private/` (Terisolasi): Seluruh foto meter, pengaduan, kuitansi, dan nota belanja disimpan di direktori privat non-publik (storage disk lokal terisolasi di luar root web publik atau bucket S3/MinIO terenkripsi).
2. **Akses Berkas Melalui Authenticated Streaming Controller**:
   Akses ke file privat dilindungi endpoint otorisasi:
   `GET /api/v1/media/secure-stream?path={encrypted_path}`
   Controller memvalidasi token Sanctum dan hak akses pengguna terhadap entity pemilik foto sebelum mengalirkan (*streaming*) konten biner gambar.

---

## 7. KESIAPAN APLIKASI MOBILE (FLUTTER FUTURE ARCHITECTURE)

Struktur REST API dirancang sepenuhnya siap dikonsumsi langsung oleh aplikasi mobile Flutter di masa mendatang:
1. **Format Respons Standar**: Semua endpoint API menghasilkan JSON yang seragam (`status`, `message`, `data`, `meta`, `errors`).
2. **Kesiapan Offline Sync untuk Pembacaan Meter**:
   - Mobile client Flutter dapat mengunduh daftar rute baca meter untuk periode aktif (`GET /api/v1/meter-readings/route-batch`).
   - Petugas dapat mencatat angka meter dan mengambil foto secara luring (offline) tersimpan di local database SQLite mobile.
   - Ketika koneksi internet tersedia di kantor KPSPAMS, aplikasi mengirimkan payload batch (`POST /api/v1/meter-readings/sync-batch`) untuk validasi server.
3. **Versi API Terpelihara**: Penggunaan prefix URL `/api/v1/` menjamin ketersediaan kompatibilitas mundur saat aplikasi web dan mobile berjalan paralel.
