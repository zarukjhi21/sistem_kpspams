FROM php:8.3-apache

# Konfigurasi Apache DocumentRoot ke folder public Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && a2enmod rewrite headers

# Install ekstensi sistem dan dependensi PHP (PostgreSQL, SQLite, GD, Zip, BCMath, Opcache)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libpq-dev \
    libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        pdo_sqlite \
        bcmath \
        gd \
        zip \
        opcache \
        pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Salin seluruh kode backend
COPY . /var/www/html

# Install dependensi produksi tanpa dev
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Berikan izin eksekusi pada entrypoint dan akses write untuk storage
RUN chmod +x /var/www/html/docker-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80 10000

ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]
