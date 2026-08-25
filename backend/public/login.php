<?php
// CORS ヘッダー
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, X-Dev-User-Email');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

// プリフライトリクエストの即時終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

try {
    // 1. ヘッダーからメールアドレスを抽出
    $email = $_SERVER['HTTP_CF_ACCESS_AUTHENTICATED_USER_EMAIL'] 
          ?? $_SERVER['HTTP_X_DEV_USER_EMAIL'] 
          ?? null;

    if (!$email) {
        http_response_code(401);
        echo json_encode([
            'error' => true,
            'message' => 'Unauthorized: 認証ヘッダー（メールアドレス）が存在しません。'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. PostgreSQL への接続
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

    // 3. DBからユーザーを検索
    $stmt = $pdo->prepare('SELECT id, email, name FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $dbUser = $stmt->fetch();

    // 4. ユーザーが存在しない場合は新規登録（初回ログイン時の自動プロビジョニング）
    if (!$dbUser) {
        $defaultName = explode('@', $email)[0];
        $insertStmt = $pdo->prepare(
            'INSERT INTO users (email, name) VALUES (:email, :name) RETURNING id, email, name'
        );
        $insertStmt->execute([
            ':email' => $email,
            ':name'  => $defaultName
        ]);
        $dbUser = $insertStmt->fetch();
    }

    // 5. DBのユーザー情報をフロントエンドへ返却
    echo json_encode([
        'error' => false,
        'message' => '認証・DB照合に成功しました',
        'user' => [
            'id'    => (int)$dbUser['id'],
            'email' => $dbUser['email'],
            'name'  => $dbUser['name']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'データベース接続エラー: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'サーバーエラー: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}