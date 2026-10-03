# PANDUAN DEPLOYMENT 100% GRATIS & ONLINE 24 JAM NONSTOP
## Sistem Informasi Pengelolaan KPSPAMS Desa Kuajang

Panduan ini dirancang untuk men-deploy aplikasi secara penuh ke cloud:
- **Frontend UI**: Cloudflare Pages (Gratis Selamanya, Super Cepat, SSL Otomatis)
- **Backend API**: Render.com (Gratis Selamanya, Docker Container Region Singapore)
- **Database**: Neon.tech / Supabase (PostgreSQL Cloud Gratis Selamanya, 24 Jam Nonstop)
- **Keep-Alive 24 Jam**: UptimeRobot (Mencegah server Render tidur dengan ping otomatis)

---

### LANGKAH 1: Buat Database Cloud Gratis di Neon.tech (Waktu: 1 Menit)

1. Buka [https://neon.tech](https://neon.tech) dan klik **Sign Up** (bisa langsung login menggunakan akun Google atau GitHub).
2. Buat proyek database baru:
   - **Project name**: `sikpspams-kuajang`
   - **Region**: Pilih **Singapore (ap-southeast-1)** (paling dekat dengan Indonesia).
3. Setelah database terbentuk, Anda akan melihat halaman **Connection Details**.
4. Pilih tab **Parameters** (atau lihat string koneksi), Anda akan mendapatkan info berikut:
   - `Host`: misal `ep-cool-water-123456.ap-southeast-1.aws.neon.tech`
   - `Database`: `neondb` (atau nama DB Anda)
   - `Username`: `neondb_owner` (atau username Anda)
   - `Password`: `[password-anda]`
   - `Port`: `5432`
5. Simpan kredensial ini untuk diinput pada Langkah 2.

---

### LANGKAH 2: Deploy Backend Laravel di Render.com (Waktu: 3 Menit)

1. Pastikan seluruh kode repositori ini sudah di-push ke akun **GitHub** Anda.
2. Buka [https://render.com](https://render.com) dan login menggunakan akun GitHub Anda.
3. Di dashboard Render, klik tombol **New +** &rarr; pilih **Web Service**.
4. Pilih opsi **Build and deploy from a Git repository**, lalu klik **Next**.
5. Pilih repositori `sistem_kpspams` Anda.
6. Masukkan konfigurasi berikut:
   - **Name**: `sikpspams-backend`
   - **Region**: `Singapore (Southeast Asia)`
   - **Branch**: `master` (atau `main`)
   - **Root Directory**: `backend` (atau biarkan kosong jika Render mendeteksi `render.yaml`)
   - **Runtime**: `Docker`
   - **Instance Type**: **Free** ($0/month)
7. Pada bagian **Environment Variables**, klik **Add Environment Variable** dan masukkan kredensial Neon dari Langkah 1:
   - `APP_NAME`: `SI-KPSPAMS KUAJANG`
   - `APP_ENV`: `production`
   - `APP_DEBUG`: `false`
   - `APP_KEY`: `base64:e4j3W9x8qZ2Y6vL1R5tN8mK0pQ7sT3uV9x2y4z6a8b0=`
   - `APP_TIMEZONE`: `Asia/Makassar`
   - `DB_CONNECTION`: `pgsql`
   - `DB_HOST`: `[Host Neon Anda dari Langkah 1]`
   - `DB_PORT`: `5432`
   - `DB_DATABASE`: `[Database Neon Anda dari Langkah 1]`
   - `DB_USERNAME`: `[Username Neon Anda dari Langkah 1]`
   - `DB_PASSWORD`: `[Password Neon Anda dari Langkah 1]`
   - `SESSION_DRIVER`: `cookie`
   - `CACHE_STORE`: `file`
   - `QUEUE_CONNECTION`: `sync`
   - `CORS_ALLOWED_ORIGINS`: `*`
8. Klik **Create Web Service**.
9. Render akan otomatis mem-build Docker container, menginstal PHP 8.3 & dependensi, serta menjalankan migrasi database otomatis.
10. Tunggu hingga status menjadi **Live**. Salin URL backend Anda (contoh: `https://sikpspams-backend.onrender.com`).

---

### LANGKAH 3: Kunci Server Aktif 24 Jam dengan UptimeRobot (Waktu: 1 Menit)

Langkah ini penting agar backend Render Anda **TIDAK PERNAH TIDUR** (*never sleeps*):

1. Buka [https://uptimerobot.com](https://uptimerobot.com) dan buat akun gratis.
2. Klik **Add New Monitor**.
3. Isi konfigurasi:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `SI-KPSPAMS Backend Kuajang`
   - **URL (or IP)**: `https://[URL-RENDER-ANDA]/api/v1/health` (contoh: `https://sikpspams-backend.onrender.com/api/v1/health`)
   - **Monitoring Interval**: `Every 5 minutes`
4. Klik **Create Monitor**.
5. Sekarang, UptimeRobot akan mengirim ping setiap 5 menit sekali. Server Render Anda akan selalu aktif 24 jam nonstop dengan waktu respon instan saat diakses warga!

---

### LANGKAH 4: Deploy Frontend di Cloudflare Pages (Waktu: 2 Menit)

1. Buka [https://dash.cloudflare.com](https://dash.cloudflare.com) dan login.
2. Di menu sebelah kiri, pilih **Compute (Workers & Pages)**.
3. Klik **Create application** &rarr; pilih tab **Pages** &rarr; klik **Connect to Git**.
4. Pilih repositori GitHub `sistem_kpspams` Anda dan klik **Begin setup**.
5. Atur konfigurasi build berikut:
   - **Project name**: `sikpspams-kuajang` (atau nama pilihan Anda)
   - **Production branch**: `master` (atau `main`)
   - **Framework preset**: `Next.js`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
6. Buka bagian **Environment variables (advanced)** dan tambahkan:
   - **Variable name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://[URL-RENDER-ANDA]/api/v1` (contoh: `https://sikpspams-backend.onrender.com/api/v1`)
   - *(Opsional)* `GEMINI_API_KEY`: Masukkan API Key Gemini jika ingin fitur AI OCR KTP aktif.
7. Klik **Save and Deploy**.
8. Cloudflare akan mengompilasi Next.js dan memberikan domain gratis instan (contoh: `https://sikpspams-kuajang.pages.dev`).

---

### SELESAI & UJI COBA

Aplikasi Anda kini sudah resmi online 24 jam di internet:
- Warga dan pengurus dapat mengakses antarmuka di: `https://sikpspams-kuajang.pages.dev`
- Portal Warga Mandiri: `https://sikpspams-kuajang.pages.dev/portal`
- Login Pengelola KPSPAMS: `https://sikpspams-kuajang.pages.dev/login`
- Backend API & Database berjalan 24 jam nonstop di cloud tanpa membebani komputer kantor desa!
