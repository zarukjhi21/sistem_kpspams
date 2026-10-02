# SI-KPSPAMS KUAJANG - DEPLOYMENT & INFRASTRUCTURE SPECIFICATION
**Spesifikasi Orkestrasi Docker, Konfigurasi Produksi, Backup, & Disaster Recovery**  
*Desa Kuajang, Kecamatan Binuang, Kabupaten Polewali Mandar, Sulawesi Barat*

---

## 1. DESAIN ORKESTRASI DOCKER MULTI-CONTAINER

Infrastruktur sistem dirancang sepenuhnya terisolasi dan dapat direproduksi menggunakan **Docker Compose**, menjamin stabilitas deployment pada server lokal Kantor Desa Kuajang maupun Cloud VPS (DigitalOcean / AWS / Biznet Gio).

```
[INTERNET / PENGGUNA LAPANGAN & WARGA]
                 │
                 ▼
       Port 80 / 443 (HTTPS)
+-------------------------------------------------------------------------+
|                  CONTAINER 1: NGINX REVERSE PROXY                       |
|   - Let's Encrypt SSL / TLS Termination                                 |
|   - Proxy Pass /      ──> Container 2: Frontend (Next.js Port 3000)     |
|   - Proxy Pass /api   ──> Container 3: Backend (Laravel PHP-FPM Port 9000)|
|   - Rate Limiting & Gzip/Brotli Compression                             |
+--------------------+-----------------------------------+----------------+
                     │                                   │
      +--------------v--------------+     +--------------v--------------+
      |    CONTAINER 2: FRONTEND    |     |    CONTAINER 3: BACKEND     |
      | Next.js 14+ (Node.js Alpine)|     | Laravel 11 (PHP 8.3-FPM)    |
      | SSR / CSR UI Production     |     | REST API & Business Logic   |
      +-----------------------------+     +--------------+--------------+
                                                         │
                     ┌───────────────────────────────────┼───────────────────────────────────┐
                     │                                   │                                   │
      +--------------v--------------+     +--------------v--------------+     +--------------v--------------+
      |  CONTAINER 4: QUEUE WORKER  |     |  CONTAINER 5: CRON SCHEDULER|     |    CONTAINER 6: DATABASE    |
      | Laravel Artisan Queue:work  |     | Laravel Schedule:run (Cron) |     | PostgreSQL 16 (Alpine)      |
      | Background Batch Jobs       |     | Kalkulasi Denda & Backup    |     | Volume: db_data (Persistent)|
      +--------------+--------------+     +--------------+--------------+     +-----------------------------+
                     │                                   │
                     └─────────────────┬─────────────────┘
                                       │
                        +--------------v--------------+
                        |     CONTAINER 7: REDIS      |
                        | Redis 7 (Alpine)            |
                        | Cache & Message Broker      |
                        | Volume: redis_data          |
                        +-----------------------------+
```

---

## 2. DOCKER COMPOSE PRODUKSI (DOCKER-COMPOSE.PROD.YML)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: sikpspams_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/conf.d:/etc/nginx/conf.d
      - ./docker/nginx/ssl:/etc/nginx/ssl
      - ./backend/storage/app/public:/var/www/backend/storage/app/public:ro
    depends_on:
      - frontend
      - backend
    networks:
      - sikpspams_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: sikpspams_frontend
    restart: always
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://kpspams.desakuajang.id/api/v1
    networks:
      - sikpspams_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: sikpspams_backend
    restart: always
    volumes:
      - ./backend/storage:/var/www/backend/storage
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
    env_file:
      - ./backend/.env.production
    depends_on:
      - postgres
      - redis
    networks:
      - sikpspams_network

  queue_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: sikpspams_queue
    restart: always
    command: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
    volumes:
      - ./backend/storage:/var/www/backend/storage
    env_file:
      - ./backend/.env.production
    depends_on:
      - backend
      - redis
    networks:
      - sikpspams_network

  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: sikpspams_scheduler
    restart: always
    command: ["sh", "-c", "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"]
    volumes:
      - ./backend/storage:/var/www/backend/storage
    env_file:
      - ./backend/.env.production
    depends_on:
      - backend
    networks:
      - sikpspams_network

  postgres:
    image: postgres:16-alpine
    container_name: sikpspams_postgres
    restart: always
    environment:
      POSTGRES_DB: ${DB_DATABASE:-sikpspams_db}
      POSTGRES_USER: ${DB_USERNAME:-sikpspams_admin}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-KuajangSecure2026!}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sikpspams_network

  redis:
    image: redis:7-alpine
    container_name: sikpspams_redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-RedisSecure2026!}
    volumes:
      - redis_data:/data
    networks:
      - sikpspams_network

networks:
  sikpspams_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## 3. VARIABEL LINGKUNGAN PRODUKSI (.ENV SPECIFICATION)

### Konfigurasi Backend (`backend/.env.production`):
```ini
APP_NAME="SI-KPSPAMS KUAJANG"
APP_ENV=production
APP_KEY=base64:GENERATE_VIA_ARTISAN_KEY_GENERATE=
APP_DEBUG=false
APP_URL=https://kpspams.desakuajang.id
APP_TIMEZONE=Asia/Makassar

LOG_CHANNEL=daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=info

# Database PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=sikpspams_db
DB_USERNAME=sikpspams_admin
DB_PASSWORD=GANTI_DENGAN_PASSWORD_DATABASE_KUAT_MIN_24_KARAKTER

# Redis Queue & Cache
BROADCAST_CONNECTION=log
CACHE_STORE=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_CLIENT=phpredis
REDIS_HOST=redis
REDIS_PASSWORD=GANTI_DENGAN_PASSWORD_REDIS_KUAT
REDIS_PORT=6379

# Sanctum Stateful Domains (Untuk Web Frontend)
SANCTUM_STATEFUL_DOMAINS=kpspams.desakuajang.id
SESSION_DOMAIN=.desakuajang.id
```

---

## 4. STRATEGI CADANGAN DATA & PEMULIHAN BENCANA (BACKUP & DISASTER RECOVERY)

### 4.1 Jadwal Backup Terotomatisasi (Automated Dump Schedule)
1. **Database PostgreSQL**:
   - Dieksekusi setiap malam pukul `01:00 WITA` via script cron shell terisolasi:
     ```bash
     docker exec -t sikpspams_postgres pg_dump -U sikpspams_admin -d sikpspams_db | gzip > /backups/db/sikpspams_db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
     ```
2. **Berkas Privat & Bukti Foto (`storage/app/private`)**:
   - Dieksekusi setiap malam pukul `02:00 WITA` menggunakan utilitas `rsync` terenkripsi ke media backup sekunder / offsite cloud storage.

### 4.2 Kebijakan Retensi Berkas Cadangan (Retention Policy)
- Cadangan Harian: Disimpan selama **7 hari**.
- Cadangan Mingguan: Disimpan selama **4 minggu**.
- Cadangan Bulanan (Tutup Buku): Disimpan permanen selama minimal **5 tahun** sebagai arsip keuangan kelembagaan desa.

### 4.3 Prosedur Pemulihan Cepat (One-Line Disaster Recovery)
Jika terjadi kerusakan hardware pada server:
```bash
gunzip -c /backups/db/sikpspams_db_20261001_010000.sql.gz | docker exec -i sikpspams_postgres psql -U sikpspams_admin -d sikpspams_db
```

---

## 5. HEALTH CHECK & MONITORING KESEHATAN SISTEM

Sistem menyediakan endpoint diagnostik ringan: `GET /api/v1/health`
Mengevaluasi parameter berikut:
1. **Koneksi Database PostgreSQL**: Memastikan status query ping read/write responsif $< 50$ ms.
2. **Koneksi Redis**: Memverifikasi antrean worker aktif dan tidak ada penumpukan antrean (*stuck queue*).
3. **Penyimpanan Disk**: Memverifikasi ketersediaan ruang simpan direktori `storage/app/private` (peringatan jika kapasitas terpakai $> 85\%$).
4. **Respon Format**:
```json
{
  "status": "healthy",
  "checks": {
    "database": "UP",
    "redis": "UP",
    "storage": "UP (Available: 42 GB)"
  },
  "timestamp": "2026-10-01T15:30:00+08:00"
}
```
