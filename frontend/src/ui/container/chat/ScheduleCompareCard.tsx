import type { KeyboardEvent, ReactNode } from 'react'
import { formatEventDateTime } from '@/utils/formatEventDateTime.ts'

export type ScheduleCompareTone = 'new' | 'existing'
export type ScheduleCompareEmphasis =
	| 'default'
	| 'selected'
	| 'conflict'
	| 'resolved'

type ScheduleCompareCardProps = {
	badge: string
	tone: ScheduleCompareTone
	title: string
	startAt: string | null
	endAt: string | null
	allDay: boolean
	location?: string | null
	selected?: boolean
	emphasis?: ScheduleCompareEmphasis
	disabled?: boolean
	footer?: ReactNode
	onSelect?: () => void
}

const badgeTextStyles = {
	new: 'text-[var(--color-chat)]',
	existing: 'text-base-content/55',
} as const

const emphasisStyles: Record<ScheduleCompareEmphasis, string> = {
	default: 'border-base-300 bg-base-100',
	selected: 'border-success/70 bg-success/15 ring-2 ring-success/35',
	conflict: 'border-error/70 bg-error/5',
	resolved: 'border-success/60 bg-success/10',
}

export function ScheduleCompareCard({
	badge,
	tone,
	title,
	startAt,
	endAt,
	allDay,
	location,
	selected = false,
	emphasis,
	disabled = false,
	footer,
	onSelect,
}: ScheduleCompareCardProps) {
	const start = startAt ? new Date(startAt) : null
	const end = endAt ? new Date(endAt) : null
	const scheduleLabel = formatEventDateTime(start, end, allDay)
	const displayTitle = title.trim() || 'タイトル未定'
	const resolvedEmphasis =
		emphasis ?? (selected ? 'selected' : 'default')
	const selectable = Boolean(onSelect) && !disabled

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!selectable || !onSelect) return
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onSelect()
		}
	}

	return (
		<div
			className={`flex h-full flex-col rounded-xl border p-3 transition-[border-color,background-color,box-shadow] ${emphasisStyles[resolvedEmphasis]} ${
				selectable ? 'cursor-pointer hover:brightness-[0.98]' : ''
			}`}
			role={onSelect ? 'button' : undefined}
			tabIndex={selectable ? 0 : undefined}
			aria-pressed={onSelect ? selected : undefined}
			aria-disabled={onSelect ? disabled : undefined}
			onClick={selectable ? onSelect : undefined}
			onKeyDown={onSelect ? handleKeyDown : undefined}
		>
			<span className={`text-xs font-semibold ${badgeTextStyles[tone]}`}>
				{badge}
			</span>
			<p className="mt-2 text-sm font-semibold break-words">{displayTitle}</p>
			<p className="mt-2 text-xs opacity-80">{scheduleLabel}</p>
			{location?.trim() ? (
				<p className="mt-1 text-xs opacity-70">場所: {location.trim()}</p>
			) : null}

			{footer ? (
				<div
					className="mt-3"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
					{footer}
				</div>
			) : null}
		</div>
	)
}
