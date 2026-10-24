import type { ScheduleSuggestionEvent } from '@/entities/scheduleSuggestion.ts'
import type {
	ConflictTimeDraft,
	KeptSide,
	ResolutionAction,
} from '@/utils/conflictResolution.ts'
import { ConflictTimeEditor } from '@/ui/container/top/chat/ConflictTimeEditor.tsx'
import { ScheduleCompareCard } from '@/ui/container/top/chat/ScheduleCompareCard.tsx'

type ExistingView = {
	title: string
	location: string | null
	start_at: string
	end_at: string
	all_day: boolean
}

type ConflictResolutionPanelProps = {
	progress: { current: number; total: number }
	newEvent: ScheduleSuggestionEvent
	existingEvent: ExistingView
	keptSide: KeptSide | null
	action: ResolutionAction
	draft: ConflictTimeDraft | null
	error: string | null
	disabled?: boolean
	confirmLabel?: string
	onSelectKeptSide: (side: KeptSide) => void
	onSelectAction: (action: ResolutionAction) => void
	onDraftChange: (patch: Partial<ConflictTimeDraft>) => void
	onConfirm: () => void
}

function OtherSideFooter({
	keptSide,
	action,
	draft,
	disabled,
	onSelectAction,
	onDraftChange,
}: {
	keptSide: KeptSide
	action: ResolutionAction
	draft: ConflictTimeDraft | null
	disabled: boolean
	onSelectAction: (action: ResolutionAction) => void
	onDraftChange: (patch: Partial<ConflictTimeDraft>) => void
}) {
	const deleteLabel = keptSide === 'new' ? '削除する' : '追加しない'
	const deleteHint =
		keptSide === 'new'
			? 'カレンダーからこの予定を削除します'
			: 'この予定は追加しません'

	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2">
				<button
					type="button"
					className={`btn btn-sm flex-1 ${
						action === 'reschedule' ? 'btn-primary' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={action === 'reschedule'}
					onClick={() => onSelectAction('reschedule')}
				>
					時間をずらす
				</button>
				<button
					type="button"
					className={`btn btn-sm flex-1 ${
						action === 'delete' ? 'btn-error' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={action === 'delete'}
					onClick={() => onSelectAction('delete')}
				>
					{deleteLabel}
				</button>
			</div>
			{action === 'reschedule' && draft ? (
				<ConflictTimeEditor
					draft={draft}
					disabled={disabled}
					onChange={onDraftChange}
				/>
			) : null}
			{action === 'delete' ? (
				<p className="text-xs text-error">{deleteHint}</p>
			) : null}
		</div>
	)
}

export function ConflictResolutionPanel({
	progress,
	newEvent,
	existingEvent,
	keptSide,
	action,
	draft,
	error,
	disabled = false,
	confirmLabel = 'この解決で進む',
	onSelectKeptSide,
	onSelectAction,
	onDraftChange,
	onConfirm,
}: ConflictResolutionPanelProps) {
	const editingExisting = keptSide === 'new'
	const editingNew = keptSide === 'existing'
	const canConfirm =
		keptSide !== null && (action === 'delete' || draft !== null)

	const otherSideFooter =
		keptSide !== null ? (
			<OtherSideFooter
				keptSide={keptSide}
				action={action}
				draft={draft}
				disabled={disabled}
				onSelectAction={onSelectAction}
				onDraftChange={onDraftChange}
			/>
		) : null

	return (
		<div className="mb-4">
			<div className="mb-3 flex items-start justify-between gap-2">
				<p className="text-xs opacity-70">
					優先する予定を選び、もう一方をずらすか削除してください
				</p>
				{progress.total > 1 ? (
					<p className="shrink-0 text-xs opacity-70">
						{progress.current}/{progress.total}
					</p>
				) : null}
			</div>

			<div className="flex flex-col gap-3">
				<ScheduleCompareCard
					tone="new"
					badge="新規・今追加する予定"
					title={newEvent.title}
					startAt={
						editingNew && action === 'reschedule' && draft
							? draft.start_at
							: newEvent.start_at
					}
					endAt={
						editingNew && action === 'reschedule' && draft
							? draft.end_at
							: newEvent.end_at
					}
					allDay={
						editingNew && action === 'reschedule' && draft
							? draft.all_day
							: newEvent.all_day
					}
					location={newEvent.location}
					selected={keptSide === 'new'}
					disabled={disabled}
					onSelect={() => onSelectKeptSide('new')}
					footer={editingNew ? otherSideFooter : null}
				/>
				<ScheduleCompareCard
					tone="existing"
					badge="既存・カレンダーの予定"
					title={existingEvent.title}
					startAt={
						editingExisting && action === 'reschedule' && draft
							? draft.start_at
							: existingEvent.start_at
					}
					endAt={
						editingExisting && action === 'reschedule' && draft
							? draft.end_at
							: existingEvent.end_at
					}
					allDay={
						editingExisting && action === 'reschedule' && draft
							? draft.all_day
							: existingEvent.all_day
					}
					location={existingEvent.location}
					selected={keptSide === 'existing'}
					disabled={disabled}
					onSelect={() => onSelectKeptSide('existing')}
					footer={editingExisting ? otherSideFooter : null}
				/>
			</div>

			{error ? (
				<p role="alert" className="mt-3 text-sm text-error">
					{error}
				</p>
			) : null}

			<div className="mt-3 flex justify-end">
				<button
					type="button"
					className="btn btn-primary btn-sm"
					disabled={disabled || !canConfirm}
					onClick={onConfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	)
}
