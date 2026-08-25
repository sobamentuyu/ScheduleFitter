import type {
  DayCellContentArg,
  DayHeaderContentArg,
  EventContentArg,
  SlotLabelContentArg,
} from '@fullcalendar/core'
import { Text } from '@/ui/common/Text.tsx'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

function weekendColor(date: Date) {
  const day = date.getDay()
  if (day === 0) return 'sunday' as const
  if (day === 6) return 'saturday' as const
}

export function renderDayHeader(arg: DayHeaderContentArg) {
  const weekday = WEEKDAYS[arg.date.getDay()]
  const color = weekendColor(arg.date) ?? 'primaryContent'

  if (arg.view.type === 'dayGridMonth') {
    return (
      <Text as="span" size="xs" weight="medium" color={color}>
        {weekday}
      </Text>
    )
  }

  return (
    <span className="flex flex-col items-center gap-px leading-tight">
      <Text
        as="span"
        size="sm"
        weight="medium"
        color={color}
        className={
          arg.isToday
            ? 'flex size-6 items-center justify-center rounded-full bg-base-content/10'
            : undefined
        }
      >
        {arg.date.getDate()}
      </Text>
      <Text as="span" size="xs" weight="medium" color={color}>
        {weekday}
      </Text>
    </span>
  )
}

export function renderDayCell(arg: DayCellContentArg) {
  if (arg.view.type !== 'dayGridMonth') return <span hidden />

  return (
    <Text
      as="span"
      size="xs"
      weight="medium"
      color={arg.isToday ? 'primaryContent' : (weekendColor(arg.date) ?? 'base')}
      className={`flex size-7 items-center justify-center rounded-full ${
        arg.isToday ? 'bg-primary' : ''
      } ${arg.isOther ? 'opacity-40' : ''}`}
    >
      {arg.date.getDate()}
    </Text>
  )
}

export function renderEvent(arg: EventContentArg) {
  return (
    <Text
      as="span"
      size="xs"
      weight="medium"
      color="primaryContent"
      className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap leading-tight"
    >
      {arg.event.title}
    </Text>
  )
}

export function renderSlotLabel(arg: SlotLabelContentArg) {
  return (
    <Text as="span" size="xs" color="muted">
      {arg.text}
    </Text>
  )
}

export function dayCellClassNames(arg: DayCellContentArg) {
  return [
    !arg.isToday && 'hover:bg-secondary',
    arg.isOther && 'bg-base-200',
  ].filter(Boolean) as string[]
}
