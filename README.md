# SI-KPSPAMS KUAJANG
**Sistem Informasi Pengelolaan KPSPAMS Desa Kuajang**  
*Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. TENTANG APLIKASI

SI-KPSPAMS KUAJANG adalah sistem enterprise terpadu untuk pengelolaan penyediaan air minum perdesaan berbasis masyarakat di Desa Kuajang. Sistem ini mengintegrasikan operasional pencatatan meter air, billing engine tarif bertingkat, kasir & mutasi kas, manajemen aset jaringan/pompa, inventaris material, alur kerja pengaduan ke Work Order, serta portal mandiri pelanggan.

### Entitas KPSPAMS & Wilayah Layanan:
- **KPSPAMS Lemo Baru**: Melayani Dusun Lemo Baru.
- **KPSPAMS Lemo Tua**: Melayani Dusun Lemo Tua.
- **KPSPAMS Sarampu 1**: Melayani Dusun Sarampu 1 & Dusun Pakkandoang (*Pakkandoang bukan KPSPAMS tersendiri*).
- **Dusun Sarampu 2**: Tercatat di master dusun (dalam persiapan pembentukan unit).

---

## 2. ARSITEKTUR TEKNOLOGI & VERSI STABIL

- **Frontend**: Next.js 14.2 (App Router), React 18.3, TypeScript 5.4, Tailwind CSS 3.4, TanStack Query v5.
- **Backend API**: Laravel 11.x (Clean Architecture / Service-Action Pattern), Laravel Sanctum 4.x.
- **Runtime**: PHP 8.3-FPM (Alpine), Node.js 20 LTS (Alpine).
- **Database**: PostgreSQL 16 (Alpine).
- **Cache & Queue**: Redis 7 (Alpine).
- **Reverse Proxy**: Nginx 1.25 (Alpine).
- **Orchestration**: Docker & Docker Compose.

---

## 3. STRUKTUR DIREKTORI PROYEK

```
sistem_kpspams/
├── docs/                        <-- Source of Truth (10 Dokumen Spesifikasi Resmi)
│   ├── 01_PRD.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_ERD.md
│   ├── 04_API_SPECIFICATION.md
│   ├── 05_PERMISSION_MATRIX.md
│   ├── 06_UI_UX_SPECIFICATION.md
│   ├── 07_DEVELOPMENT_PROTOCOL.md
│   ├── 08_SECURITY_SPECIFICATION.md
│   ├── 09_TESTING_PLAN.md
│   └── 10_DEPLOYMENT.md
├── docker/                      <-- Konfigurasi Nginx & PHP
├── backend/                     <-- REST API Core (Laravel 11)
│   ├── app/
│   │   ├── Http/
│   │   ├── Models/              <-- Eloquent Models (BelongsToKpspams, KpspamsScope)
│   │   └── Services/            <-- Pure Business Logic (Billing, Anomaly, Payment, Notification)
│   ├── database/
│   │   ├── migrations/          <-- 10 File Migrasi (32 Tabel + Kebijakan Billing)
│   │   └── seeders/             <-- Seeder Deterministik Lengkap Desa Kuajang
│   └── routes/api.php           <-- V1 Endpoints
├── frontend/                    <-- Web Application (Next.js 14 App Router)
├── docker-compose.yml           <-- Development Environment
├── docker-compose.prod.yml      <-- Production Environment
└── README.md
```

---

## 4. CARA MENJALANKAN (DEVELOPMENT MODE VIA DOCKER)

1. **Jalankan Seluruh Container**:
   ```bash
   docker compose up -d
   ```
2. **Setup Kunci Enkripsi & Migrasi Basis Data**:
   ```bash
   docker compose exec backend composer install
   docker compose exec backend php artisan key:generate
   docker compose exec backend php artisan migrate --seed
   ```
3. **Akses Layanan**:
   - **Frontend Web**: [http://localhost](http://localhost) (atau [http://localhost:3000](http://localhost:3000))
   - **Backend API**: [http://localhost/api/v1/health](http://localhost/api/v1/health)
   - **PostgreSQL**: `localhost:5432` (`sikpspams_db`)
   - **Redis**: `localhost:6379`

---

## 5. AKUN PENGGUNA AWAL (HASIL SEEDER)

Semua akun awal menggunakan kata sandi: `Kuajang2026!`

| Peran | Username | Scope Akses |
|---|---|---|
| **Super Admin** | `superadmin` | Sistem Global |
| **Admin Desa Kuajang** | `admin.desa` | Seluruh Desa & 3 KPSPAMS |
| **Kepala Desa (Pemdes)** | `kades.kuajang` | Monitoring Agregat Eksekutif |
| **Ketua LMB** | `ketua.lemobaru` | KPSPAMS Lemo Baru |
| **Admin LMB** | `admin.lemobaru` | KPSPAMS Lemo Baru |
| **Bendahara LMB** | `bendahara.lemobaru` | KPSPAMS Lemo Baru |
| **Petugas Lapangan LMB** | `petugas.lemobaru` | KPSPAMS Lemo Baru |
| **Ketua LMT** | `ketua.lemotua` | KPSPAMS Lemo Tua |
| **Ketua SR1** | `ketua.sarampu1` | KPSPAMS Sarampu 1 & Pakkandoang |
| **Pelanggan LMB** | `warga.yusuf` | Portal Mandiri Warga |
| **Pelanggan PKD** | `warga.rustam` | Portal Mandiri Warga |
