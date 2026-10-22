<?php
namespace App\Http;

use InvalidArgumentException;

final class EventConflictCheckPayload
{
    /**
     * @param array<string, mixed> $body
     * @return array{start_at: string, end_at: string, exclude_ids: list<int>}
     */
    public static function parse(array $body): array
    {
        $payload = EventPayload::parse($body, requireAll: false);
        if (!isset($payload['start_at'], $payload['end_at'])) {
            throw new InvalidArgumentException('開始・終了は必須です');
        }

        $excludeRaw = $body['exclude_ids'] ?? [];
        if (!is_array($excludeRaw) || !array_is_list($excludeRaw)) {
            throw new InvalidArgumentException('exclude_ids must be a list.');
        }

        $excludeIds = [];
        foreach ($excludeRaw as $index => $id) {
            if ($id === null || !ctype_digit((string) $id) || (int) $id < 1) {
                throw new InvalidArgumentException("exclude_ids[{$index}] が不正です");
            }
            $excludeIds[] = (int) $id;
        }

        return [
            'start_at' => $payload['start_at'],
            'end_at' => $payload['end_at'],
            'exclude_ids' => $excludeIds,
        ];
    }
}
