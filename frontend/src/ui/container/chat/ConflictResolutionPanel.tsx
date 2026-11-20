import type { ScheduleSuggestionEvent } from '@/types/scheduleSuggestion.ts'
import type { ShiftUiMode } from '@/hooks/useConflictResolution.ts'
import type {
	ConflictTimeDraft,
	KeptSide,
} from '@/utils/conflictResolution.ts'
import type { ShiftDirection } from '@/utils/suggestConflictShift.ts'
import { ConflictTimeEditor } from '@/ui/container/chat/ConflictTimeEditor.tsx'
import { ScheduleCompareCard } from '@/ui/container/chat/ScheduleCompareCard.tsx'

type ExistingView = {
	title: string
	location: string | null
	start_at: string
	end_at: string
	all_day: boolean
}

type ConflictResolutionPanelProps = {
	progress: { current: number; total: number }
	pairKind: 'existing' | 'peer'
	newEvent: ScheduleSuggestionEvent
	existingEvent: ExistingView
	keptSide: KeptSide | null
	draft: ConflictTimeDraft | null
	shiftMode: ShiftUiMode
	pairStillConflicting: boolean
	error: string | null
	disabled?: boolean
	confirmLabel?: string
	onSelectKeptSide: (side: KeptSide) => void
	onSuggestShift: (direction: ShiftDirection) => void
	onOpenPicker: () => void
	onDraftChange: (patch: Partial<ConflictTimeDraft>) => void
	onConfirm: () => void
}

function OtherSideFooter({
	draft,
	shiftMode,
	disabled,
	onSuggestShift,
	onOpenPicker,
	onDraftChange,
}: {
	draft: ConflictTimeDraft | null
	shiftMode: ShiftUiMode
	disabled: boolean
	onSuggestShift: (direction: ShiftDirection) => void
	onOpenPicker: () => void
	onDraftChange: (patch: Partial<ConflictTimeDraft>) => void
}) {
	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs opacity-70">
				この予定を、優先した予定の前後へずらします（1時間空けます）
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					className={`btn btn-sm h-auto min-h-8 flex-1 flex-col gap-0 px-2 py-1.5 ${
						shiftMode === 'before' ? 'btn-primary' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={shiftMode === 'before'}
					aria-label="優先した予定の前へずらす"
					onClick={() => onSuggestShift('before')}
				>
					<span className="text-xs font-semibold leading-tight">前へずらす</span>
					<span className="text-[10px] font-normal leading-tight opacity-80">
						優先の直前
					</span>
				</button>
				<button
					type="button"
					className={`btn btn-sm h-auto min-h-8 flex-1 flex-col gap-0 px-2 py-1.5 ${
						shiftMode === 'after' ? 'btn-primary' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={shiftMode === 'after'}
					aria-label="優先した予定の後へずらす"
					onClick={() => onSuggestShift('after')}
				>
					<span className="text-xs font-semibold leading-tight">後へずらす</span>
					<span className="text-[10px] font-normal leading-tight opacity-80">
						優先の直後
					</span>
				</button>
				<button
					type="button"
					className={`btn btn-sm h-auto min-h-8 flex-1 px-2 py-1.5 ${
						shiftMode === 'picker' ? 'btn-primary' : 'btn-outline'
					}`}
					disabled={disabled}
					aria-pressed={shiftMode === 'picker'}
					onClick={onOpenPicker}
				>
					<span className="text-xs font-semibold leading-tight">日時を選択</span>
				</button>
			</div>
			{shiftMode === 'picker' && draft ? (
				<ConflictTimeEditor
					draft={draft}
					disabled={disabled}
					onChange={onDraftChange}
				/>
			) : null}
		</div>
	)
}

export function ConflictResolutionPanel({
	progress,
	pairKind,
	newEvent,
	existingEvent,
	keptSide,
	draft,
	shiftMode,
	pairStillConflicting,
	error,
	disabled = false,
	confirmLabel = 'この解決で進む',
	onSelectKeptSide,
	onSuggestShift,
	onOpenPicker,
	onDraftChange,
	onConfirm,
}: ConflictResolutionPanelProps) {
	const editingExisting = keptSide === 'new'
	const editingNew = keptSide === 'existing'
	const canConfirm = keptSide !== null

	const otherSideFooter =
		keptSide !== null ? (
			<OtherSideFooter
				draft={draft}
				shiftMode={shiftMode}
				disabled={disabled}
				onSuggestShift={onSuggestShift}
				onOpenPicker={onOpenPicker}
				onDraftChange={onDraftChange}
			/>
		) : null

	const cardEmphasis = (side: KeptSide) => {
		if (keptSide === side) return 'selected'
		if (keptSide !== null && !pairStillConflicting) return 'resolved'
		return 'conflict'
	}

	return (
		<div className="mb-4">
			<div className="mb-3 flex items-start justify-between gap-2">
				<p className="text-xs opacity-70">
					{pairKind === 'peer'
						? '優先する予定のカードを選んでください。もう一方は時間を調整するか、ずらさなければ追加せずに進めます'
						: '優先する予定のカードを選んでください。もう一方は時間を調整するか、ずらさなければ削除して進めます'}
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
						editingNew && draft ? draft.start_at : newEvent.start_at
					}
					endAt={editingNew && draft ? draft.end_at : newEvent.end_at}
					allDay={editingNew && draft ? draft.all_day : newEvent.all_day}
					location={newEvent.location}
					selected={keptSide === 'new'}
					emphasis={cardEmphasis('new')}
					disabled={disabled}
					onSelect={() => onSelectKeptSide('new')}
					footer={editingNew ? otherSideFooter : null}
				/>
				<ScheduleCompareCard
					tone={pairKind === 'peer' ? 'new' : 'existing'}
					badge={
						pairKind === 'peer'
							? '新規・今追加する予定'
							: '既存・カレンダーの予定'
					}
					title={existingEvent.title}
					startAt={
						editingExisting && draft
							? draft.start_at
							: existingEvent.start_at
					}
					endAt={
						editingExisting && draft
							? draft.end_at
							: existingEvent.end_at
					}
					allDay={
						editingExisting && draft
							? draft.all_day
							: existingEvent.all_day
					}
					location={existingEvent.location}
					selected={keptSide === 'existing'}
					emphasis={cardEmphasis('existing')}
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
