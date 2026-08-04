<?php
require_once __DIR__ . '/../vendor/autoload.php';

// CORSヘッダーの設定（フロントエンドからのリクエスト許可）
header("Access-Control-Allow-Origin: *"); // 本番環境ではCloudflare Pagesのドメインを指定
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ルーティング処理やコントローラーの呼び出しを実施