<?php
namespace App\Config;

use PDO;
use PDOException;

class Database {
    public static function getConnection(): PDO {
        // Docker環境かどうかで設定値を切り替え
        if (getenv('IS_DOCKER') === 'true') {
            $host = 'db';
            $port = '5432';
            $db   = 'schedulefitter';
            $user = 'postgres';
            $pass = 'password';
        } else {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '5432';
            $db   = getenv('DB_DATABASE') ?: 'schedulefitter';
            $user = getenv('DB_USERNAME') ?: 'postgres';
            $pass = getenv('DB_PASSWORD') ?: 'password';
        }

        $dsn = "pgsql:host={$host};port={$port};dbname={$db}";

        try {
            return new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }
}