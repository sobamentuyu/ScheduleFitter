import type { ReactNode } from 'react'
import { formatEventDateTime } from '@/utils/formatEventDateTime.ts'

export type ScheduleCompareTone = 'new' | 'existing'

type ScheduleCompareCardProps = {
	badge: string
	tone: ScheduleCompareTone
	title: string
	startAt: string | null
	endAt: string | null
	allDay: boolean
	location?: string | null
	selected?: boolean
	disabled?: boolean
	footer?: ReactNode
	onSelect?: () => void
}

const badgeTextStyles = {
	new: 'text-[var(--color-chat)]',
	existing: 'text-base-content/55',
} as const

export function ScheduleCompareCard({
	badge,
	tone,
	title,
	startAt,
	endAt,
	allDay,
	location,
	selected = false,
	disabled = false,
	footer,
	onSelect,
}: ScheduleCompareCardProps) {
	const start = startAt ? new Date(startAt) : null
	const end = endAt ? new Date(endAt) : null
	const scheduleLabel = formatEventDateTime(start, end, allDay)
	const displayTitle = title.trim() || 'タイトル未定'

	return (
		<div
			className={`flex h-full flex-col rounded-xl border p-3 ${
				selected
					? 'border-primary bg-primary/35 ring-2 ring-primary/40'
					: 'border-base-300 bg-base-100'
			}`}
		>
			<span className={`text-xs font-semibold ${badgeTextStyles[tone]}`}>
				{badge}
			</span>
			<p className="mt-2 text-sm font-semibold break-words">{displayTitle}</p>
			<p className="mt-2 text-xs opacity-80">{scheduleLabel}</p>
			{location?.trim() ? (
				<p className="mt-1 text-xs opacity-70">場所: {location.trim()}</p>
			) : null}

			{onSelect ? (
				<button
					type="button"
					className={`btn btn-sm mt-3 w-full whitespace-nowrap ${
						selected ? 'btn-primary' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={selected}
					onClick={onSelect}
				>
					{selected ? '優先中' : 'こちらを優先'}
				</button>
			) : null}

			{footer ? <div className="mt-3">{footer}</div> : null}
		</div>
	)
}
