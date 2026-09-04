<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Http\ScheduleSuggestionPayload;
use App\Services\GeminiService;
use InvalidArgumentException;
use RuntimeException;

final class ScheduleSuggestionController
{
    public function __construct(
        private readonly GeminiService $gemini = new GeminiService(),
    ) {}

    public function create(Request $request): void
    {
        try {
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
                ),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

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
