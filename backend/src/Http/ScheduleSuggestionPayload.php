<?php
namespace App\Http;

use InvalidArgumentException;

final class ScheduleSuggestionPayload
{
    public const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

    /** @var list<string> */
    public const IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
    ];

    /**
     * @param array<string, mixed> $body
     * @param array<string, mixed> $files
     * @return array{kind: 'text', request: string}|array{kind: 'image', mimeType: string, bytes: string, request: string}
     */
    public static function parse(array $body, array $files = []): array
    {
        $request = isset($body['request']) && is_string($body['request'])
            ? trim($body['request'])
            : '';

        if (mb_strlen($request) > 4_000) {
            throw new InvalidArgumentException('request must be 4000 characters or fewer.');
        }

        if (isset($files['image']) && is_array($files['image'])) {
            $image = self::parseImage($files['image']);
            $image['request'] = $request;
            return $image;
        }

        if ($request === '') {
            throw new InvalidArgumentException('request or image is required.');
        }

        return [
            'kind' => 'text',
            'request' => $request,
        ];
    }

    /**
     * @param array<string, mixed> $file
     * @return array{kind: 'image', mimeType: string, bytes: string}
     */
    private static function parseImage(array $file): array
    {
        $error = isset($file['error']) && is_int($file['error'])
            ? $file['error']
            : UPLOAD_ERR_NO_FILE;

        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new InvalidArgumentException('request or image is required.');
        }

        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            throw new InvalidArgumentException('image must be 8MB or smaller.');
        }

        if ($error !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('image upload failed.');
        }

        $tmpName = isset($file['tmp_name']) && is_string($file['tmp_name'])
            ? $file['tmp_name']
            : '';

        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new InvalidArgumentException('image upload is invalid.');
        }

        $size = isset($file['size']) && is_int($file['size'])
            ? $file['size']
            : (int) filesize($tmpName);

        if ($size > self::IMAGE_MAX_BYTES) {
            throw new InvalidArgumentException('image must be 8MB or smaller.');
        }

        $bytes = file_get_contents($tmpName);
        if ($bytes === false || $bytes === '') {
            throw new InvalidArgumentException('image upload is invalid.');
        }

        if (strlen($bytes) > self::IMAGE_MAX_BYTES) {
            throw new InvalidArgumentException('image must be 8MB or smaller.');
        }

        $mimeType = self::detectMimeType($tmpName);
        if (!in_array($mimeType, self::IMAGE_MIME_TYPES, true)) {
            throw new InvalidArgumentException('image type is not supported.');
        }

        return [
            'kind' => 'image',
            'mimeType' => $mimeType,
            'bytes' => $bytes,
        ];
    }

    private static function detectMimeType(string $path): string
    {
        if (!class_exists(\finfo::class)) {
            throw new InvalidArgumentException('image type could not be determined.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($path);

        return is_string($mimeType) ? strtolower($mimeType) : '';
    }
}
