<?php
namespace App\Controllers;

use App\Http\EventResource;
use App\Http\Request;
use App\Http\Response;
use App\Http\ScheduleSuggestionApprovePayload;
use App\Http\ScheduleSuggestionPayload;
use App\Http\ScheduleSuggestionValidator;
use App\Repositories\EventRepository;
use App\Services\GeminiService;
use DateTimeImmutable;
use InvalidArgumentException;
use RuntimeException;

final class ScheduleSuggestionController
{
    private const IMAGE_USER_PROMPT = 'この画像から予定情報だけを抽出してください';
    private const IMAGE_AND_TEXT_USER_PROMPT = '次の画像とテキストから予定情報だけを抽出してください。テキストは画像を補う追加情報です。';

    public function __construct(
        private readonly GeminiService $gemini = new GeminiService(),
        private readonly ?EventRepository $repository = null,
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

            $now = new DateTimeImmutable('now', new \DateTimeZone('Asia/Tokyo'));

            $systemInstruction .= "\n\nTrusted reference context:\n"
                . 'reference_datetime: ' . $now->format(\DateTimeInterface::ATOM) . "\n"
                . "timezone: Asia/Tokyo\n";

            $generationConfig = [
                'responseMimeType' => 'application/json',
            ];

            if ($payload['kind'] === 'image') {
                $parts = $payload['request'] !== ''
                    ? [
                        ['text' => self::IMAGE_AND_TEXT_USER_PROMPT],
                        ['text' => $payload['request']],
                        ['inlineData' => [
                            'mimeType' => $payload['mimeType'],
                            'data' => base64_encode($payload['bytes']),
                        ]],
                    ]
                    : [
                        ['text' => self::IMAGE_USER_PROMPT],
                        ['inlineData' => [
                            'mimeType' => $payload['mimeType'],
                            'data' => base64_encode($payload['bytes']),
                        ]],
                    ];

                $rawSuggestion = $this->gemini->generateFromParts(
                    $parts,
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

            $repository = $this->repository;
            foreach ($suggestion['events'] as $index => $event) {
                $suggestion['events'][$index]['conflicts'] = null;
                if ($event['start_at'] === null || $event['end_at'] === null) {
                    continue;
                }

                $repository ??= new EventRepository();
                $conflicts = $repository->findConflictingEvents(
                    $userId,
                    $event['start_at'],
                    $event['end_at'],
                );

                $normalizedConflicts = array_map(
                    EventResource::conflictFrom(...),
                    $conflicts,
                );
                $suggestion['events'][$index]['conflicts'] = $normalizedConflicts;

                if ($normalizedConflicts !== []) {
                    $suggestion['events'][$index]['status'] = 'needs_clarification';
                }
            }
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

    public function approve(Request $request): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        $repository = $this->repository ?? new EventRepository();

        try {
            $payload = ScheduleSuggestionApprovePayload::parse($request->body);
            $repository->beginTransaction();

            foreach ($payload['deletes'] as $deleteId) {
                if (!$repository->delete($deleteId, $userId)) {
                    throw new InvalidArgumentException('削除対象の予定が見つかりません');
                }
            }

            foreach ($payload['updates'] as $update) {
                $row = $repository->update($update['id'], $userId, [
                    'start_at' => $update['start_at'],
                    'end_at' => $update['end_at'],
                    'all_day' => $update['all_day'],
                ]);
                if ($row === null) {
                    throw new InvalidArgumentException('更新対象の予定が見つかりません');
                }
            }

            foreach ($payload['updates'] as $update) {
                $conflicts = $repository->findConflictingEvents(
                    $userId,
                    $update['start_at'],
                    $update['end_at'],
                    [$update['id']],
                );
                if ($conflicts !== []) {
                    throw new InvalidArgumentException('既存の予定と時間が重なっています');
                }
            }

            $creates = $payload['creates'];
            for ($i = 0, $count = count($creates); $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    if ($this->timeRangesConflict(
                        $creates[$i]['start_at'],
                        $creates[$i]['end_at'],
                        $creates[$j]['start_at'],
                        $creates[$j]['end_at'],
                    )) {
                        throw new InvalidArgumentException('追加する予定同士の時間が重なっています');
                    }
                }
            }

            $created = [];
            foreach ($creates as $create) {
                $conflicts = $repository->findConflictingEvents(
                    $userId,
                    $create['start_at'],
                    $create['end_at'],
                );
                if ($conflicts !== []) {
                    throw new InvalidArgumentException('既存の予定と時間が重なっています');
                }

                $create['user_id'] = $userId;
                $created[] = EventResource::from($repository->create($create));
            }

            $repository->commit();
            Response::json([
                'created' => $created,
                'updated_count' => count($payload['updates']),
                'deleted_count' => count($payload['deletes']),
            ], 201);
        } catch (InvalidArgumentException $exception) {
            $repository->rollBack();
            Response::error($exception->getMessage(), 422);
        } catch (\Throwable $exception) {
            $repository->rollBack();
            Response::error('予定の保存に失敗しました', 500, [
                'detail' => $exception->getMessage(),
            ]);
        }
    }

    private function timeRangesConflict(
        string $startA,
        string $endA,
        string $startB,
        string $endB,
    ): bool {
        $aStart = new DateTimeImmutable($startA);
        $aEnd = new DateTimeImmutable($endA);
        $bStart = new DateTimeImmutable($startB);
        $bEnd = new DateTimeImmutable($endB);

        return $aStart < $bEnd && $aEnd > $bStart;
    }
}
