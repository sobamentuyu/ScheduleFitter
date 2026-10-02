import type {
  ScheduleSuggestion,
  ScheduleSuggestionEvent,
} from '@/types/scheduleSuggestion.ts'

const FIELD_LABELS: Record<string, string> = {
  date: '日付',
  start_at: '開始時刻',
  end_at: '終了時刻',
  title: 'タイトル',
  location: '場所',
  description: '内容',
  category: 'カテゴリ',
}

function inclusiveAllDayEnd(end: Date): Date {
  if (
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0
  ) {
    const display = new Date(end)
    display.setDate(display.getDate() - 1)
    return display
  }

  return end
}

export function formatScheduleDateTime(
  value: string | null,
  allDay: boolean,
  boundary: 'start' | 'end' = 'start',
): string {
  if (!value) return '未定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  if (allDay) {
    const display = boundary === 'end' ? inclusiveAllDayEnd(date) : date
    return display.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEvent(event: ScheduleSuggestionEvent, index: number, total: number): string {
  const lines: string[] = []

  if (total > 1) {
    lines.push(`【${index + 1}件目】`)
  }

  if (event.title?.trim()) {
    lines.push(event.title)
  }
  if (event.location) {
    lines.push(`場所: ${event.location}`)
  }
  if (event.description) {
    lines.push(`内容: ${event.description}`)
  }
  if (event.category) {
    lines.push(`カテゴリ: ${event.category}`)
  }
  if (event.all_day) {
    lines.push('終日')
  }

  lines.push(`開始: ${formatScheduleDateTime(event.start_at, event.all_day)}`)
  lines.push(`終了: ${formatScheduleDateTime(event.end_at, event.all_day, 'end')}`)

  lines.push(...formatMissingNotices(event.missing_fields ?? []))

  return lines.join('\n')
}

export function formatMissingFields(fields: string[]): string {
  return fields.map((field) => FIELD_LABELS[field] ?? field).join('、')
}

export function formatMissingNotices(fields: string[]): string[] {
  const notices: string[] = []
  const others = fields.filter((field) => field !== 'date')

  if (others.length > 0) {
    notices.push(`不足: ${formatMissingFields(others)}`)
  }
  if (fields.includes('date')) {
    notices.push('日時を入力してください')
  }

  return notices
}

export function formatScheduleSuggestionHeader(
  totalCount: number,
  readyCount: number,
): string {
  if (totalCount === 0) {
    return '予定を読み取れませんでした。画像や文章に予定の情報があるか確認してください。'
  }

  if (readyCount === 0) {
    return 'もう少し情報が必要です'
  }

  if (readyCount < totalCount) {
    return `${totalCount}件の予定を読み取りました。`
  }

  return totalCount === 1
    ? '予定として読み取りました'
    : `${totalCount}件の予定として読み取りました`
}

export function formatScheduleSuggestion(
  suggestion: ScheduleSuggestion,
): string {
  const events = Array.isArray(suggestion.events) ? suggestion.events : []

  if (events.length === 0) {
    return formatScheduleSuggestionHeader(0, 0)
  }

  const readyCount = events.filter((event) => event.status === 'ready').length
  const header = formatScheduleSuggestionHeader(events.length, readyCount)

  return [header, '', events.map((event, index) => formatEvent(event, index, events.length)).join('\n\n')].join('\n')
}
