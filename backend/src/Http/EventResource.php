<?php
namespace App\Http;

use DateTimeImmutable;

final class EventResource
{
    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function from(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'location' => $row['location'],
            'category' => $row['category'],
            'start_at' => self::toIso($row['start_at']),
            'end_at' => self::toIso($row['end_at']),
            'all_day' => filter_var($row['all_day'], FILTER_VALIDATE_BOOLEAN),
            'created_at' => self::toIso($row['created_at'] ?? null),
            'updated_at' => self::toIso($row['updated_at'] ?? null),
            'start' => self::toIso($row['start_at']),
            'end' => self::toIso($row['end_at']),
            'allDay' => filter_var($row['all_day'], FILTER_VALIDATE_BOOLEAN),
        ];
    }

    private static function toIso(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        try {
            return (new DateTimeImmutable((string) $value))->format(DateTimeImmutable::ATOM);
        } catch (\Exception) {
            return (string) $value;
        }
    }
}
