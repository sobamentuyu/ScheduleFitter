<?php
namespace App\Http;

use InvalidArgumentException;

final class ScheduleSuggestionApprovePayload
{
    /**
     * @param array<string, mixed> $body
     * @return array{
     *   creates: list<array<string, mixed>>,
     *   updates: list<array{id: int, start_at: string, end_at: string, all_day: bool}>,
     *   deletes: list<int>
     * }
     */
    public static function parse(array $body): array
    {
        $createsRaw = $body['creates'] ?? null;
        $updatesRaw = $body['updates'] ?? null;
        $deletesRaw = $body['deletes'] ?? [];

        if (!is_array($createsRaw) || !array_is_list($createsRaw)) {
            throw new InvalidArgumentException('creates must be a list.');
        }
        if (!is_array($updatesRaw) || !array_is_list($updatesRaw)) {
            throw new InvalidArgumentException('updates must be a list.');
        }
        if (!is_array($deletesRaw) || !array_is_list($deletesRaw)) {
            throw new InvalidArgumentException('deletes must be a list.');
        }
        if ($createsRaw === [] && $updatesRaw === [] && $deletesRaw === []) {
            throw new InvalidArgumentException('追加する予定がありません');
        }

        $creates = [];
        foreach ($createsRaw as $index => $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException("creates[{$index}] must be an object.");
            }
            $creates[] = EventPayload::parse($item, requireAll: true);
        }

        $updates = [];
        $updateIds = [];
        foreach ($updatesRaw as $index => $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException("updates[{$index}] must be an object.");
            }

            $id = $item['id'] ?? null;
            if ($id === null || !ctype_digit((string) $id) || (int) $id < 1) {
                throw new InvalidArgumentException("updates[{$index}].id が不正です");
            }

            $payload = EventPayload::parse($item, requireAll: false);
            if (!isset($payload['start_at'], $payload['end_at'])) {
                throw new InvalidArgumentException("updates[{$index}] の開始・終了は必須です");
            }

            $eventId = (int) $id;
            $updateIds[$eventId] = true;
            $updates[] = [
                'id' => $eventId,
                'start_at' => $payload['start_at'],
                'end_at' => $payload['end_at'],
                'all_day' => (bool) ($payload['all_day'] ?? false),
            ];
        }

        $deletes = [];
        $deleteIds = [];
        foreach ($deletesRaw as $index => $id) {
            if ($id === null || !ctype_digit((string) $id) || (int) $id < 1) {
                throw new InvalidArgumentException("deletes[{$index}] が不正です");
            }
            $eventId = (int) $id;
            if (isset($updateIds[$eventId])) {
                throw new InvalidArgumentException("deletes[{$index}] は更新対象と重複しています");
            }
            if (isset($deleteIds[$eventId])) {
                continue;
            }
            $deleteIds[$eventId] = true;
            $deletes[] = $eventId;
        }

        return [
            'creates' => $creates,
            'updates' => $updates,
            'deletes' => $deletes,
        ];
    }
}
