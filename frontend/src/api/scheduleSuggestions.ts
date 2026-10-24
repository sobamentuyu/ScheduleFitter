import { requestRaw } from "@/api/client.ts";
import { ApiError, messageForStatus } from "@/api/errors.ts";
import type {
  ApproveScheduleSuggestionPayload,
  ApproveScheduleSuggestionResult,
  ScheduleSuggestion,
} from "@/entities/scheduleSuggestion.ts";

export type {
  ApproveScheduleSuggestionPayload,
  ApproveScheduleSuggestionResult,
} from "@/entities/scheduleSuggestion.ts";

async function readSuggestionResponse(
  res: Response,
): Promise<ScheduleSuggestion> {
  const body = (await res.json().catch(() => null)) as
    | { suggestion?: ScheduleSuggestion; error?: string }
    | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      messageForStatus(res.status, body?.error, {
        unprocessable: "入力内容を確認してください",
        default: "予定を読み取れませんでした。もう一度送ってみてください。",
      }),
    );
  }

  if (!body?.suggestion) {
    throw new ApiError(
      res.status,
      "予定を読み取れませんでした。もう一度送ってみてください。",
    );
  }

  return body.suggestion;
}

export async function createScheduleSuggestion(
  requestText: string,
): Promise<ScheduleSuggestion> {
  const res = await requestRaw("/api/schedule-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: requestText }),
  });

  return readSuggestionResponse(res);
}

export async function createScheduleSuggestionFromImage(
  file: File,
  requestText = "",
): Promise<ScheduleSuggestion> {
  const body = new FormData();
  body.append("image", file);
  if (requestText !== "") {
    body.append("request", requestText);
  }

  const res = await requestRaw("/api/schedule-suggestions", {
    method: "POST",
    body,
  });

  return readSuggestionResponse(res);
}

export async function approveScheduleSuggestion(
  payload: ApproveScheduleSuggestionPayload,
): Promise<ApproveScheduleSuggestionResult> {
  const res = await requestRaw("/api/schedule-suggestions/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as
    | (ApproveScheduleSuggestionResult & { error?: string })
    | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      messageForStatus(res.status, body?.error, {
        unprocessable: "予定を保存できませんでした",
        default: "予定を保存できませんでした",
      }),
    );
  }

  if (!body || !Array.isArray(body.created)) {
    throw new ApiError(res.status, "予定を保存できませんでした");
  }

  return {
    created: body.created,
    updated_count: body.updated_count ?? 0,
    deleted_count: body.deleted_count ?? 0,
  };
}
