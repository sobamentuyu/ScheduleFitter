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

            $payload = ScheduleSuggestionPayload::parse($request->body);
            $instructionPath = dirname(__DIR__) . '/Prompts/order.txt';
            $systemInstruction = file_get_contents($instructionPath);

            if ($systemInstruction === false || trim($systemInstruction) === '') {
                throw new RuntimeException('Gemini instruction file could not be loaded.');
            }

            $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Tokyo'));

            $systemInstruction .= "\n\nTrusted reference context:\n"
                . 'reference_datetime: ' . $now->format(\DateTimeInterface::ATOM) . "\n"
                . "timezone: Asia/Tokyo\n";
            $suggestion = json_decode(
                $this->gemini->generateText(
                    $payload['request'],
                    $systemInstruction,
                    [
                        'responseMimeType' => 'application/json',
                        'responseSchema' => [
                            'type' => 'OBJECT',
                            'propertyOrdering' => ['event', 'missing_fields'],
                            'properties' => [
                                'event' => [
                                    'type' => 'OBJECT',
                                    'propertyOrdering' => [
                                        'title', 'description', 'location', 'category',
                                        'start_at', 'end_at', 'all_day',
                                    ],
                                    'properties' => [
                                        'title' => ['type' => 'STRING'],
                                        'description' => ['type' => 'STRING', 'nullable' => true],
                                        'location' => ['type' => 'STRING', 'nullable' => true],
                                        'category' => ['type' => 'STRING', 'nullable' => true],
                                        'start_at' => ['type' => 'STRING', 'nullable' => true],
                                        'end_at' => ['type' => 'STRING', 'nullable' => true],
                                        'all_day' => ['type' => 'BOOLEAN'],
                                    ],
                                    'required' => [
                                        'title', 'description', 'location', 'category',
                                        'start_at', 'end_at', 'all_day',
                                    ],
                                ],
                                'missing_fields' => [
                                    'type' => 'ARRAY',
                                    'items' => [
                                        'type' => 'STRING',
                                        'enum' => ['title', 'date', 'start_at', 'end_at'],
                                    ],
                                ],
                            ],
                            'required' => ['event', 'missing_fields'],
                        ],
                    ],
                ),
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
        }
    }

}
