<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

$dbStatus = '未接続';
$errorMessage = '';

try {
    $pdo = Database::getConnection();
    if ($pdo) {
        $dbStatus = '接続成功';
    }
} catch (\Exception $e) {
    $dbStatus = '接続失敗';
    $errorMessage = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScheduleFitter API Status</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f4f6f8;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .status-ok {
            color: #2e7d32;
            font-weight: bold;
        }
        .status-ng {
            color: #d32f2f;
            font-weight: bold;
        }
        code {
            background: #eee;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>ScheduleFitter Backend</h2>
        <p>PHP Status: <span class="status-ok">動作中 (v<?= phpversion(); ?>)</span></p>
        <p>Database Status: 
            <?php if ($dbStatus === '接続成功'): ?>
                <span class="status-ok">接続成功 (PostgreSQL)</span>
            <?php else: ?>
                <span class="status-ng">接続失敗</span>
            <?php endif; ?>
        </p>
        <?php if ($errorMessage): ?>
            <p style="font-size: 0.85rem; color: #d32f2f;">
                エラー詳細: <code><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8'); ?></code>
            </p>
        <?php endif; ?>
    </div>
</body>
</html>