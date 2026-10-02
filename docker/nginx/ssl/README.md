# SSL Certificate Directory for SI-KPSPAMS Nginx

Letakkan sertifikat SSL domain produksi (`kpspams.desakuajang.id`) di direktori ini sebelum mengaktifkan konfigurasi HTTPS:

- `fullchain.pem` : Sertifikat publik beserta chain intermediate (dari Let's Encrypt / Certbot)
- `privkey.pem`   : Kunci privat RSA/ECDSA tanpa password

### Opsi 1: Otomasi Certbot / Let's Encrypt (Direkomendasikan di VPS Ubuntu/Debian)
```bash
sudo certbot certonly --standalone -d kpspams.desakuajang.id
sudo cp /etc/letsencrypt/live/kpspams.desakuajang.id/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/kpspams.desakuajang.id/privkey.pem docker/nginx/ssl/
```

### Opsi 2: Self-Signed Certificate (Khusus Staging / Uji Coba Internal)
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/privkey.pem \
  -out docker/nginx/ssl/fullchain.pem \
  -subj "/C=ID/ST=Sulawesi Barat/L=Polewali Mandar/O=Desa Kuajang/CN=kpspams.desakuajang.id"
```
