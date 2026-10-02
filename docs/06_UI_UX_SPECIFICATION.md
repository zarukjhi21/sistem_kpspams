# SI-KPSPAMS KUAJANG - UI/UX DESIGN SPECIFICATION
**Spesifikasi Desain Antarmuka, Sistem Desain, Token Warna, & Ergonomi Pengguna**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. FILOSOFI DESAIN & PRINSIP UTAMA

Sistem Informasi Pengelolaan KPSPAMS Kuajang mengedepankan identitas visual yang **profesional, bersih, modern, dan fungsional**. Desain ini dirancang khusus untuk kenyamanan operasional harian aparatur desa, pengurus KPSPAMS di kantor, petugas pencatat meter di lapangan (mobile-first), dan warga desa.

### Prinsip Desain:
1. **Bebas dari Tampilan Generik AI**: Tata letak, tipografi, dan kontras dibangun dengan struktur presisi berbasis kegunaan nyata, bukan sekadar dashboard kosmetik.
2. **Prioritas Keterbacaan (High Readability)**: Angka meter dan nominal mata uang menggunakan font tabular monospaced agar tidak terjadi salah baca angka.
3. **Ergonomi Lapangan (Mobile-First for Field Staff)**: Form pencatatan meter dirancang ramah jempol (*thumb-friendly*), tombol berukuran minimal $48 \times 48$ px, dan alur input cepat dengan navigasi satu tangan.
4. **Hierarki Visual Jelas**: Status krusial (Tagihan Lunas, Tertunggak, Anomali Rollback) memiliki pembeda visual tegas tanpa bergantung hanya pada warna (menggunakan icon + teks pendukung).

---

## 2. PALET WARNA IDENTITAS (DESIGN TOKENS)

Warna identitas mengadopsi karakter kultural dan wibawa kelembagaan Desa Kuajang: **Merah Maroon, Emas/Kuning, Hitam, dan Putih Bersih**.

```
+--------------------------------------------------------------------------+
|  PRIMARY: MAROON       ACCENT: GOLD            NEUTRAL: SLATE / WHITE    |
|  #7B1113 (Deep)        #D4AF37 (Metallic)      #0F172A (Text Dark)       |
|  #991B1B (Base)        #F59E0B (Vibrant)       #F8FAFC (App Background)  |
|  #52090B (Hover)       #FEF3C7 (Soft Tint)     #FFFFFF (Card Surface)    |
+--------------------------------------------------------------------------+
```

### 2.1 Definisi Token Warna Tailwind CSS:
```javascript
// tailwind.config.ts extension
colors: {
  brand: {
    maroon: {
      50: '#FDF2F2',
      100: '#FCE7E7',
      500: '#B91C1C',
      700: '#8B0000', // Warna Brand Utama
      800: '#7B1113', // Warna Header & Sidebar
      900: '#52090B',
    },
    gold: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      400: '#F59E0B',
      500: '#D4AF37', // Aksen Emas Identitas
      600: '#D97706',
    },
  },
  surface: {
    bg: '#F8FAFC',        // Background aplikasi (very light neutral)
    card: '#FFFFFF',      // Kartu konten & tabel
    sidebar: '#0F172A',   // Sidebar kontras tinggi untuk Admin
    border: '#E2E8F0',    // Garis pemisah halus
  },
  status: {
    success: '#059669',   // Hijau Zamrud (Lunas, Aktif, Selesai)
    warning: '#D97706',   // Kuning Tua / Amber (Anomali, Pending, SP1)
    danger: '#DC2626',    // Merah Terang (Tunggakan, Rusak, Void)
    info: '#0284C7',      // Biru Langit (Work Order, Jadwal)
  }
}
```

---

## 3. TIPOGRAFI & SKALA TATA LETAK

- **Font Utama Antarmuka**: `Inter` atau `Plus Jakarta Sans` (Sans-serif modern dengan dukungan angka proporsional).
- **Font Angka Numerik & Kode**: `JetBrains Mono` / `Roboto Mono` untuk:
  - Nomor sambungan (`SR-LMB-00123`)
  - Stand meter (`00145.50 m³`)
  - Nominal rupiah (`Rp 45.000,00`)
  - Nomor tiket & kwitansi

| Level | Ukuran (Desktop) | Ukuran (Mobile) | Bobot | Kegunaan |
|---|---|---|---|---|
| **H1** | 28px (1.75rem) | 22px (1.375rem) | Bold (700) | Judul Halaman Utama / Dashboard |
| **H2** | 20px (1.25rem) | 18px (1.125rem) | SemiBold (600) | Judul Section & Modal Header |
| **H3** | 16px (1rem) | 15px (0.9375rem) | SemiBold (600) | Judul Kartu Metrik & Form Group |
| **Body** | 14px (0.875rem) | 14px (0.875rem) | Regular (400) | Teks Paragraf & Isi Tabel Data |
| **Caption** | 12px (0.75rem) | 11px (0.6875rem) | Medium (500) | Label Status, Timestamp, & Petunjuk |

---

## 4. STRUKTUR LAYOUT SESUAI PERSONA PENGGUNA

### 4.1 Layout Admin Desa & Pengurus KPSPAMS (Desktop First)
```
+---------------------------------------------------------------------------+
| [LOGO] SI-KPSPAMS KUAJANG   |  [Context: KPSPAMS Lemo Baru ▼] | [User] (Logout)|
+-----------------------------+---------------------------------------------+
| SIDEBAR (Maroon/Dark Slate) | BREADCRUMB: Home > Billing > Invoice        |
| - Dashboard                 |---------------------------------------------|
| - Master Kelembagaan        | [TOMBOL: + Buat Tagihan] [Filter Periode ▼] |
| - Pelanggan & Sambungan     |---------------------------------------------|
| - Catat & Validasi Meter    | TABEL DATA UTAMA                            |
| - Billing & Invoice         | [No Inv] [Pelanggan] [Pemakaian] [Status]   |
| - Kasir & Kwitansi          |  INV-01   M. Yusuf    12 m³     [LUNAS]     |
| - Layanan & Work Order      |  INV-02   Siti Aminah 25 m³     [BELUM]     |
| - Aset & Inventaris         |---------------------------------------------|
| - Keuangan & Kas            | Paginasi: < 1 2 3 4 5 >      Total: 300 data|
| - Laporan & Audit Log       |                                             |
+-----------------------------+---------------------------------------------+
```
- **Context Switcher Header**: Muncul otomatis untuk role `admin_desa` dan `pemerintah_desa` guna berpindah pandangan antara:
  - *Konsolidasi Seluruh Desa*
  - *KPSPAMS Lemo Baru*
  - *KPSPAMS Lemo Tua*
  - *KPSPAMS Sarampu 1 (Sarampu 1 & Pakkandoang)*

### 4.2 Layout Petugas Lapangan (Mobile-First / Field UX)
```
+---------------------------------------+
|  9:41                   [Online ●]  🔋|
|  KPSPAMS Sarampu 1 - Rute Pakkandoang |
+---------------------------------------+
|  [🔍 Cari No Sambungan / Nama...     ]|
+---------------------------------------+
|  SAMBUNGAN 12 DARI 85                 |
|  No: SR-PKD-00042                     |
|  Pelanggan: Rustam Effendi            |
|  Alamat: Dusun Pakkandoang RT 02      |
|  Meter Seri: ONDA-88219               |
|  Stand Lalu: 142 m³                   |
+---------------------------------------+
|  INPUT STAND AKHIR:                   |
|  [       1 5 6 . 0 0        ] m³      |
|  Pemakaian: 14 m³ (Normal)            |
+---------------------------------------+
|  [ 📷 AMBIL FOTO METER (WAJIB) ]      |
|  [ Foto_Meter_Rustam.jpg  ✓ Siap ]    |
+---------------------------------------+
|  [ SIMPAN & LANJUT KE BERIKUTNYA >> ] |
+---------------------------------------+
|  [ 🏠 Rute ]  [ 📋 Draft ]  [ ⚙️ Akun ]|
+---------------------------------------+
```
- **Komponen Khusus Lapangan**:
  - Tombol aksi berukuran besar.
  - Kompresi foto otomatis di browser (Client-side Canvas resize ke resolusi optimal $1280 \times 720$ px, ukuran berkas $< 400$ KB) sebelum diunggah via koneksi seluler pedesaan.
  - Indikator status jaringan (Online / Local Offline Cache).

### 4.3 Layout Portal Warga / Pelanggan (Simple Self-Service)
```
+---------------------------------------+
|  SI-KPSPAMS KUAJANG      [Halo, Warga]|
+---------------------------------------+
|  KARTU TAGIHAN AKTIF:                 |
|  Periode: Oktober 2026                |
|  Pemakaian: 15 m³                     |
|  TOTAL TAGIHAN:                       |
|  Rp 32.500,-          [Status: BELUM] |
|                                       |
|  [ 💳 TAMPILKAN QRIS PEMBAYARAN ]     |
|  [ 📥 DOWNLOAD INVOICE (PDF) ]        |
+---------------------------------------+
|  HISTORI PEMAKAIAN (6 BULAN TERAKHIR) |
|  [ Grafik Batang Pemakaian Air m³ ]   |
+---------------------------------------+
|  GANGGUAN AIR DI RUMAH ANDA?          |
|  [ 🚨 Ajukan Pengaduan Kerusakan ]    |
+---------------------------------------+
```

---

## 5. SPESIFIKASI KOMPONEN UI KRUSIAL

### 5.1 Data Table Ergonomics
- **Zebra Striping Halus**: Membantu pembacaan baris data horizontal yang panjang.
- **Sticky Table Header**: Header kolom tetap terlihat saat melakukan scroll vertikal.
- **Inline Status Badges**:
  - `Lunas` $\rightarrow$ Hijau (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - `Belum Bayar` $\rightarrow$ Merah muda (`bg-rose-50 text-rose-700 border-rose-200`)
  - `Anomali Rollback` $\rightarrow$ Kuning oranye (`bg-amber-50 text-amber-800 border-amber-300`)
- **Quick Row Actions**: Dropdown 3-titik horizontal (`...`) atau ikon aksi langsung (Detail, Cetak Kwitansi, Void Pembayaran).

### 5.2 Modal Konfirmasi Tindakan Destruktif (Void Payment / Rollback Resolution)
- Modal mewajibkan pengguna mengetikkan kata konfirmasi atau alasan pembatalan minimal 10 karakter.
- Tombol aksi berwarna Merah Maroon tegas: *"Ya, Batalkan Pembayaran Kasir"*.
- Menampilkan peringatan jelas bahwa tindakan ini tercatat permanen di jejak audit.
