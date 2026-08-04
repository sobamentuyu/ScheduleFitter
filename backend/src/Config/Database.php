<?php
namespace App\Config;

use PDO;
use PDOException;

class Database {
    public static function getConnection(): PDO {
        $host = getenv('DB_HOST');
        $port = getenv('DB_PORT') ?: '5432';
        $db   = getenv('DB_DATABASE');
        $user = getenv('DB_USERNAME');
        $pass = getenv('DB_PASSWORD');

        $dsn = "pgsql:host={$host};port={$port};dbname={$db};";

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