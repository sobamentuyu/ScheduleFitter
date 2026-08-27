<?php
namespace App\Controllers;

use App\Http\EventPayload;
use App\Http\EventResource;
use App\Http\Request;
use App\Http\Response;
use App\Repositories\EventRepository;
use Exception;
use InvalidArgumentException;

final class EventController
{
    public function __construct(
        private readonly EventRepository $repository = new EventRepository(),
    ) {}

    public function index(Request $request): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        $from = $request->query['from'] ?? $request->query['start'] ?? null;
        $to = $request->query['to'] ?? $request->query['end'] ?? null;

        $rows = $this->repository->findAll(
            $userId,
            is_string($from) ? $from : null,
            is_string($to) ? $to : null,
        );

        Response::json(array_map(
            static fn (array $row) => EventResource::from($row),
            $rows,
        ));
    }

    public function show(Request $request, array $params): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        $id = $this->parseId($params['id'] ?? null);
        if ($id === null) {
            Response::error('IDが不正です', 400);
            return;
        }

        $row = $this->repository->findById($id, $userId);
        if ($row === null) {
            Response::error('予定が見つかりません', 404);
            return;
        }

        Response::json(EventResource::from($row));
    }

    public function store(Request $request): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        try {
            $payload = EventPayload::parse($request->body, requireAll: true);
            $payload['user_id'] = $userId;
            $row = $this->repository->create($payload);
            Response::json(EventResource::from($row), 201);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        } catch (Exception $e) {
            Response::error('予定の作成に失敗しました', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function update(Request $request, array $params): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        $id = $this->parseId($params['id'] ?? null);
        if ($id === null) {
            Response::error('IDが不正です', 400);
            return;
        }

        try {
            $payload = EventPayload::parse($request->body, requireAll: false);
            $row = $this->repository->update($id, $userId, $payload);
            if ($row === null) {
                Response::error('予定が見つかりません', 404);
                return;
            }
            Response::json(EventResource::from($row));
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        } catch (Exception $e) {
            Response::error('予定の更新に失敗しました', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, array $params): void
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return;
        }

        $id = $this->parseId($params['id'] ?? null);
        if ($id === null) {
            Response::error('IDが不正です', 400);
            return;
        }

        if (!$this->repository->delete($id, $userId)) {
            Response::error('予定が見つかりません', 404);
            return;
        }

        Response::json(['ok' => true]);
    }

    private function requireUserId(): ?int
    {
        $sessionUser = $_SESSION['user'] ?? null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && (int) $sessionUser['id'] >= 1) {
            return (int) $sessionUser['id'];
        }

        Response::error('ログインが必要です', 401);
        return null;
    }

    private function parseId(mixed $id): ?int
    {
        if ($id === null || !ctype_digit((string) $id)) {
            return null;
        }
        return (int) $id;
    }
}
