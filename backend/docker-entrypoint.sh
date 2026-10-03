#!/bin/sh
set -e

# Sesuaikan port Apache dengan variabel $PORT dari cloud provider (Render, Koyeb, dll)
PORT_HTTP="${PORT:-80}"
echo "Configuring Apache to listen on port: $PORT_HTTP"
sed -i "s/Listen 80/Listen $PORT_HTTP/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:$PORT_HTTP>/g" /etc/apache2/sites-available/000-default.conf

# Pastikan direktori storage dan cache tersedia dan memiliki izin tulis
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Bersihkan dan optimalkan cache Laravel
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Jalankan migrasi database otomatis saat deploy
if [ -n "$DB_HOST" ] || [ "$DB_CONNECTION" = "sqlite" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration skipped or failed"
fi

echo "Starting Apache web server..."
exec apache2-foreground
