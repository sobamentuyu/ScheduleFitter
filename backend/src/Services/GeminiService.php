<?php
namespace App\Services;

use RuntimeException;

/**
 * Small REST client for Gemini's generateContent endpoint.
 *
 * The API key is intentionally read only on the server, from GEMINI_API_KEY.
 */
final class GeminiService
{
    private const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

    private readonly string $apiKey;
    private readonly string $model;
    private readonly int $timeoutSeconds;

    public function __construct(
        ?string $apiKey = null,
        ?string $model = null,
        ?int $timeoutSeconds = null,
    ) {
        $this->apiKey = trim($apiKey ?? (getenv('GEMINI_API_KEY') ?: ''));
        $this->model = trim($model ?? (getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash'));
        $this->timeoutSeconds = $timeoutSeconds ?? $this->readTimeout();
    }

    /**
     * Sends a single text prompt and returns the generated text.
     *
     * @param array<string, mixed> $generationConfig Gemini generationConfig values.
     */
    public function generateText(
        string $prompt,
        ?string $systemInstruction = null,
        array $generationConfig = [],
    ): string {
        $prompt = trim($prompt);
        if ($prompt === '') {
            throw new RuntimeException('Gemini prompt must not be empty.');
        }

        $payload = [
            'contents' => [[
                'role' => 'user',
                'parts' => [['text' => $prompt]],
            ]],
        ];

        if ($systemInstruction !== null && trim($systemInstruction) !== '') {
            $payload['systemInstruction'] = [
                'parts' => [['text' => trim($systemInstruction)]],
            ];
        }

        if ($generationConfig !== []) {
            $payload['generationConfig'] = $generationConfig;
        }

        $response = $this->request($payload);
        $parts = $response['candidates'][0]['content']['parts'] ?? null;

        if (!is_array($parts)) {
            $reason = $response['promptFeedback']['blockReason'] ?? null;
            if (is_string($reason)) {
                throw new RuntimeException("Gemini request was blocked: {$reason}.");
            }
            throw new RuntimeException('Gemini returned no text candidate.');
        }

        $text = '';
        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $text .= $part['text'];
            }
        }

        if ($text === '') {
            throw new RuntimeException('Gemini returned an empty text candidate.');
        }

        return $text;
    }

    /** @param array<string, mixed> $payload @return array<string, mixed> */
    private function request(array $payload): array
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('GEMINI_API_KEY is not configured.');
        }
        if ($this->model === '') {
            throw new RuntimeException('GEMINI_MODEL is not configured.');
        }
        if (!function_exists('curl_init')) {
            throw new RuntimeException('PHP cURL extension is required for Gemini API requests.');
        }

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $url = self::API_BASE_URL . rawurlencode($this->model) . ':generateContent';
        $curl = curl_init($url);

        if ($curl === false) {
            throw new RuntimeException('Unable to initialize the Gemini HTTP client.');
        }

        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $this->apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
        ]);

        $body = curl_exec($curl);
        $curlError = curl_error($curl);
        $statusCode = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);

        if ($body === false) {
            throw new RuntimeException('Gemini API request failed: ' . $curlError);
        }

        try {
            $decoded = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new RuntimeException('Gemini API returned invalid JSON.', 0, $exception);
        }

        if ($statusCode < 200 || $statusCode >= 300) {
            $message = is_array($decoded) ? ($decoded['error']['message'] ?? null) : null;
            $suffix = is_string($message) ? ": {$message}" : '';
            throw new RuntimeException("Gemini API request failed with HTTP {$statusCode}{$suffix}");
        }

        if (!is_array($decoded)) {
            throw new RuntimeException('Gemini API returned an unexpected response.');
        }

        return $decoded;
    }

    private function readTimeout(): int
    {
        $value = getenv('GEMINI_API_TIMEOUT_SECONDS');
        if (!is_string($value) || !ctype_digit($value)) {
            return 30;
        }

        return max(1, min((int) $value, 120));
    }
}
