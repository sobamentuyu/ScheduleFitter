<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Repositories\EventRepository;

$pdo = Database::getConnection();
$pdo->beginTransaction();
try {
    // Shadow the real table for this connection; no existing events are changed.
    $pdo->exec('CREATE TEMP TABLE events (LIKE public.events INCLUDING DEFAULTS) ON COMMIT DROP');
    $insert = $pdo->prepare('INSERT INTO events
        (id, user_id, title, start_at, end_at, all_day)
        VALUES (:id, :user, :title, :start, :end, :all_day)');
    foreach ([
        [1, 1, 'Meeting', '2026-09-15T10:00:00+09:00', '2026-09-15T11:00:00+09:00', 'false'],
        [2, 2, 'Other user', '2026-09-15T10:00:00+09:00', '2026-09-15T11:00:00+09:00', 'false'],
        [3, 1, 'Overnight', '2026-09-16T23:00:00+09:00', '2026-09-17T01:00:00+09:00', 'false'],
        [4, 1, 'All day', '2026-09-18T00:00:00+09:00', '2026-09-19T00:00:00+09:00', 'true'],
    ] as [$id, $user, $title, $start, $end, $allDay]) {
        $insert->execute(['id' => $id, 'user' => $user, 'title' => $title,
            'start' => $start, 'end' => $end, 'all_day' => $allDay]);
    }
    $repository = new EventRepository($pdo);
    $cases = [
        ['overlap', 1, '2026-09-15T10:30:00+09:00', '2026-09-15T11:30:00+09:00', [1]],
        ['same interval', 1, '2026-09-15T10:00:00+09:00', '2026-09-15T11:00:00+09:00', [1]],
        ['contains', 1, '2026-09-15T09:00:00+09:00', '2026-09-15T12:00:00+09:00', [1]],
        ['contained', 1, '2026-09-15T10:15:00+09:00', '2026-09-15T10:45:00+09:00', [1]],
        ['touches end', 1, '2026-09-15T11:00:00+09:00', '2026-09-15T12:00:00+09:00', []],
        ['touches start', 1, '2026-09-15T09:00:00+09:00', '2026-09-15T10:00:00+09:00', []],
        ['separate', 1, '2026-09-15T12:00:00+09:00', '2026-09-15T13:00:00+09:00', []],
        ['user isolation', 2, '2026-09-15T10:30:00+09:00', '2026-09-15T11:30:00+09:00', [2]],
        ['no user events', 3, '2026-09-15T10:30:00+09:00', '2026-09-15T11:30:00+09:00', []],
        ['overnight', 1, '2026-09-17T00:00:00+09:00', '2026-09-17T02:00:00+09:00', [3]],
        ['all day', 1, '2026-09-18T12:00:00+09:00', '2026-09-18T13:00:00+09:00', [4]],
        ['timezone', 1, '2026-09-15T01:30:00Z', '2026-09-15T02:30:00Z', [1]],
    ];
    foreach ($cases as [$name, $userId, $start, $end, $expected]) {
        $rows = $repository->findScheduleConflicts($userId, $start, $end);
        $actual = array_map('intval', array_column($rows, 'id'));
        if ($actual !== $expected) {
            throw new RuntimeException($name . ': unexpected conflicts ' . json_encode($actual));
        }
    }
    echo count($cases) . " schedule conflict database tests passed.\n";
} finally {
    $pdo->rollBack();
}
