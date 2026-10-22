import type { CalendarEvent, CreateEventPayload } from '@/types/event.ts'
import type {
  ExistingEventUpdate,
  ScheduleSuggestion,
} from '@/types/scheduleSuggestion.ts'

export type ApproveScheduleSuggestionPayload = {
  creates: CreateEventPayload[]
  updates: ExistingEventUpdate[]
  deletes: number[]
}

export type ApproveScheduleSuggestionResult = {
  created: CalendarEvent[]
  updated_count: number
  deleted_count: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024

export const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function validateScheduleImage(file: File): string | null {
  if (file.size > IMAGE_MAX_BYTES) {
    return '画像は8MB以下にしてください'
  }

  if (!isAllowedImageType(file)) {
    return '対応していない画像形式です'
  }

  return null
}

function isAllowedImageType(file: File): boolean {
  if (IMAGE_MIME_TYPES.has(file.type)) {
    return true
  }

  if (file.type === '') {
    return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
  }

  return false
}

async function readSuggestionResponse(res: Response): Promise<ScheduleSuggestion> {
  const body = (await res.json().catch(() => null)) as
    | { suggestion?: ScheduleSuggestion; error?: string }
    | null

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('ログインが必要です')
    }
    if (res.status === 422) {
      throw new Error(body?.error ?? '入力内容を確認してください')
    }
    throw new Error('予定を読み取れませんでした。もう一度送ってみてください。')
  }

  if (!body?.suggestion) {
    throw new Error('予定を読み取れませんでした。もう一度送ってみてください。')
  }

  return body.suggestion
}

export async function createScheduleSuggestion(
  request: string,
): Promise<ScheduleSuggestion> {
  const res = await fetch(`${API_BASE}/api/schedule-suggestions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request }),
  })

  return readSuggestionResponse(res)
}

export async function createScheduleSuggestionFromImage(
  file: File,
  request = '',
): Promise<ScheduleSuggestion> {
  const body = new FormData()
  body.append('image', file)
  if (request !== '') {
    body.append('request', request)
  }

  const res = await fetch(`${API_BASE}/api/schedule-suggestions`, {
    method: 'POST',
    credentials: 'include',
    body,
  })

  return readSuggestionResponse(res)
}

export async function approveScheduleSuggestion(
  payload: ApproveScheduleSuggestionPayload,
): Promise<ApproveScheduleSuggestionResult> {
  const res = await fetch(`${API_BASE}/api/schedule-suggestions/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await res.json().catch(() => null)) as
    | (ApproveScheduleSuggestionResult & { error?: string })
    | null

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('ログインが必要です')
    }
    if (res.status === 422) {
      throw new Error(body?.error ?? '予定を保存できませんでした')
    }
    throw new Error(body?.error ?? '予定を保存できませんでした')
  }

  if (!body || !Array.isArray(body.created)) {
    throw new Error('予定を保存できませんでした')
  }

  return {
    created: body.created,
    updated_count: body.updated_count ?? 0,
    deleted_count: body.deleted_count ?? 0,
  }
}
