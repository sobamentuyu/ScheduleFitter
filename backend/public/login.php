<?php
// CORS ヘッダー
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, X-Dev-User-Email');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

// プリフライトリクエスト（OPTIONS）への即時返却
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 1. ヘッダーからメールアドレスを取得
// 本番（Cloudflare Zero Trust）-> 開発用モックヘッダー -> デフォルトの順で判定
$email = $_SERVER['HTTP_CF_ACCESS_AUTHENTICATED_USER_EMAIL'] 
      ?? $_SERVER['HTTP_X_DEV_USER_EMAIL'] 
      ?? null;

// 2. 認証失敗（ヘッダーなし）の判定
if (!$email) {
    http_response_code(401);
    echo json_encode([
        'error' => true,
        'message' => 'Unauthorized: 認証ヘッダーが見つかりません。'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. ユーザー情報の特定・返却（DB接続前の仮モック応答）
$userName = explode('@', $email)[0];

echo json_encode([
    'error' => false,
    'message' => '認証に成功しました',
    'user' => [
        'id' => 1,
        'email' => $email,
        'name' => $userName
    ]
], JSON_UNESCAPED_UNICODE);