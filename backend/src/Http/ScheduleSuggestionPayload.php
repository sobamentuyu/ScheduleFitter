<?php
namespace App\Http;

use InvalidArgumentException;

final class ScheduleSuggestionPayload
{
    /**
     * @param array<string, mixed> $body
     * @return array{request: string}
     */
    public static function parse(array $body): array
    {
        $request = isset($body['request']) && is_string($body['request'])
            ? trim($body['request'])
            : '';

        if ($request === '') {
            throw new InvalidArgumentException('request is required.');
        }

        if (mb_strlen($request) > 4_000) {
            throw new InvalidArgumentException('request must be 4000 characters or fewer.');
        }

        return ['request' => $request];
    }
}
