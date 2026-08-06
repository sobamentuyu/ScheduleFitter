FROM php:8.3-apache

# PostgreSQL接続用ライブラリおよびツール類のインストール
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql

# ドキュメントルートを public/ に変更
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf

# mod_rewriteの有効化
RUN a2enmod rewrite

# Composerの導入
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Composerの依存関係インストール
COPY composer.* ./
RUN composer install --no-interaction --optimize-autoloader || true