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

function formatDateTime(value: string | null, allDay: boolean): string {
  if (!value) return '未定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  if (allDay) {
    return date.toLocaleDateString('ja-JP', {
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

  lines.push(`開始: ${formatDateTime(event.start_at, event.all_day)}`)
  lines.push(`終了: ${formatDateTime(event.end_at, event.all_day)}`)

  if ((event.missing_fields ?? []).length > 0) {
    const labels = event.missing_fields.map((field) => FIELD_LABELS[field] ?? field)
    lines.push(`不足: ${labels.join('、')}`)
  }

  return lines.join('\n')
}

export function formatScheduleSuggestion(
  suggestion: ScheduleSuggestion,
): string {
  const events = Array.isArray(suggestion.events) ? suggestion.events : []
  const { status } = suggestion

  if (events.length === 0) {
    return '予定を読み取れませんでした。画像や文章に予定の情報があるか確認してください。'
  }

  const header =
    status === 'needs_clarification'
      ? 'もう少し情報が必要です'
      : events.length === 1
        ? '予定として読み取りました'
        : `${events.length}件の予定として読み取りました`

  return [header, '', events.map((event, index) => formatEvent(event, index, events.length)).join('\n\n')].join('\n')
}
