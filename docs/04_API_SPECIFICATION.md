# SI-KPSPAMS KUAJANG - RESTFUL API SPECIFICATION
**Spesifikasi Antarmuka API, Format JSON Standar, & Katalog Endpoint V1**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. STANDAR & KONVENSI API

### 1.1 Format Respons Standar (Standard JSON Envelope)
Seluruh endpoint pada SI-KPSPAMS Kuajang mengembalikan payload seragam dalam format JSON:

#### Respons Sukses (200 OK, 201 Created):
```json
{
  "status": "success",
  "message": "Data pembacaan meter berhasil disimpan dan diverifikasi",
  "data": {
    "id": 128,
    "connection_no": "SR-LMB-00123",
    "customer_name": "Muhammad Yusuf",
    "current_reading": 145.50,
    "usage_m3": 12.00,
    "status": "VERIFIED"
  },
  "meta": {
    "timestamp": "2026-10-01T15:30:00Z",
    "api_version": "v1"
  }
}
```

#### Respons Paginasi (200 OK Paginated):
```json
{
  "status": "success",
  "message": "Daftar tagihan berhasil diambil",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 15,
    "per_page": 20,
    "to": 20,
    "total": 300,
    "timestamp": "2026-10-01T15:30:00Z"
  }
}
```

#### Respons Validasi Gagal (422 Unprocessable Content):
```json
{
  "status": "fail",
  "message": "Validasi input gagal. Silakan periksa kolom yang ditandai.",
  "errors": {
    "current_reading": [
      "Angka stand akhir (110) lebih kecil dari stand sebelumnya (135). Anomali rollback terdeteksi."
    ],
    "meter_photo": [
      "Foto bukti angka meter wajib diunggah."
    ]
  }
}
```

#### Respons Error Keamanan / Hak Akses (401 / 403 Forbidden):
```json
{
  "status": "error",
  "message": "Akses Ditolak: Anda tidak memiliki otoritas untuk mengakses data KPSPAMS lain (BOLA/IDOR Violation).",
  "error_code": "TENANT_SCOPE_VIOLATION"
}
```

---

## 2. OTENTIKASI & KONTROL MULTI-TENANCY

1. **Header Standar**:
   - `Authorization: Bearer <sanctum_plain_text_token>`
   - `Accept: application/json`
   - `Content-Type: application/json` (atau `multipart/form-data` untuk upload foto)
2. **Context Switcher Header (Khusus Admin Desa / Super Admin)**:
   - `X-KPSPAMS-Context: 1`
   - Header ini hanya dievaluasi jika user memiliki role `admin_desa`, `pemerintah_desa`, atau `super_admin`. Untuk user level unit KPSPAMS, header ini **diabaikan dan ditimpa secara paksa** oleh nilai `kpspams_id` user yang tersimpan di database.

---

## 3. KATALOG ENDPOINT MODULAR

### 3.1 Modul Otentikasi & Profil Pengguna (`/api/v1/auth`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Login via username/nomor HP + password. Mengembalikan Bearer Token Sanctum & user info. | Publik |
| `POST` | `/api/v1/auth/logout` | Mencabut token aktif saat ini. | Authenticated |
| `GET` | `/api/v1/auth/me` | Mengambil profil user aktif, role, permissions, dan context KPSPAMS. | Authenticated |
| `PUT` | `/api/v1/auth/change-password` | Mengganti password sendiri (wajib memasukkan password lama). | Authenticated |

### 3.2 Modul Master Wilayah & Kelembagaan (`/api/v1/master`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/desa` | Profil Desa Kuajang & informasi umum. | Authenticated |
| `PUT` | `/api/v1/desa` | Mengupdate profil desa (nama kades, kontak, logo). | Admin Desa |
| `GET` | `/api/v1/dusun` | Daftar 5 dusun di Desa Kuajang beserta status KPSPAMS-nya. | Authenticated |
| `POST` | `/api/v1/dusun` | Menambah master dusun baru. | Admin Desa |
| `GET` | `/api/v1/kpspams` | Daftar 3 KPSPAMS (Lemo Baru, Lemo Tua, Sarampu 1) & dusun layanannya. | Authenticated |
| `GET` | `/api/v1/kpspams/{id}` | Detail KPSPAMS tertentu. | Authenticated |
| `PUT` | `/api/v1/kpspams/{id}` | Update data KPSPAMS (SK, pengurus, rekening). | Admin Desa, Ketua KPSPAMS (own) |
| `POST` | `/api/v1/kpspams/{id}/assign-dusun` | Memetakan dusun ke KPSPAMS (misal: menyambungkan Pakkandoang ke Sarampu 1). | Admin Desa |

### 3.3 Modul Pelanggan, Sambungan, & Meter (`/api/v1/customers`, `/connections`, `/meters`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/customers` | List pelanggan dengan filter (kpspams, dusun, status, search NIK/Nama). | Petugas Lapangan, Admin KPSPAMS |
| `POST` | `/api/v1/customers` | Registrasi pelanggan baru. | Admin KPSPAMS |
| `GET` | `/api/v1/customers/{id}` | Detail profil pelanggan beserta daftar sambungannya. | Admin KPSPAMS, Pelanggan (own) |
| `PUT` | `/api/v1/customers/{id}` | Update identitas pelanggan. | Admin KPSPAMS |
| `GET` | `/api/v1/connections` | List sambungan rumah (filter dusun, status segel/aktif). | Admin KPSPAMS, Petugas Lapangan |
| `POST` | `/api/v1/connections` | Pemasangan sambungan baru + pairing meter fisik awal. | Admin KPSPAMS |
| `PATCH` | `/api/v1/connections/{id}/status` | Mengubah status sambungan (Segel, Putus, Aktif Kembali). | Admin KPSPAMS, Ketua KPSPAMS |
| `GET` | `/api/v1/meters` | Register master meter air fisik. | Admin KPSPAMS, Petugas Lapangan |
| `POST` | `/api/v1/meters/{id}/replace` | Proses pergantian meter rusak dengan unit meter baru. | Admin KPSPAMS, Petugas Lapangan |

### 3.4 Modul Pembacaan Meter (`/api/v1/meter-readings`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/meter-readings` | Daftar histori pembacaan meter per periode/sambungan. | Petugas Lapangan, Admin KPSPAMS |
| `GET` | `/api/v1/meter-readings/route-batch` | Mengambil daftar urutan sambungan untuk rute pencatatan lapangan (support offline sync). | Petugas Lapangan |
| `POST` | `/api/v1/meter-readings` | Input angka stand meter + upload foto meter + koordinat GPS. | Petugas Lapangan, Admin KPSPAMS |
| `POST` | `/api/v1/meter-readings/sync-batch` | Sinkronisasi batch hasil catat meter offline dari perangkat lapangan. | Petugas Lapangan |
| `PATCH` | `/api/v1/meter-readings/{id}/verify` | Verifikasi pembacaan meter normal / approval anomali yang valid. | Admin KPSPAMS |
| `PATCH` | `/api/v1/meter-readings/{id}/resolve-anomaly` | Input resolusi anomali rollback (misal meter ganti/meter mundur). | Admin KPSPAMS |

### 3.5 Modul Tarif & Periode Tagihan (`/api/v1/tariffs`, `/billing-periods`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/tariffs` | Daftar skema tarif aktif & histori per kategori pelanggan. | Authenticated |
| `POST` | `/api/v1/tariffs` | Pembuatan skema tarif baru (versi baru dengan `effective_from`). | Ketua KPSPAMS, Admin Desa |
| `GET` | `/api/v1/billing-policies` | Mengambil konfigurasi jatuh tempo, denda, ambang SP1/SP2, & rekomendasi pemutusan per KPSPAMS. | Authenticated |
| `PUT` | `/api/v1/billing-policies` | Memperbarui parameter jatuh tempo, denda, atau biaya reconnect KPSPAMS. | Ketua KPSPAMS, Admin Desa |
| `GET` | `/api/v1/billing-periods` | Kalender periode tagihan bulanan. | Admin KPSPAMS, Bendahara |
| `POST` | `/api/v1/billing-periods` | Buka periode baru bulanan (misal: November 2026). | Admin KPSPAMS |
| `POST` | `/api/v1/billing-periods/{id}/generate-invoices` | **Trigger Billing Engine Job** untuk kalkulasi seluruh tagihan pada periode terkait. | Admin KPSPAMS |
| `PATCH` | `/api/v1/billing-periods/{id}/close` | Menutup periode tagihan resmi. | Ketua KPSPAMS |

### 3.6 Modul Invoice, Pembayaran, Kwitansi, & Tunggakan (`/api/v1/invoices`, `/payments`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/invoices` | Daftar invoice (filter status: Unpaid/Paid, periode, dusun, customer). | Admin KPSPAMS, Bendahara, Pelanggan (own) |
| `GET` | `/api/v1/invoices/{id}` | Detail invoice lengkap dengan rincian invoice_items. | Admin KPSPAMS, Bendahara, Pelanggan (own) |
| `GET` | `/api/v1/invoices/{id}/pdf` | Stream/download dokumen PDF invoice resmi. | Admin KPSPAMS, Bendahara, Pelanggan (own) |
| `POST` | `/api/v1/payments` | **Proses Pembayaran Kasir**: Menerima pelunasan invoice, mencatat kas masuk, cetak kwitansi. | Bendahara KPSPAMS |
| `GET` | `/api/v1/payments/{id}/receipt-pdf` | Stream/download kwitansi resmi ber-QR Code validasi. | Bendahara, Pelanggan (own) |
| `POST` | `/api/v1/payments/{id}/void` | Pembatalan pembayaran kasir hari yang sama ($T+0$) dengan audit log. | Bendahara KPSPAMS |
| `POST` | `/api/v1/payments/{id}/request-reversal` | Pengajuan pembatalan pembayaran tertutup/beda hari. | Bendahara KPSPAMS |
| `POST` | `/api/v1/payment-reversals/{id}/approve` | Persetujuan resmi pembalikan pembayaran oleh atasan. | Ketua KPSPAMS |
| `GET` | `/api/v1/arrears` | Daftar tunggakan pelanggan (aging debts $>30$, $>60$, $>90$ hari). | Bendahara, Admin KPSPAMS |

### 3.7 Modul Pengaduan & Work Order (`/api/v1/complaints`, `/work-orders`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/complaints` | Daftar pengaduan pelanggan (filter status, prioritas, kategori). | Petugas Lapangan, Admin, Pelanggan (own) |
| `POST` | `/api/v1/complaints` | Pelanggan membuat laporan gangguan (upload foto & deskripsi). | Pelanggan, Admin KPSPAMS |
| `PATCH` | `/api/v1/complaints/{id}/verify` | Verifikasi laporan dan penentuan prioritas penanganan. | Admin KPSPAMS |
| `POST` | `/api/v1/complaints/{id}/create-work-order` | Menerbitkan Surat Perintah Kerja (SPK) & menugaskan teknisi. | Admin KPSPAMS, Ketua KPSPAMS |
| `GET` | `/api/v1/work-orders` | Daftar Work Order penanganan fisik lapangan. | Petugas Lapangan, Admin KPSPAMS |
| `PATCH` | `/api/v1/work-orders/{id}/start` | Teknisi memulai pengerjaan di lokasi (upload foto sebelum). | Petugas Lapangan |
| `POST` | `/api/v1/work-orders/{id}/complete` | Teknisi menyelesaikan WO: upload foto sesudah, input material terpakai (auto potong inventaris), catatan tindakan. | Petugas Lapangan |

### 3.8 Modul Aset, Pemeliharaan, & Inventaris Material (`/api/v1/assets`, `/inventory`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/assets` | Register aset fisik per KPSPAMS (pompa, bak, pipa induk). | Admin KPSPAMS, Ketua KPSPAMS, Admin Desa |
| `POST` | `/api/v1/assets` | Menambah aset fisik baru. | Admin KPSPAMS |
| `POST` | `/api/v1/assets/{id}/maintenance` | Mencatat riwayat pemeliharaan berkala atau perbaikan darurat. | Petugas Lapangan, Admin KPSPAMS |
| `GET` | `/api/v1/inventory` | Daftar stok material teknik (pipa, valve, meter cadangan, lem). | Petugas Lapangan, Admin KPSPAMS |
| `POST` | `/api/v1/inventory/transactions` | Mutasi stok manual: Pembelian masuk (`IN_PURCHASE`) atau Penyesuaian opname (`ADJUSTMENT`). | Admin KPSPAMS |

### 3.9 Modul Keuangan & Kas (`/api/v1/finance`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/finance/cash-accounts` | Daftar akun kas/bank dan saldo terkini per unit. | Bendahara, Ketua KPSPAMS, Admin Desa |
| `POST` | `/api/v1/finance/cash-accounts` | Membuat akun kas baru (misal: Kas Operasional, Tabungan BRI). | Bendahara KPSPAMS |
| `POST` | `/api/v1/finance/cash-accounts/{id}/opening-balance` | **Pencatatan Saldo Awal Resmi Unit**: Menetapkan opening balance awal KPSPAMS beserta berita acara. | Ketua KPSPAMS, Bendahara KPSPAMS |
| `GET` | `/api/v1/finance/transactions` | Buku kas umum (mutasi debit/kredit penerimaan air, belanja PLN, gaji, dll). | Bendahara, Ketua KPSPAMS, Admin Desa |
| `POST` | `/api/v1/finance/transactions` | Input pencatatan pengeluaran atau pemasukan non-air manual. | Bendahara KPSPAMS |
| `POST` | `/api/v1/finance/transfer` | Mutasi transfer dana antar akun kas (misal dari Kas Tunai ke Bank BRI). | Bendahara KPSPAMS |

### 3.10 Modul Laporan & Dashboard (`/api/v1/reports`, `/dashboard`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/overview` | Ringkasan metrik dashboard (dinamis menyesuaikan scope role: Desa/KPSPAMS/Pelanggan). | Authenticated |
| `GET` | `/api/v1/reports/water-consumption` | Laporan pemakaian air ($m^3$) per dusun/kategori pelanggan. | Admin KPSPAMS, Admin Desa, Pemerintah Desa |
| `GET` | `/api/v1/reports/billing-collection` | Laporan efektivitas penagihan & persentase penerimaan. | Bendahara, Admin Desa, Pemerintah Desa |
| `GET` | `/api/v1/reports/arrears-aging` | Laporan analisa umur piutang & daftar penunggak. | Bendahara, Ketua KPSPAMS, Admin Desa |
| `GET` | `/api/v1/reports/cash-flow` | Laporan arus kas masuk vs keluar. | Bendahara, Ketua KPSPAMS, Pemerintah Desa |
| `GET` | `/api/v1/reports/export-pdf` | Generator laporan PDF terformat siap cetak rapat desa. | Admin KPSPAMS, Admin Desa, Pemerintah Desa |
| `GET` | `/api/v1/reports/export-excel` | Generator ekspor data mentah spreadsheet XLSX. | Admin KPSPAMS, Admin Desa |

### 3.11 Modul Audit Log & Notifikasi (`/api/v1/audit-logs`, `/notifications`)

| Metode | Endpoint | Deskripsi | Minimal Role |
|---|---|---|---|
| `GET` | `/api/v1/audit-logs` | Penelusuran jejak audit aktivitas sensitif (filter user, aksi, tanggal). | Super Admin, Admin Desa, Ketua KPSPAMS |
| `GET` | `/api/v1/notifications` | Daftar notifikasi untuk pengguna aktif. | Authenticated |
| `PATCH` | `/api/v1/notifications/{id}/read` | Menandai notifikasi telah dibaca. | Authenticated |
