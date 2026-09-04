FROM php:8.3-apache

# PostgreSQL接続用ライブラリおよびツール類のインストール
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libcurl4-openssl-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql curl

# ドキュメントルートを public/ に変更
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf

# mod_rewriteの有効化 + .htaccess を許可
RUN a2enmod rewrite headers \
    && printf '%s\n' \
      '<Directory /var/www/html/public>' \
      '    AllowOverride All' \
      '    Require all granted' \
      '</Directory>' \
      > /etc/apache2/conf-available/allow-override.conf \
    && a2enconf allow-override

# Composerの導入
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Composerの依存関係インストール
COPY composer.* ./
RUN composer install --no-interaction --optimize-autoloader || true
