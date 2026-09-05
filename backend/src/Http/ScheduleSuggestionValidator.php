<?php
namespace App\Http;

use DateTimeImmutable;
use UnexpectedValueException;

final class ScheduleSuggestionValidator
{
    private const ALLOWED_MISSING_FIELDS = [
        'title',
        'date',
        'start_at',
        'end_at',
    ];

    private const TOP_LEVEL_KEYS = [
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

        self::validateEvent($data['event']);
        self::validateMissingFields($data['missing_fields']);
        self::validateConsistency($data['event'], $data['missing_fields']);

        $hasRequiredFields = trim($data['event']['title']) !== ''
            && $data['event']['start_at'] !== null
            && $data['event']['end_at'] !== null;

        $data['status'] = $hasRequiredFields
            ? 'ready'
            : 'needs_clarification';

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

            if (!in_array($field, self::ALLOWED_MISSING_FIELDS, true)) {
                throw new UnexpectedValueException(
                    "missing_fields[{$index}] contains an unsupported field."
                );
            }
        }

        if (count(array_unique($missingFields)) !== count($missingFields)) {
            throw new UnexpectedValueException('missing_fields must not contain duplicates.');
        }
    }

    private static function validateConsistency(array $event, array $missingFields): void
    {
        $hasMissing = static fn (string $field): bool => in_array($field, $missingFields, true);
        $titleMissing = trim($event['title']) === '';

        if ($titleMissing !== $hasMissing('title')) {
            throw new UnexpectedValueException(
                'missing_fields.title must match whether event.title is empty.'
            );
        }

        if ($hasMissing('date')) {
            if ($event['start_at'] !== null || $event['end_at'] !== null
                || $hasMissing('start_at') || $hasMissing('end_at')
            ) {
                throw new UnexpectedValueException(
                    'A missing date requires null datetimes without start_at or end_at markers.'
                );
            }
            return;
        }

        foreach (['start_at', 'end_at'] as $field) {
            if (($event[$field] === null) !== $hasMissing($field)) {
                throw new UnexpectedValueException(
                    "missing_fields.{$field} must match whether event.{$field} is null."
                );
            }
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
