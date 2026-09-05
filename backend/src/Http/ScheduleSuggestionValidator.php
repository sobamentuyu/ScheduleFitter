<?php
namespace App\Http;

use DateTimeImmutable;
use UnexpectedValueException;

final class ScheduleSuggestionValidator
{
    private const TOP_LEVEL_KEYS = [
        'events',
    ];

    private const EVENT_KEYS = [
        'title',
        'description',
        'location',
        'category',
        'start_at',
        'end_at',
        'all_day',
        'missing_fields',
    ];

    public static function validate(mixed $data): array
    {
        if (!is_array($data)) {
            throw new UnexpectedValueException(
                'The suggestion must be an array.'
            );
        }

        $data = self::normalize($data);
        unset($data['status']);

        self::validateKeys(
            $data,
            self::TOP_LEVEL_KEYS,
            'response'
        );

        if (!array_is_list($data['events'])) {
            throw new UnexpectedValueException(
                'events must be a list.'
            );
        }

        $events = [];
        $allReady = $data['events'] !== [];

        foreach ($data['events'] as $index => $event) {
            if (!is_array($event)) {
                throw new UnexpectedValueException(
                    "events[{$index}] must be an object."
                );
            }

            if (!array_key_exists('missing_fields', $event)) {
                $event['missing_fields'] = [];
            }

            self::validateKeys(
                $event,
                self::EVENT_KEYS,
                "events[{$index}]"
            );
            self::validateEvent($event, "events[{$index}]");
            self::validateMissingFields($event['missing_fields'], "events[{$index}].missing_fields");

            $hasRequiredFields = trim($event['title']) !== ''
                && $event['start_at'] !== null
                && $event['end_at'] !== null;

            if (!$hasRequiredFields) {
                $allReady = false;
            }

            $events[] = $event;
        }

        return [
            'status' => $allReady ? 'ready' : 'needs_clarification',
            'events' => $events,
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function normalize(array $data): array
    {
        if (isset($data['events'])) {
            return $data;
        }

        if (!isset($data['event']) || !is_array($data['event'])) {
            return $data;
        }

        $event = $data['event'];
        if (!array_key_exists('missing_fields', $event) && isset($data['missing_fields'])) {
            $event['missing_fields'] = $data['missing_fields'];
        }

        return ['events' => [$event]];
    }

    /**
     * @param array<string, mixed> $event
     */
    private static function validateEvent(array $event, string $target): void
    {
        if (!is_string($event['title'])) {
            throw new UnexpectedValueException("{$target}.title must be a string.");
        }

        foreach (['description', 'location', 'category'] as $field) {
            if ($event[$field] !== null && !is_string($event[$field])) {
                throw new UnexpectedValueException(
                    "{$target}.{$field} must be a string or null."
                );
            }
        }

        foreach (['start_at', 'end_at'] as $field) {
            if ($event[$field] !== null) {
                self::validateDateTime($event[$field], "{$target}.{$field}");
            }
        }

        if (!is_bool($event['all_day'])) {
            throw new UnexpectedValueException("{$target}.all_day must be a boolean.");
        }

        if ($event['start_at'] !== null && $event['end_at'] !== null
            && new DateTimeImmutable($event['end_at']) < new DateTimeImmutable($event['start_at'])
        ) {
            throw new UnexpectedValueException(
                "{$target}.end_at must not be earlier than {$target}.start_at."
            );
        }
    }

    private static function validateDateTime(mixed $value, string $field): void
    {
        if (!is_string($value)) {
            throw new UnexpectedValueException("{$field} must be an ISO 8601 string or null.");
        }

        $pattern = '/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$/D';
        if (preg_match($pattern, $value, $matches) !== 1
            || !checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1])
            || (int) $matches[4] > 23
            || (int) $matches[5] > 59
            || (isset($matches[6]) && (int) $matches[6] > 59)
        ) {
            throw new UnexpectedValueException("{$field} must be a valid ISO 8601 datetime.");
        }

        try {
            new DateTimeImmutable($value);
        } catch (\Exception) {
            throw new UnexpectedValueException("{$field} must be a valid ISO 8601 datetime.");
        }
    }

    private static function validateMissingFields(array $missingFields, string $target): void
    {
        foreach ($missingFields as $index => $field) {
            if (!is_string($field) || trim($field) === '') {
                throw new UnexpectedValueException(
                    "{$target}[{$index}] must be a non-empty string."
                );
            }
        }

        if (count(array_unique($missingFields)) !== count($missingFields)) {
            throw new UnexpectedValueException("{$target} must not contain duplicates.");
        }
    }

    /**
     * @param list<string> $expectedKeys
     */
    private static function validateKeys(
        array $data,
        array $expectedKeys,
        string $target
    ): void {
        $actualKeys = array_keys($data);

        $missingKeys = array_diff(
            $expectedKeys,
            $actualKeys
        );

        if ($missingKeys !== []) {
            throw new UnexpectedValueException(
                $target . ' is missing keys: '
                . implode(', ', $missingKeys)
            );
        }

        $unexpectedKeys = array_diff(
            $actualKeys,
            $expectedKeys
        );

        if ($unexpectedKeys !== []) {
            throw new UnexpectedValueException(
                $target . ' has unexpected keys: '
                . implode(', ', $unexpectedKeys)
            );
        }
    }
}
