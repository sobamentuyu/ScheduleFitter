import type { ScheduleSuggestion } from '@/types/scheduleSuggestion.ts'

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
): Promise<ScheduleSuggestion> {
  const body = new FormData()
  body.append('image', file)

  const res = await fetch(`${API_BASE}/api/schedule-suggestions`, {
    method: 'POST',
    credentials: 'include',
    body,
  })

  return readSuggestionResponse(res)
}
