<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Http\ScheduleSuggestionPayload;
use App\Services\GeminiService;
use InvalidArgumentException;
use App\Http\ScheduleSuggestionValidator;
use RuntimeException;

final class ScheduleSuggestionController
{
    private const IMAGE_USER_PROMPT = 'この画像から予定情報だけを抽出してください';

    public function __construct(
        private readonly GeminiService $gemini = new GeminiService(),
    ) {}

    private function requireUserId(): ?int
    {
        $sessionUser = $_SESSION['user'] ?? null;

        if (is_array($sessionUser) && isset($sessionUser['id']) && (int) $sessionUser['id'] >= 1) {
            return (int) $sessionUser['id'];
        }

        Response::error('ログインが必要です', 401);
        return null;
    }

    public function create(Request $request): void
    {
        try {
            $userId = $this->requireUserId();
            if ($userId === null) {
                return;
            }

            $payload = ScheduleSuggestionPayload::parse($request->body, $request->files);
            $instructionPath = dirname(__DIR__) . '/Prompts/order.txt';
            $systemInstruction = file_get_contents($instructionPath);

            if ($systemInstruction === false || trim($systemInstruction) === '') {
                throw new RuntimeException('Gemini instruction file could not be loaded.');
            }

            $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Tokyo'));

            $systemInstruction .= "\n\nTrusted reference context:\n"
                . 'reference_datetime: ' . $now->format(\DateTimeInterface::ATOM) . "\n"
                . "timezone: Asia/Tokyo\n";

            $generationConfig = [
                'responseMimeType' => 'application/json',
            ];

            if ($payload['kind'] === 'image') {
                $rawSuggestion = $this->gemini->generateFromParts(
                    [
                        ['text' => self::IMAGE_USER_PROMPT],
                        ['inlineData' => [
                            'mimeType' => $payload['mimeType'],
                            'data' => base64_encode($payload['bytes']),
                        ]],
                    ],
                    $systemInstruction,
                    $generationConfig,
                );
            } else {
                $rawSuggestion = $this->gemini->generateText(
                    $payload['request'],
                    $systemInstruction,
                    $generationConfig,
                );
            }

            $suggestion = json_decode(
                $rawSuggestion,
                true,
                512,
                JSON_THROW_ON_ERROR
            );
            $suggestion = ScheduleSuggestionValidator::validate($suggestion);
            Response::json([
                'suggestion' => $suggestion,
            ]);
        } catch (InvalidArgumentException $exception) {
            Response::error($exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            Response::error('Unable to generate a schedule suggestion.', 502, [
                'detail' => $exception->getMessage(),
            ]);
        } catch (\JsonException $exception) {
            Response::error('Unable to generate a schedule suggestion.', 502, [
                'detail' => $exception->getMessage(),
            ]);
        }
    }
}
