<?php
namespace App\Http;

use DateTimeImmutable;
use InvalidArgumentException;

final class EventPayload
{
    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public static function parse(array $body, bool $requireAll): array
    {
        $data = [];

        if ($requireAll || array_key_exists('title', $body)) {
            $title = isset($body['title']) ? trim((string) $body['title']) : '';
            if ($title === '') {
                throw new InvalidArgumentException('タイトルは必須です');
            }
            if (mb_strlen($title) > 255) {
                throw new InvalidArgumentException('タイトルは255文字以内です');
            }
            $data['title'] = $title;
        }

        foreach (['description', 'location', 'category'] as $field) {
            if (array_key_exists($field, $body)) {
                $value = $body[$field];
                if ($value === null || $value === '') {
                    $data[$field] = null;
                } else {
                    $data[$field] = trim((string) $value);
                }
            }
        }

        if ($requireAll || array_key_exists('start_at', $body) || array_key_exists('start', $body)) {
            $startAt = self::parseDateTime($body['start_at'] ?? $body['start'] ?? null);
            if ($startAt === null) {
                throw new InvalidArgumentException('開始日時の形式が正しくありません');
            }
            $data['start_at'] = $startAt;
        }

        if ($requireAll || array_key_exists('end_at', $body) || array_key_exists('end', $body)) {
            $endAt = self::parseDateTime($body['end_at'] ?? $body['end'] ?? null);
            if ($endAt === null) {
                throw new InvalidArgumentException('終了日時の形式が正しくありません');
            }
            $data['end_at'] = $endAt;
        }

        if (isset($data['start_at'], $data['end_at']) && $data['end_at'] < $data['start_at']) {
            throw new InvalidArgumentException('終了は開始以降にしてください');
        }

        if (array_key_exists('all_day', $body) || array_key_exists('allDay', $body)) {
            $data['all_day'] = (bool) ($body['all_day'] ?? $body['allDay']);
        } elseif ($requireAll) {
            $data['all_day'] = false;
        }

        return $data;
    }

    private static function parseDateTime(mixed $value): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return (new DateTimeImmutable($value))->format(DateTimeImmutable::ATOM);
        } catch (\Exception) {
            return null;
        }
    }
}
