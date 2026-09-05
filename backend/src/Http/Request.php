<?php
namespace App\Http;

final class Request
{
    /**
     * @param array<string, mixed> $query
     * @param array<string, mixed> $body
     * @param array<string, string> $headers
     * @param array<string, mixed> $files
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $body,
        public readonly array $headers = [],
        public readonly array $files = [],
    ) {}

    public static function fromGlobals(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = rtrim($path, '/') ?: '/';

        $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
        $body = [];
        $files = [];

        if (str_contains($contentType, 'multipart/form-data')) {
            $body = is_array($_POST) ? $_POST : [];
            $files = is_array($_FILES) ? $_FILES : [];
        } else {
            $raw = file_get_contents('php://input') ?: '';
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $body = $decoded;
                }
            }
        }

        return new self($method, $path, $_GET, $body, self::headersFromGlobals(), $files);
    }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }
        return null;
    }

    /**
     * @return array<string, string>
     */
    private static function headersFromGlobals(): array
    {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (is_array($headers)) {
                return array_map(strval(...), $headers);
            }
        }

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!is_string($key) || !str_starts_with($key, 'HTTP_') || !is_string($value)) {
                continue;
            }
            $name = str_replace('_', '-', substr($key, 5));
            $headers[$name] = $value;
        }
        return $headers;
    }
}
