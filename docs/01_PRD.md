# SI-KPSPAMS KUAJANG - PRODUCT REQUIREMENT DOCUMENT (PRD)
**Dokumen Referensi Utama (Source of Truth)**  
*Sistem Informasi Pengelolaan KPSPAMS Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. PENDAHULUAN & LATAR BELAKANG

### 1.1 Konteks Wilayah & Entitas Bisnis
Desa Kuajang terletak di Kecamatan Binuang, Kabupaten Polewali Mandar, Provinsi Sulawesi Barat. Secara administratif dan operasional penyediaan air minum perdesaan berbasis masyarakat, Desa Kuajang memiliki konfigurasi wilayah dan kelembagaan sebagai berikut:

- **Desa**: Desa Kuajang (Pemerintah Desa bertindak sebagai regulator, pembina, pengawas, dan pemilik kebijakan agregat).
- **Dusun (5 Dusun Administratif)**:
  1. **Dusun Sarampu 1**
  2. **Dusun Sarampu 2** (Master data aktif, namun pada rilis fase awal belum memiliki unit KPSPAMS aktif).
  3. **Dusun Lemo Baru**
  4. **Dusun Lemo Tua**
  5. **Dusun Pakkandoang**
- **Unit Pengelola KPSPAMS (3 Unit Operasional)**:
  1. **KPSPAMS Lemo Baru**: Melayani wilayah Dusun Lemo Baru.
  2. **KPSPAMS Lemo Tua**: Melayani wilayah Dusun Lemo Tua.
  3. **KPSPAMS Sarampu 1**: Melayani wilayah Dusun Sarampu 1 dan Dusun Pakkandoang.

> [!IMPORTANT]
> **Aturan Bisnis Kunci Wilayah**:
> - Dusun **Pakkandoang BUKAN KPSPAMS mandiri**. Pakkandoang adalah wilayah layanan di bawah naungan operasional **KPSPAMS Sarampu 1**.
> - Dusun **Sarampu 2** wajib tercatat pada master data dusun, tetapi relasi ke KPSPAMS bernilai `NULL` (unassigned) sampai terbentuk badan pengelola resmi di kemudian hari.

### 1.2 Masalah Bisnis yang Diselesaikan
1. **Fragmentasi Pencatatan**: Selama ini pencatatan pelanggan, pembacaan meter, tagihan, dan keuangan dilakukan secara manual di buku kas kertas oleh masing-masing pengurus KPSPAMS, berisiko tinggi hilang atau rusak.
2. **Human Error Perhitungan Tagihan**: Tarif air bertingkat sering salah dihitung manual, menimbulkan sengketa dengan pelanggan.
3. **Kebocoran & Anomali Meter**: Tidak ada deteksi otomatis pembacaan meter mundur (rollback) atau lonjakan pemakaian abnormal.
4. **Tunggakan Tak Terkendali**: Kurangnya riwayat piutang membuat penagihan tidak efektif dan arus kas pengelola terganggu.
5. **Ketiadaan Akuntabilitas Keuangan**: Pemerintah Desa kesulitan mendapatkan laporan konsolidasi pendapatan, belanja, dan aset air bersih dari ketiga KPSPAMS secara real-time.
6. **Respon Gangguan Lambat**: Pengaduan pelanggan via pesan singkat sering tercecer, tidak ada tracking Work Order perbaikan, material yang keluar, maupun biaya teknisnya.

### 1.3 Visi & Tujuan Produk
Membangun platform sistem informasi terpadu berbasis web (dengan kesiapan mobile masa depan) yang mengintegrasikan aspek **operasional meter**, **billing engine**, **akuntansi kas**, **manajemen aset/inventaris teknik**, **service desk (pengaduan & work order)**, serta **portal mandiri pelanggan**, dengan jaminan isolasi data ketat antar-KPSPAMS dan visibilitas agregat bagi Pemerintah Desa.

---

## 2. PENGGUNA SISTEM (USER PERSONAS)

| Persona / Role | Deskripsi & Tanggung Jawab Utama | Lingkup Akses (Data Scope) |
|---|---|---|
| **Super Admin** | Tim teknis/pengembang sistem. Konfigurasi platform, backup, error log, migrasi, dan health-check. | Sistem Global (Akses Penuh) |
| **Admin Desa** | Staf IT/Operator Desa Kuajang. Mengelola master desa, dusun, pendaftaran KPSPAMS, akun pengguna aparatur desa, dan memantau operasional agregat. | Seluruh Desa Kuajang & Seluruh KPSPAMS |
| **Pemerintah Desa** | Kepala Desa, BPD, dan Perangkat Desa. Memantau dashboard eksekutif, laporan konsolidasi keuangan, tingkat layanan air, dan kepuasan warga. | Read-Only Seluruh KPSPAMS |
| **Ketua KPSPAMS** | Pimpinan KPSPAMS (Lemo Baru, Lemo Tua, Sarampu 1). Menyetujui usulan tarif, menyetujui work order biaya tinggi, menutup periode buku, memantau kinerja operasional. | Scope KPSPAMS Terkait Saja |
| **Admin KPSPAMS** | Staf tata usaha KPSPAMS. Mengelola data pelanggan, sambungan rumah, penetapan periode tagihan, verifikasi pembacaan meter, cetak invoice, dan tiket pengaduan. | Scope KPSPAMS Terkait Saja |
| **Bendahara KPSPAMS** | Kasir & pengelola keuangan KPSPAMS. Menerima pembayaran, cetak kwitansi, mencatat mutasi kas (in/out), rekonsiliasi kas harian, dan pembatalan pembayaran (void) tersupervisi. | Scope KPSPAMS Terkait Saja |
| **Petugas Lapangan** | Surveyor, pembaca meter, dan teknisi pemeliharaan. Menginput angka meter + foto bukti, mengeksekusi Work Order gangguan/kebocoran, mencatat material terpakai. | Scope KPSPAMS Terkait (Mobile UX Optimized) |
| **Pelanggan** | Warga pelanggan sambungan air. Melihat riwayat pemakaian air bulanan, mengecek jumlah tagihan/tunggakan, download kwitansi digital, dan mengajukan pengaduan gangguan. | Scope Akun/Sambungan Milik Sendiri |

---

## 3. RUANG LINGKUP 30 MODUL SISTEM

Sistem terdiri atas 30 modul terpadu yang saling terintegrasi:

```
[1. AUTHENTICATION] ── [2. DASHBOARD] ── [30. AUDIT LOG]
         │
 ┌───────┴───────────────────────────────┬───────────────────────────────┐
 │ Master Kelembagaan                    │ Pelanggan & Jaringan          │
 ├───────────────────────────────────────┼───────────────────────────────┤
 │ 3. Desa                               │ 10. Pelanggan                 │
 │ 4. Dusun                              │ 11. Sambungan                 │
 │ 5. KPSPAMS                            │ 12. Meter Air                 │
 │ 6. Wilayah Layanan (Pivot)            │ 13. Pembacaan Meter           │
 │ 7. User                               │                               │
 │ 8. Role                               │                               │
 │ 9. Permission                         │                               │
 └───────────────────────────────────────┴───────────────────────────────┘
         │
 ┌───────┴───────────────────────────────┬───────────────────────────────┐
 │ Billing & Revenue Engine              │ Operasional Teknik            │
 ├───────────────────────────────────────┼───────────────────────────────┤
 │ 14. Tarif & Komponen                  │ 21. Pengaduan                 │
 │ 15. Periode Tagihan                   │ 22. Work Order (SPK)          │
 │ 16. Invoice (Tagihan)                 │ 23. Pemeliharaan              │
 │ 17. Invoice Item                      │ 24. Aset Jaringan & Mesin     │
 │ 18. Pembayaran                        │ 25. Inventaris Material       │
 │ 19. Tunggakan (Piutang)               │                               │
 │ 20. Kwitansi Digital                  │                               │
 └───────────────────────────────────────┴───────────────────────────────┘
         │
 ┌───────┴───────────────────────────────┐
 │ Keuangan & Pelaporan                  │
 ├───────────────────────────────────────┤
 │ 26. Transaksi Keuangan                │
 │ 27. Akun Kas/Bank                     │
 │ 28. Pelaporan Dinamis                 │
 │ 29. Notifikasi Real-time              │
 └───────────────────────────────────────┘
```

### Detail Modul:
1. **Authentication**: Login multi-role, Bearer Token via Laravel Sanctum, session management, logout, force logout, password reset terenkripsi.
2. **Dashboard**: 
   - *Dashboard Desa*: Statistik agregat 3 KPSPAMS (Total pelanggan, tingkat keaktifan, total kubikasi terdistribusi, total tagihan vs penerimaan, tunggakan total, saldo kas gabungan, status gangguan).
   - *Dashboard KPSPAMS*: KPI spesifik unit (Pelanggan aktif, target pembacaan meter, tagihan terbayar vs outstanding, saldo akun kas unit, antrean WO).
   - *Dashboard Pelanggan*: Tagihan belum dibayar, histori pemakaian grafik 6 bulan terakhir, status tiket komplain.
3. **Desa**: Profil Desa Kuajang, kontak, lambang daerah, data demografis penunjang air bersih.
4. **Dusun**: Master 5 dusun (Sarampu 1, Sarampu 2, Lemo Baru, Lemo Tua, Pakkandoang).
5. **KPSPAMS**: Profil 3 KPSPAMS, SK pendirian desa, kontak pengurus, status aktif.
6. **Wilayah Layanan**: Relasi many-to-many / one-to-many KPSPAMS terhadap Dusun (`kpspams_dusun`), penandaan Dusun Pakkandoang berada di bawah KPSPAMS Sarampu 1.
7. **User**: Manajemen akun staf, nomor handphone, email, password hash (Argon2id/Bcrypt), penugasan role dan KPSPAMS asal.
8. **Role**: RBAC Role management (Super Admin, Admin Desa, Pemerintah Desa, Ketua KPSPAMS, Admin KPSPAMS, Bendahara KPSPAMS, Petugas Lapangan, Pelanggan).
9. **Permission**: Hak akses granular (`kpspams:view`, `invoice:generate`, `meter_reading:verify`, `payment:void`, dll).
10. **Pelanggan**: Data master pelanggan, NIK, No KK, No Telp, Alamat, Kategori Pelanggan (Rumah Tangga, Niaga, Sosial, Instansi), status aktif/non-aktif/suspend.
11. **Sambungan**: Data sambungan fisik (No Sambungan unik berformat `[KODE_KPSPAMS]-[DUSUN]-[NO_URUT]`), koordinat latitude/longitude, tanggal pasang, status sambungan (Aktif, Disegel, Diputus Sementara, Dibongkar).
12. **Meter**: Master unit fisik meter air (No Seri, Merk, Ukuran diameter misal 1/2 inch, Tanggal Kalibrasi, Status Kondisi: Baik, Rusak, Buram/Mati).
13. **Pembacaan Meter**: Pencatatan rutin bulanan (Stand Awal, Stand Akhir, Pemakaian $m^3$, Foto Bukti Angka Meter, Timestamp GPS, Catatan Petugas, Flag Anomali).
14. **Tarif**: Master skema tarif per kategori pelanggan, tanggal berlaku (effective dates), histori versi.
15. **Periode Tagihan**: Kalender operasional per KPSPAMS (Tahun, Bulan, Tanggal Buka Catat Meter, Tanggal Tutup Catat Meter, Tanggal Jatuh Tempo Tagihan, Status: Draft, Open, Invoicing, Closed).
16. **Invoice (Tagihan)**: Dokumen penagihan resmi (No Invoice unik, Periode, Sambungan, Rincian Volume, Denda, Biaya Beban/Admin, Total Tagihan, Sisa Tagihan, Status: Unpaid, Partially Paid, Paid, Voided).
17. **Invoice Item**: Detail rincian tagihan (Biaya Pemakaian Air per Tier, Biaya Pemeliharaan Meter, Biaya Administrasi, Denda Keterlambatan).
18. **Pembayaran**: Transaksi pelunasan kasir/transfer (No Kwitansi unik, Tanggal Bayar, Jumlah Bayar, Metode Bayar: Tunai, Transfer Bank, QRIS, Akun Kas Masuk, Petugas Penerima).
19. **Tunggakan**: Tracking piutang tertunggak multi-periode, kalkulasi denda otomatis, surat peringatan (SP1, SP2, SP Putus).
20. **Kwitansi**: Generator bukti pembayaran digital (PDF, QR Code verifikasi keaslian, rincian pembayaran, watermark lunas).
21. **Pengaduan**: Layanan aspirasi/gangguan pelanggan (No Tiket, Kategori: Air Mati, Keruh, Bau, Pipa Bocor, Meter Rusak, Tagihan Tidak Wajar; Bukti Foto, Geo-tag).
22. **Work Order (SPK)**: Penugasan tindak lanjut gangguan atau pemasangan baru kepada Petugas Lapangan (No SPK, Teknisi ditugaskan, Jadwal, Target Penyelesaian, Foto Sebelum, Foto Sesudah, Catatan Teknis).
23. **Pemeliharaan**: Log servis preventif dan kuratif jaringan perpipaan, pompa transmisi, reservoir/bak penampungan, dan valve.
24. **Aset**: Register aset fisik (Pompa Submersible, Pipa Distribusi HDPE/PVC, Bak Reservoir, Panel Surya/Genset, Kendaraan Operasional, Bangunan Kantor), Nilai Perolehan, Penyusutan, Kondisi (Baik, Rusak Ringan, Rusak Berat).
25. **Inventaris**: Kartu stok material teknik (Pipa, Stop Kran, Meter Air baru, Lem PVC, Seal Tape, Klem Pelana), stok minimum, mutasi masuk, mutasi keluar otomatis saat Work Order selesai.
26. **Transaksi Keuangan**: Buku kas operasional KPSPAMS (Pemasukan air & non-air, Pengeluaran operasional: listrik PLN, gaji petugas, pembelian kaporit, konsumsi rapat), link bukti kuitansi nota.
27. **Kas**: Master buku kas/rekening bank per KPSPAMS (misal: Kas Tunai Bendahara Lemo Baru, Rekening BRI KPSPAMS Sarampu 1), pencatatan transfer antar-rekening kas.
28. **Laporan**: Engine pelaporan tabular & grafis, ekspor format PDF & Excel/XLSX:
    - Laporan Rekapitulasi Pemakaian Air ($m^3$) per Dusun.
    - Laporan Efektivitas Penagihan (Billing vs Collection Rate).
    - Laporan Daftar Piutang & Umur Tunggakan (Aging Debts).
    - Laporan Laba Rugi Sederhana / Arus Kas KPSPAMS.
    - Laporan Neraca Stok Material.
    - Laporan Konsolidasi Tingkat Desa untuk Kepala Desa & BPD.
29. **Notifikasi**: Sistem pemberitahuan in-app dan persiapan WhatsApp/SMS gateway (Tagihan terbit, Pengingat H-3 jatuh tempo, Work Order baru untuk teknisi, Status pengaduan selesai untuk pelanggan).
30. **Audit Log**: Jejak audit forensik permanen atas setiap operasi sensitif (Insert, Update, Delete, Void, Reversal, Perubahan Tarif, Otentikasi).

---

## 4. ATURAN BISNIS (BUSINESS RULES) KRUSIAL

### 4.1 Aturan Pembacaan Meter & Deteksi Anomali
1. **Formula Pemakaian**:
   $$\text{Pemakaian } (m^3) = \text{Stand Akhir (Current)} - \text{Stand Awal (Previous)}$$
2. **Kondisi Anomali 1 (Stand Mundur / Rollback)**:
   - Jika $\text{Stand Akhir} < \text{Stand Awal}$, sistem menolak kalkulasi otomatis langsung menjadi tagihan.
   - Status pembacaan ditandai sebagai `ANOMALY_ROLLBACK`.
   - Sistem mewajibkan Petugas Lapangan memasukkan alasan (misal: "Penggantian unit meter baru", "Meter putar balik karena tekanan balik", atau "Salah ketik angka").
   - Jika terjadi penggantian meter:
     $$\text{Pemakaian} = (\text{Stand Akhir Meter Lama} - \text{Stand Awal}) + (\text{Stand Akhir Meter Baru} - \text{Stand Awal Meter Baru})$$
   - Wajib diverifikasi oleh Admin KPSPAMS sebelum terbit invoice.
3. **Kondisi Anomali 2 (Lonjakan Ekstrem / Spike)**:
   - Jika $\text{Pemakaian Bulan Ini} > 300\% \times \text{Rata-rata 3 Bulan Sebelumnya}$, sistem memberi peringatan `WARNING_SPIKE`.
   - Membutuhkan verifikasi konfirmasi lapangan untuk mengantisipasi kebocoran pipa instalasi dalam rumah pelanggan.
4. **Foto Bukti Pembacaan**:
   - Pembacaan meter oleh Petugas Lapangan wajib melampirkan minimal 1 foto fisik dial meter yang valid.

### 4.2 Aturan Billing Engine & Versi Tarif
1. **Komponen Tarif**:
   - Biaya Beban Tetap (Admin & Pemeliharaan Jaringan).
   - Tarif Bertingkat (Tiered Progressive Rates), contoh:
     - Tier 1: $0 - 10\ m^3$ = Rp 1.500 / $m^3$
     - Tier 2: $11 - 20\ m^3$ = Rp 2.500 / $m^3$
     - Tier 3: $> 20\ m^3$ = Rp 3.500 / $m^3$
2. **Immutability Tagihan Lama**:
   - Master tarif memiliki kolom `valid_from` dan `valid_to`.
   - Ketika ada kenaikan tarif pada bulan Juli, tagihan bulan Juni atau bulan-bulan sebelumnya yang belum dibayar **TIDAK BOLEH BERUBAH NILAINYA**.
   - Kalkulasi tagihan mengunci nilai tarif (`snapshot_rate`) ke dalam tabel `invoice_items` pada saat invoice di-generate.
3. **Pencegahan Modifikasi Invoice Terbayar**:
   - Invoice dengan status `PAID` atau `PARTIALLY_PAID` dilarang keras diubah secara langsung via API update biasa.
   - Setiap koreksi nilai tagihan harus melalui mekanisme koreksi resmi (Credit Note / Adjustment) yang disetujui Ketua KPSPAMS.

### 4.3 Aturan Pembayaran, Void, dan Reversal
1. **Prinsip Audit Kas**:
   - Baris pembayaran pada tabel `payments` **TIDAK BOLEH DIHAPUS (NO HARD DELETE)**.
2. **Mekanisme Pembatalan (VOID)**:
   - Hanya dapat dilakukan pada hari yang sama ($T+0$) sebelum kas harian ditutup oleh Bendahara.
   - Digunakan jika terjadi kesalahan input kasir (human error, salah pilih nominal atau salah pilih nomor pelanggan).
   - Memerlukan input alasan pembatalan dan otomatis mengembalikan status invoice menjadi `UNPAID`.
   - Mengurangi saldo akun kas terkait dan mencatat mutasi pengurang di buku kas harian.
3. **Mekanisme Pembalikan (REVERSAL)**:
   - Dilakukan jika transaksi sudah melewati hari penutupan kas atau uang transfer ditarik kembali/gagal kliring.
   - Membutuhkan otorisasi berjenjang (Disetujui oleh Ketua KPSPAMS).
   - Menghasilkan entri transaksi kontra di `financial_transactions` dan relasi ke `payment_reversals`.

### 4.4 Siklus Pengaduan, Work Order, dan Integrasi Stok
1. Pelanggan/Warga mengajukan pengaduan $\rightarrow$ Status: `RECEIVED`.
2. Admin KPSPAMS memverifikasi kelayakan $\rightarrow$ Status: `VERIFIED`.
3. Admin/Ketua menugaskan Petugas Lapangan $\rightarrow$ Menghasilkan dokumen **Work Order** (Status: `ASSIGNED`).
4. Petugas Lapangan memulai pengerjaan $\rightarrow$ Status: `IN_PROGRESS` (Upload foto kondisi awal).
5. Petugas menyelesaikan perbaikan:
   - Upload foto kondisi selesai.
   - Menginput material yang digunakan (misal: 2 pcs Socket PVC, 1 meter pipa 1/2 inch).
   - Penginputan material otomatis memicu `inventory_transactions` bertipe `OUT_WORK_ORDER` yang memotong saldo stok material di KPSPAMS terkait.
6. Admin memverifikasi hasil perbaikan $\rightarrow$ Work Order `COMPLETED`, Pengaduan `RESOLVED`.

---

## 5. KEBUTUHAN NON-FUNGSIONAL (NFR)

1. **Performa**:
   - Panggilan API standar (Pencarian pelanggan, daftar tagihan) memiliki response time $< 300$ ms pada koneksi 4G standar.
   - Eksekusi batch billing generation untuk 1.000 pelanggan selesai dalam waktu $< 15$ detik via Background Job.
2. **Ketersediaan & Keandalan**:
   - Sistem dapat beroperasi 24/7 dengan target ketersediaan 99.5%.
   - Seluruh data transaksi di-backup terjadwal otomatis setiap malam ke volume terisolasi.
3. **Ergonomi Lapangan (Field Usability)**:
   - Antarmuka untuk Petugas Lapangan harus responsive, ringan (low bandwidth), mendukung kompresi gambar di sisi browser sebelum upload, dan input angka yang ramah jempol (*large touch target*).
4. **Keamanan & Kepatuhan**:
   - Tidak ada transmisi data tanpa enkripsi HTTPS/TLS.
   - Kata sandi di-hash menggunakan algoritma standar industri (Bcrypt/Argon2id).
   - Tidak ada kebocoran data antar-KPSPAMS (Strict Multitenancy Scoping).
5. **Skalabilitas**:
   - Struktur database dirancang siap menampung penambahan KPSPAMS baru di Dusun Sarampu 2 atau dusun-dusun pemekaran lainnya di masa mendatang tanpa perombakan skema tabel.

---

## 6. RESOLUSI BLOCKING QUESTIONS & KEPUTUSAN BISNIS RESMI (RESOLVED)

Seluruh pertanyaan pemblokir (Blocking Questions) telah diputuskan secara resmi sebagai berikut:

### 6.1 Denda Keterlambatan & Jatuh Tempo (STATUS: RESOLVED)
- **Keputusan MVP**: Denda keterlambatan default adalah **Rp 0** dan **TIDAK DIPAKSAKAN** menjadi kebijakan otomatis pada fase rilis awal.
- **Fleksibilitas Masa Depan**: Basis data dan arsitektur kode mendukung konfigurasi denda di masa depan (baik nominal flat, persentase bertahap, maupun metode lain), tanpa mengasumsikan salah satunya sebagai kebijakan resmi saat ini.
- **Jatuh Tempo**: Tanggal jatuh tempo (*due date*) bersifat dinamis dan dapat dikonfigurasi (*configurable*) per periode tagihan atau per kebijakan KPSPAMS.

### 6.2 Otonomi Skema Tarif Per KPSPAMS (STATUS: RESOLVED)
- **Keputusan Multi-Tarif**: Ketiga KPSPAMS (Lemo Baru, Lemo Tua, Sarampu 1) **TIDAK DIASUMSIKAN MEMILIKI TARIF YANG SAMA**.
- **Model Basis Data**: Setiap tarif terikat secara spesifik pada `kpspams_id` dengan metadata:
  - `kpspams_id`: Identitas KPSPAMS pemilik tarif.
  - `effective_from` & `effective_until`: Masa berlaku tarif.
  - `tariff_components`: Rincian tier kubikasi ($m^3$) dan komponen biaya.
  - `status`: Status keaktifan skema tarif.
- **Snapshot Immutability**: Invoice yang diterbitkan mengunci snapshot tarif yang berlaku saat invoice dibuat, sehingga perubahan tarif baru di kemudian hari tidak mengubah tagihan historis.

### 6.3 Saldo Awal Kas & Pemisahan Akun (STATUS: RESOLVED)
- **Fitur Opening Balance**: Disediakan fitur pencatatan Saldo Awal (*Opening Balance*) resmi untuk masing-masing KPSPAMS.
- **Larangan Rp0 Sebagai Data Final**: Saldo awal tidak diisi Rp 0 sebagai data bisnis final. Sistem menyediakan data placeholder/seeder yang realistis dan dapat diperbarui (*override*) saat data kas riil diserahterimakan oleh pengurus.
- **Isolasi Kas**: Saldo dan buku kas masing-masing KPSPAMS terpisah secara mutlak.

### 6.4 Kebijakan Pemutusan Sambungan Non-Otomatis (STATUS: RESOLVED)
- **Tanpa Hard-code**: Jumlah bulan tunggakan tidak di-hardcode di kode program.
- **Configurable Policy**: Sistem menyediakan tabel konfigurasi kebijakan untuk:
  - Batas toleransi bulan tunggakan.
  - Ambang batas penerbitan SP1 (Surat Peringatan 1).
  - Ambang batas penerbitan SP2.
  - Ambang batas rekomendasi pemutusan.
  - Biaya penyambungan kembali (*re-connection fee*) jika kebijakan ditetapkan di masa depan.
- **Rekomendasi Administratif**: Pada MVP, sistem hanya menyajikan rekomendasi administratif dan penandaan status. **Sistem TIDAK melakukan pemutusan fisik secara otomatis**.

### 6.5 Arsitektur Notifikasi MVP & Ekstensibilitas (STATUS: RESOLVED)
- **Cakupan MVP**: Notifikasi MVP menggunakan **In-App Notification**, **Cetak Dokumen**, dan **Download PDF Resmi**.
- **WhatsApp Gateway**: Integrasi WhatsApp Gateway **TIDAK DIMASUKKAN** ke dalam core MVP saat ini.
- **Extensible Notification Service**: Backend mengimplementasikan interface `NotificationChannelInterface` (Observer / Event-Driven Pattern) sehingga WhatsApp Gateway (seperti Fonnte, Wablas, atau Twilio) dapat dihubungkan di kemudian hari sebagai driver baru tanpa memodifikasi satu baris pun logika bisnis penagihan (*billing engine*).

