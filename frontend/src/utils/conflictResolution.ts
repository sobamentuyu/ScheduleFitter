import type {
	ConflictingEvent,
	ExistingEventUpdate,
	ScheduleSuggestionEvent,
} from '@/types/scheduleSuggestion.ts'
import { timeRangesConflict } from '@/utils/timeRangeConflict.ts'

/** 通常の予定追加と同じ半開区間で、サーバ結果から真の衝突だけ残す */
export function filterActiveConflicts(
	startAt: string,
	endAt: string,
	conflicts: ConflictingEvent[],
): ConflictingEvent[] {
	return conflicts.filter((conflict) =>
		timeRangesConflict(startAt, endAt, conflict.start_at, conflict.end_at),
	)
}

export type KeptSide = 'new' | 'existing'

/** 優先しなかった側の扱い */
export type ResolutionAction = 'reschedule' | 'delete'

export type ConflictTimeDraft = {
	start_at: string
	end_at: string
	all_day: boolean
}

export type ConflictPair = {
	eventIndex: number
	conflict: ConflictingEvent
}

export type ExistingOverride = ConflictTimeDraft & {
	title: string
	location: string | null
}

export type ApplyResolutionInput = {
	workingEvents: ScheduleSuggestionEvent[]
	knownExistings: Record<number, ConflictingEvent>
	existingOverrides: Record<number, ExistingOverride>
	deletedIds: number[]
	pair: ConflictPair
	keptSide: KeptSide
	action: ResolutionAction
	draft: ConflictTimeDraft | null
}

export type ApplyResolutionSuccess = {
	ok: true
	workingEvents: ScheduleSuggestionEvent[]
	existingOverrides: Record<number, ExistingOverride>
	deletedIds: number[]
}

export type ApplyResolutionFailure = {
	ok: false
	error: string
}

export function cloneSuggestionEvents(
	events: ScheduleSuggestionEvent[],
): ScheduleSuggestionEvent[] {
	return events.map((event) => ({
		...event,
		missing_fields: [...(event.missing_fields ?? [])],
		conflicts: event.conflicts?.map((conflict) => ({ ...conflict })) ?? null,
	}))
}

export function refreshSuggestionEventStatus(
	event: ScheduleSuggestionEvent,
): ScheduleSuggestionEvent {
	const hasConflicts = (event.conflicts?.length ?? 0) > 0
	const hasMissing = (event.missing_fields ?? []).length > 0
	return {
		...event,
		status: hasConflicts || hasMissing ? 'needs_clarification' : 'ready',
	}
}

/** 情報が揃っている予定の衝突だけ解決対象にする（不足ありは選択画面で不足表示） */
export function buildConflictQueue(
	events: ScheduleSuggestionEvent[],
): ConflictPair[] {
	return events.flatMap((event, eventIndex) => {
		if ((event.missing_fields ?? []).length > 0) return []
		if (event.start_at === null || event.end_at === null) return []
		return (event.conflicts ?? []).map((conflict) => ({
			eventIndex,
			conflict,
		}))
	})
}

export function resolveExistingConflict(
	conflict: ConflictingEvent,
	overrides: Record<number, ExistingOverride>,
): ExistingOverride {
	const override = overrides[conflict.id]
	if (override) return override
	return {
		title: conflict.title,
		location: conflict.location ?? null,
		start_at: conflict.start_at,
		end_at: conflict.end_at,
		all_day: conflict.all_day,
	}
}

export function toExistingEventUpdates(
	overrides: Record<number, ExistingOverride>,
): ExistingEventUpdate[] {
	return Object.entries(overrides).map(([id, override]) => ({
		id: Number(id),
		start_at: override.start_at,
		end_at: override.end_at,
		all_day: override.all_day,
	}))
}

/** 提案時点の既存予定（変更前）を id で保持する */
export function collectOriginalConflicts(
	events: ScheduleSuggestionEvent[],
): Record<number, ConflictingEvent> {
	const originals: Record<number, ConflictingEvent> = {}
	for (const event of events) {
		for (const conflict of event.conflicts ?? []) {
			if (originals[conflict.id] !== undefined) continue
			originals[conflict.id] = { ...conflict }
		}
	}
	return originals
}

/** サーバで新たに見つかった既存予定を既知セットに合流する */
export function mergeKnownExistings(
	known: Record<number, ConflictingEvent>,
	incoming: ConflictingEvent[],
): Record<number, ConflictingEvent> {
	if (incoming.length === 0) return known
	const next = { ...known }
	for (const conflict of incoming) {
		if (next[conflict.id] !== undefined) continue
		next[conflict.id] = { ...conflict }
	}
	return next
}

/**
 * 追加対象だけが、変更前の既存予定とまだ重なるときに限り
 * その既存の update / delete を残す。
 * （選ばなかった新規のための解決を、他の予定追加に載せない）
 */
export function filterPendingChangesForSelected(
	selectedEvents: ScheduleSuggestionEvent[],
	overrides: Record<number, ExistingOverride>,
	deletedIds: number[],
	originals: Record<number, ConflictingEvent>,
): { updates: ExistingEventUpdate[]; deletes: number[] } {
	const isNeeded = (existingId: number): boolean => {
		const original = originals[existingId]
		if (!original) return false

		return selectedEvents.some((event) => {
			if (event.start_at === null || event.end_at === null) return false
			return timeRangesConflict(
				event.start_at,
				event.end_at,
				original.start_at,
				original.end_at,
			)
		})
	}

	return {
		updates: toExistingEventUpdates(overrides).filter((update) =>
			isNeeded(update.id),
		),
		deletes: deletedIds.filter((id) => isNeeded(id)),
	}
}

/**
 * 移動予約（override）・削除を反映した「これから保存するカレンダー」上で、
 * 各新規予定の conflicts を作り直す。
 * （元の conflicts を刈るだけでは、別ペアで動かした既存との新しい重なりを検出できない）
 */
export function recomputeEventConflicts(
	events: ScheduleSuggestionEvent[],
	knownExistings: Record<number, ConflictingEvent>,
	overrides: Record<number, ExistingOverride>,
	deletedIds: number[] = [],
): ScheduleSuggestionEvent[] {
	const deleted = new Set(deletedIds)
	const effectiveExistings = Object.values(knownExistings)
		.filter((existing) => !deleted.has(existing.id))
		.map((existing) => {
			const resolved = resolveExistingConflict(existing, overrides)
			return {
				id: existing.id,
				title: resolved.title,
				location: resolved.location,
				start_at: resolved.start_at,
				end_at: resolved.end_at,
				all_day: resolved.all_day,
			} satisfies ConflictingEvent
		})

	return events.map((event) => {
		if (event.start_at === null || event.end_at === null) {
			return refreshSuggestionEventStatus(event)
		}

		const conflicts = effectiveExistings.filter((existing) =>
			timeRangesConflict(
				event.start_at as string,
				event.end_at as string,
				existing.start_at,
				existing.end_at,
			),
		)

		return refreshSuggestionEventStatus({
			...event,
			conflicts,
		})
	})
}

export function applyConflictResolution(
	input: ApplyResolutionInput,
): ApplyResolutionSuccess | ApplyResolutionFailure {
	const {
		workingEvents,
		knownExistings,
		existingOverrides,
		deletedIds,
		pair,
		keptSide,
		action,
		draft,
	} = input
	const currentNew = workingEvents[pair.eventIndex]
	if (!currentNew?.start_at || !currentNew.end_at) {
		return { ok: false, error: '予定の日時が不足しています' }
	}

	const conflictId = pair.conflict.id

	if (action === 'delete') {
		if (keptSide === 'new') {
			const nextDeleted = deletedIds.includes(conflictId)
				? deletedIds
				: [...deletedIds, conflictId]
			const restOverrides = Object.fromEntries(
				Object.entries(existingOverrides).filter(
					([id]) => Number(id) !== conflictId,
				),
			)

			return {
				ok: true,
				workingEvents: recomputeEventConflicts(
					workingEvents,
					knownExistings,
					restOverrides,
					nextDeleted,
				),
				existingOverrides: restOverrides,
				deletedIds: nextDeleted,
			}
		}

		const withoutNew = workingEvents.filter(
			(_, index) => index !== pair.eventIndex,
		)
		return {
			ok: true,
			workingEvents: recomputeEventConflicts(
				withoutNew,
				knownExistings,
				existingOverrides,
				deletedIds,
			),
			existingOverrides,
			deletedIds,
		}
	}

	if (!draft) {
		return { ok: false, error: 'ずらす時間を入力してください' }
	}

	const currentExisting = resolveExistingConflict(
		pair.conflict,
		existingOverrides,
	)

	if (new Date(draft.start_at).getTime() >= new Date(draft.end_at).getTime()) {
		return { ok: false, error: '終了は開始より後にしてください' }
	}

	const nextNewTimes =
		keptSide === 'existing'
			? draft
			: {
					start_at: currentNew.start_at,
					end_at: currentNew.end_at,
					all_day: currentNew.all_day,
				}

	const nextExistingTimes =
		keptSide === 'new'
			? draft
			: {
					start_at: currentExisting.start_at,
					end_at: currentExisting.end_at,
					all_day: currentExisting.all_day,
				}

	if (
		timeRangesConflict(
			nextNewTimes.start_at,
			nextNewTimes.end_at,
			nextExistingTimes.start_at,
			nextExistingTimes.end_at,
		)
	) {
		return { ok: false, error: 'まだ時間が重なっています。ずらしてください' }
	}

	for (let index = 0; index < workingEvents.length; index += 1) {
		const event = workingEvents[index]
		if (!event?.start_at || !event.end_at) continue

		const eventStart =
			index === pair.eventIndex ? nextNewTimes.start_at : event.start_at
		const eventEnd =
			index === pair.eventIndex ? nextNewTimes.end_at : event.end_at

		if (keptSide === 'existing') {
			if (index === pair.eventIndex) continue
			if (
				timeRangesConflict(
					nextNewTimes.start_at,
					nextNewTimes.end_at,
					eventStart,
					eventEnd,
				)
			) {
				return {
					ok: false,
					error: '他の追加予定と時間が重なっています',
				}
			}
			continue
		}

		if (
			timeRangesConflict(
				nextExistingTimes.start_at,
				nextExistingTimes.end_at,
				eventStart,
				eventEnd,
			)
		) {
			return {
				ok: false,
				error: 'ずらした時間が追加予定と重なっています',
			}
		}
	}

	if (keptSide === 'new') {
		for (const [id, override] of Object.entries(existingOverrides)) {
			if (Number(id) === conflictId) continue
			if (
				timeRangesConflict(
					nextExistingTimes.start_at,
					nextExistingTimes.end_at,
					override.start_at,
					override.end_at,
				)
			) {
				return {
					ok: false,
					error: 'ずらした時間が他の既存予定と重なっています',
				}
			}
		}
	}

	const nextOverrides =
		keptSide === 'new'
			? {
					...existingOverrides,
					[conflictId]: {
						title: currentExisting.title,
						location: currentExisting.location,
						...nextExistingTimes,
					},
				}
			: existingOverrides

	const withUpdatedTimes = workingEvents.map((event, index) => {
		if (index !== pair.eventIndex) return event
		if (keptSide !== 'existing') return event

		return {
			...event,
			start_at: nextNewTimes.start_at,
			end_at: nextNewTimes.end_at,
			all_day: nextNewTimes.all_day,
		}
	})

	return {
		ok: true,
		workingEvents: recomputeEventConflicts(
			withUpdatedTimes,
			knownExistings,
			nextOverrides,
			deletedIds,
		),
		existingOverrides: nextOverrides,
		deletedIds,
	}
}

/** ずらした側の時刻をサーバに確認するためのパラメータ */
export function movedSideConflictQuery(
	keptSide: KeptSide,
	draft: ConflictTimeDraft,
	conflictId: number,
	deletedIds: number[] = [],
): { start_at: string; end_at: string; exclude_ids: number[] } {
	const exclude = new Set(deletedIds)
	if (keptSide === 'new') {
		exclude.add(conflictId)
	}

	return {
		start_at: draft.start_at,
		end_at: draft.end_at,
		exclude_ids: [...exclude],
	}
}
