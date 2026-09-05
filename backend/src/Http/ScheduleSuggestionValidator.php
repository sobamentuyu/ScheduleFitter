<?php
namespace App\Http;

use DateTimeImmutable;
use UnexpectedValueException;

final class ScheduleSuggestionValidator
{
    private const TOP_LEVEL_KEYS = [
        'status',
        'event',
        'missing_fields',
    ];

    private const EVENT_KEYS = [
        'title',
        'description',
        'location',
        'category',
        'start_at',
        'end_at',
        'all_day',
    ];

    private const STATUSES = [
        'ready',
        'needs_clarification',
    ];

    public static function validate(mixed $data): array
    {
        if (!is_array($data)) {
            throw new UnexpectedValueException(
                'The suggestion must be an array.'
            );
        }

        self::validateKeys(
            $data,
            self::TOP_LEVEL_KEYS,
            'response'
        );

        if (!is_array($data['event'])) {
            throw new UnexpectedValueException(
                'The event must be an array.'
            );
        }

        self::validateKeys(
            $data['event'],
            self::EVENT_KEYS,
            'event'
        );

        if (!is_array($data['missing_fields'])) {
            throw new UnexpectedValueException(
                'missing_fields must be an array.'
            );
        }

        if (!is_string($data['status']) || !in_array($data['status'], self::STATUSES, true)) {
            throw new UnexpectedValueException(
                'status must be ready or needs_clarification.'
            );
        }

        self::validateEvent($data['event']);
        self::validateMissingFields($data['missing_fields']);

        $hasMissingFields = $data['missing_fields'] !== [];
        if ($data['status'] === 'ready' && $hasMissingFields) {
            throw new UnexpectedValueException(
                'ready status cannot have missing_fields.'
            );
        }

        if ($data['status'] === 'needs_clarification' && !$hasMissingFields) {
            throw new UnexpectedValueException(
                'needs_clarification status requires missing_fields.'
            );
        }

        return $data;
    }

    private static function validateEvent(array $event): void
    {
        if (!is_string($event['title'])) {
            throw new UnexpectedValueException('event.title must be a string.');
        }

        foreach (['description', 'location', 'category'] as $field) {
            if ($event[$field] !== null && !is_string($event[$field])) {
                throw new UnexpectedValueException(
                    "event.{$field} must be a string or null."
                );
            }
        }

        foreach (['start_at', 'end_at'] as $field) {
            if ($event[$field] !== null) {
                self::validateDateTime($event[$field], "event.{$field}");
            }
        }

        if (!is_bool($event['all_day'])) {
            throw new UnexpectedValueException('event.all_day must be a boolean.');
        }

        if ($event['start_at'] !== null && $event['end_at'] !== null
            && new DateTimeImmutable($event['end_at']) < new DateTimeImmutable($event['start_at'])
        ) {
            throw new UnexpectedValueException(
                'event.end_at must not be earlier than event.start_at.'
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

    private static function validateMissingFields(array $missingFields): void
    {
        foreach ($missingFields as $index => $field) {
            if (!is_string($field) || trim($field) === '') {
                throw new UnexpectedValueException(
                    "missing_fields[{$index}] must be a non-empty string."
                );
            }
        }

        if (count(array_unique($missingFields)) !== count($missingFields)) {
            throw new UnexpectedValueException('missing_fields must not contain duplicates.');
        }
    }

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
