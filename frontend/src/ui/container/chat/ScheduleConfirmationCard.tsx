import type { ConfirmationState } from '@/types/chat.ts'
import type {
	ExistingEventUpdate,
	ScheduleSuggestionEvent,
} from '@/types/scheduleSuggestion.ts'
import { useConflictPreview } from '@/hooks/useConflictPreview.ts'
import { useConflictResolution } from '@/hooks/useConflictResolution.ts'
import { useScheduleConfirmation } from '@/hooks/useScheduleConfirmation.ts'
import { ConflictResolutionPanel } from '@/ui/container/chat/ConflictResolutionPanel.tsx'
import {
	formatMissingNotices,
	formatScheduleDateTime,
} from '@/utils/formatScheduleSuggestion.ts'
import { formatEventDateTime } from '@/utils/formatEventDateTime.ts'

type ScheduleConfirmationCardProps = {
	state: ConfirmationState
	events: ScheduleSuggestionEvent[]
	errorMessage?: string | null
	onApprove: (
		events: ScheduleSuggestionEvent[],
		existingUpdates: ExistingEventUpdate[],
		existingDeletes: number[],
	) => void
	onCancel: () => void
}

export function ScheduleConfirmationCard({
	state,
	events,
	errorMessage = null,
	onApprove,
	onCancel,
}: ScheduleConfirmationCardProps) {
	const { setPreview } = useConflictPreview()
	const previewActive = state === 'pending' || state === 'failed'
	const {
		workingEvents,
		hasUnresolvedConflicts,
		currentNew,
		currentExisting,
		pairKind,
		keptSide,
		draft,
		shiftMode,
		error,
		progress,
		conflictFreeEvents,
		pairStillConflicting,
		pendingChangesFor,
		isChecking,
		isCalendarLoading,
		selectKeptSide,
		applySuggestedShift,
		openPicker,
		updateDraft,
		confirmResolution,
	} = useConflictResolution(events, previewActive ? setPreview : undefined)

	const {
		selectedEvents,
		readyCount,
		allReadySelected,
		isSaving,
		isSelected,
		toggle,
		toggleSelectAll,
	} = useScheduleConfirmation(workingEvents, state)

	const resolutionDisabled = isSaving || isChecking

	if (state === 'approved') {
		return (
			<p className="text-sm font-medium text-success">予定を追加しました</p>
		)
	}

	if (state === 'cancelled') {
		return (
			<p className="text-sm opacity-70">追加をキャンセルしました</p>
		)
	}

	if (hasUnresolvedConflicts && currentNew && currentExisting) {
		const statusHeader = pairStillConflicting
			? pairKind === 'peer'
				? '追加する予定同士の時間が重なっています'
				: '既存の予定と時間が重なっています'
			: '重なっていません'
		const isLastPair = progress.current >= progress.total
		const confirmLabel = isChecking
			? '確認中…'
			: isLastPair
				? '予定を追加へ'
				: 'この解決で進む'

		return (
			<div>
				<p
					className={`mb-3 text-sm font-medium ${
						pairStillConflicting ? '' : 'text-success'
					}`}
				>
					{statusHeader}
				</p>

				{conflictFreeEvents.length > 0 ? (
					<div className="mb-4 rounded-xl border border-success/40 bg-success/10 p-3">
						<p className="text-xs font-medium text-success">
							これらの予定は衝突なく追加できます
						</p>
						<ul className="mt-2 flex flex-col gap-1.5">
							{conflictFreeEvents.map((event, index) => {
								const start = event.start_at
									? new Date(event.start_at)
									: null
								const end = event.end_at ? new Date(event.end_at) : null
								return (
									<li
										key={`ready-${event.title}-${event.start_at ?? index}`}
										className="text-xs opacity-90"
									>
										<span className="font-medium">
											{event.title.trim() || 'タイトル未定'}
										</span>
										<span className="mt-0.5 block opacity-80">
											{formatEventDateTime(start, end, event.all_day)}
										</span>
									</li>
								)
							})}
						</ul>
					</div>
				) : null}

				<ConflictResolutionPanel
					progress={progress}
					pairKind={pairKind ?? 'existing'}
					newEvent={currentNew}
					existingEvent={currentExisting}
					keptSide={keptSide}
					draft={draft}
					shiftMode={shiftMode}
					pairStillConflicting={pairStillConflicting}
					error={error}
					disabled={resolutionDisabled || isCalendarLoading}
					confirmLabel={confirmLabel}
					onSelectKeptSide={selectKeptSide}
					onSuggestShift={applySuggestedShift}
					onOpenPicker={openPicker}
					onDraftChange={updateDraft}
					onConfirm={() => {
						void confirmResolution()
					}}
				/>
				<div className="flex justify-end">
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						disabled={resolutionDisabled}
						onClick={onCancel}
					>
						キャンセル
					</button>
				</div>
			</div>
		)
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between gap-2">
				<p className="text-sm font-medium">
					{readyCount > 0
						? '追加する予定を選んでください'
						: '追加できる予定がまだありません'}
				</p>
				{readyCount > 1 && (
					<button
						type="button"
						className="btn btn-ghost btn-xs"
						disabled={isSaving}
						onClick={toggleSelectAll}
					>
						{allReadySelected ? '選択を解除' : 'すべて選択'}
					</button>
				)}
			</div>

			<ul className="mb-3 flex flex-col gap-2">
				{workingEvents.map((event, i) => {
					const ready = event.status === 'ready'
					const checked = isSelected(i)
					const title = event.title.trim() || 'タイトル未定'

					return (
						<li key={`${event.title}-${event.start_at ?? 'none'}-${i}`}>
							<label
								className={`flex items-start gap-2 rounded-lg px-1 py-1 ${
									ready ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
								}`}
							>
								<input
									type="checkbox"
									className="checkbox checkbox-sm mt-0.5"
									checked={checked}
									disabled={!ready || isSaving}
									onChange={() => toggle(i)}
								/>
								<span
									aria-hidden
									className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
										ready ? 'bg-success' : 'bg-error'
									}`}
								/>
								<span className="min-w-0 flex-1 text-sm">
									<span className="sr-only">
										{ready ? '追加できます。' : '情報が不足しています。'}
									</span>
									<span className="block font-medium">{title}</span>
									{event.location && (
										<span className="mt-0.5 block text-xs opacity-80">
											場所: {event.location}
										</span>
									)}
									{event.description && (
										<span className="mt-0.5 block text-xs opacity-80">
											内容: {event.description}
										</span>
									)}
									{event.all_day && (
										<span className="mt-0.5 block text-xs opacity-80">終日</span>
									)}
									<span className="mt-0.5 block text-xs opacity-80">
										開始: {formatScheduleDateTime(event.start_at, event.all_day)}
									</span>
									<span className="mt-0.5 block text-xs opacity-80">
										終了:{' '}
										{formatScheduleDateTime(event.end_at, event.all_day, 'end')}
									</span>
									{!ready &&
										formatMissingNotices(event.missing_fields).map((notice) => (
											<span
												key={notice}
												className="mt-0.5 block text-xs text-error"
											>
												{notice}
											</span>
										))}
								</span>
							</label>
						</li>
					)
				})}
			</ul>

			{state === 'failed' && (
				<p role="alert" className="mb-3 text-sm text-error">
					{errorMessage?.trim() ||
						'予定を追加できませんでした。もう一度お試しください。'}
				</p>
			)}

			<div className="flex justify-end gap-2">
				<button
					type="button"
					className="btn btn-ghost btn-sm"
					disabled={isSaving}
					onClick={onCancel}
				>
					キャンセル
				</button>
				<button
					type="button"
					className="btn btn-primary btn-sm"
					disabled={isSaving || selectedEvents.length === 0}
					onClick={() => {
						const { updates, deletes } = pendingChangesFor(selectedEvents)
						onApprove(selectedEvents, updates, deletes)
					}}
				>
					{isSaving
						? '追加中…'
						: selectedEvents.length > 1
							? `${selectedEvents.length}件を追加する`
							: '追加する'}
				</button>
			</div>
		</div>
	)
}
