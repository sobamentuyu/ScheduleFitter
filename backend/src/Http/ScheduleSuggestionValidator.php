<?php
namespace App\Http;

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

        return $data;
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