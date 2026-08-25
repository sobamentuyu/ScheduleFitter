<?php
// すべてのエラーを捕捉して JSON で返す設定
ini_set('display_errors', '0');
error_reporting(E_ALL);

// 1. CORS ヘッダー
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-Dev-User-Email');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

// OPTIONS（プリフライト）の即時終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 2. セッションの開始
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400 * 7,
        'path'     => '/',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

try {
    // 3. ヘッダーからメールアドレスを取得
    $email = $_SERVER['HTTP_CF_ACCESS_AUTHENTICATED_USER_EMAIL'] 
          ?? $_SERVER['HTTP_X_DEV_USER_EMAIL'] 
          ?? null;

    if (!$email) {
        http_response_code(401);
        echo json_encode([
            'error' => true,
            'message' => 'Unauthorized: メールアドレスヘッダーがありません'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 4. PostgreSQL へ接続
    $host     = getenv('DB_HOST') ?: 'db';
    $port     = getenv('DB_PORT') ?: '5432';
    $dbName   = getenv('DB_DATABASE') ?: 'schedulefitter';
    $user     = getenv('DB_USERNAME') ?: 'postgres';
    $password = getenv('DB_PASSWORD') ?: 'password';

    $dsn = "pgsql:host={$host};port={$port};dbname={$dbName}";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 5. ユーザー検索（カラム名を userid に修正）
    $stmt = $pdo->prepare('SELECT id, email, userid FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $dbUser = $stmt->fetch();

    // 存在しない場合は新規登録（カラム名を userid に修正）
    if (!$dbUser) {
        $defaultUserId = explode('@', $email)[0];
        $insertStmt = $pdo->prepare(
            'INSERT INTO users (email, userid) VALUES (:email, :userid) RETURNING id, email, userid'
        );
        $insertStmt->execute([
            ':email'  => $email,
            ':userid' => $defaultUserId
        ]);
        $dbUser = $insertStmt->fetch();
    }

    $userData = [
        'id'     => (int)$dbUser['id'],
        'email'  => $dbUser['email'],
        'userId' => $dbUser['userid']
    ];

    // セッションに保存
    $_SESSION['user'] = $userData;

    echo json_encode([
        'error' => false,
        'message' => 'ログイン成功',
        'user' => $userData
    ], JSON_UNESCAPED_UNICODE);

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'サーバー内部エラー: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}