function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isMidnight(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayAllDayEnd(start: Date, end: Date): Date {
  const endDate = toDateOnly(end)
  if (isMidnight(end) && endDate.getTime() > toDateOnly(start).getTime()) {
    endDate.setDate(endDate.getDate() - 1)
  }
  return endDate
}

export function formatEventSchedule(
  start: Date | null,
  end: Date | null,
  allDay: boolean,
): string {
  if (!start) return '未定'

  if (allDay) {
    const startLabel = formatDate(start)
    if (!end) return `${startLabel}（終日）`

    const displayEnd = displayAllDayEnd(start, end)
    if (toDateOnly(start).getTime() === displayEnd.getTime()) {
      return `${startLabel}（終日）`
    }
    return `${startLabel} 〜 ${formatDate(displayEnd)}（終日）`
  }

  const startLabel = `${formatDate(start)} ${formatTime(start)}`
  if (!end) return startLabel

  if (toDateOnly(start).getTime() === toDateOnly(end).getTime()) {
    return `${startLabel} 〜 ${formatTime(end)}`
  }

  return `${startLabel} 〜 ${formatDate(end)} ${formatTime(end)}`
}
