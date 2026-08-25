<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

final class EventRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function findAll(int $userId, ?string $from = null, ?string $to = null): array
    {
        $sql = 'SELECT * FROM events WHERE user_id = :user_id';
        $params = ['user_id' => $userId];

        if ($from !== null && $from !== '') {
            $sql .= ' AND end_at >= :from';
            $params['from'] = $from;
        }
        if ($to !== null && $to !== '') {
            $sql .= ' AND start_at <= :to';
            $params['to'] = $to;
        }

        $sql .= ' ORDER BY start_at ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $id, int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM events WHERE id = :id AND user_id = :user_id'
        );
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO events (user_id, title, description, location, category, start_at, end_at, all_day)
             VALUES (:user_id, :title, :description, :location, :category, :start_at, :end_at, :all_day)
             RETURNING *'
        );
        $stmt->execute([
            'user_id' => $data['user_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'location' => $data['location'] ?? null,
            'category' => $data['category'] ?? null,
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'],
            'all_day' => ($data['all_day'] ?? false) ? 't' : 'f',
        ]);

        return $stmt->fetch();
    }

    public function update(int $id, int $userId, array $data): ?array
    {
        $existing = $this->findById($id, $userId);
        if ($existing === null) {
            return null;
        }

        $merged = [
            'title' => $data['title'] ?? $existing['title'],
            'description' => array_key_exists('description', $data) ? $data['description'] : $existing['description'],
            'location' => array_key_exists('location', $data) ? $data['location'] : $existing['location'],
            'category' => array_key_exists('category', $data) ? $data['category'] : $existing['category'],
            'start_at' => $data['start_at'] ?? $existing['start_at'],
            'end_at' => $data['end_at'] ?? $existing['end_at'],
            'all_day' => array_key_exists('all_day', $data)
                ? (($data['all_day']) ? 't' : 'f')
                : ($existing['all_day'] ? 't' : 'f'),
        ];

        $stmt = $this->pdo->prepare(
            'UPDATE events
             SET title = :title,
                 description = :description,
                 location = :location,
                 category = :category,
                 start_at = :start_at,
                 end_at = :end_at,
                 all_day = :all_day,
                 updated_at = NOW()
             WHERE id = :id AND user_id = :user_id
             RETURNING *'
        );
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            ...$merged,
        ]);

        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM events WHERE id = :id AND user_id = :user_id'
        );
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        return $stmt->rowCount() > 0;
    }
}
