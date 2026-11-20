import { useEffect, useMemo, useState } from 'react'
import { fetchEventConflicts, fetchEvents } from '@/api/events.ts'
import type { ConflictCalendarPreview } from '@/types/conflictPreview.ts'
import type { CalendarEvent } from '@/types/event.ts'
import type {
	ConflictingEvent,
	ScheduleSuggestionEvent,
} from '@/types/scheduleSuggestion.ts'
import {
	applyConflictResolution,
	buildConflictQueue,
	cloneSuggestionEvents,
	collectOriginalConflicts,
	filterActiveConflicts,
	filterPendingChangesForSelected,
	mergeKnownExistings,
	movedSideConflictQuery,
	peerConflictIndices,
	recomputeEventConflicts,
	resolveExistingConflict,
	type ConflictTimeDraft,
	type ExistingOverride,
	type KeptSide,
} from '@/utils/conflictResolution.ts'
import {
	draftWithPreservedDuration,
	isPairStillConflicting,
	suggestConflictShift,
	type OccupiedRange,
	type ShiftDirection,
} from '@/utils/suggestConflictShift.ts'
import { timeRangesConflict } from '@/utils/timeRangeConflict.ts'

export type ShiftUiMode = 'before' | 'after' | 'picker' | null

function sameCalendarDay(a: string, b: string): boolean {
	const left = new Date(a)
	const right = new Date(b)
	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	)
}

export function useConflictResolution(
	events: ScheduleSuggestionEvent[],
	setPreview?: (preview: ConflictCalendarPreview) => void,
) {
	const [workingEvents, setWorkingEvents] = useState(() =>
		cloneSuggestionEvents(events),
	)
	const [originalConflicts] = useState(() => collectOriginalConflicts(events))
	const [knownExistings, setKnownExistings] = useState<
		Record<number, ConflictingEvent>
	>(() => collectOriginalConflicts(events))
	const [existingOverrides, setExistingOverrides] = useState<
		Record<number, ExistingOverride>
	>({})
	const [deletedIds, setDeletedIds] = useState<number[]>([])
	const [keptSide, setKeptSide] = useState<KeptSide | null>(null)
	const [draft, setDraft] = useState<ConflictTimeDraft | null>(null)
	const [shiftMode, setShiftMode] = useState<ShiftUiMode>(null)
	const [error, setError] = useState<string | null>(null)
	const [isChecking, setIsChecking] = useState(false)
	// 保存済みのカレンダー予定（前後1日）。null は取得中
	const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[] | null>(
		null,
	)
	const isCalendarLoading = calendarEvents === null

	useEffect(() => {
		let cancelled = false
		const DAY_MS = 24 * 60 * 60 * 1000
		const timed = events.filter((event) => event.start_at && event.end_at)
		const now = Date.now()
		const starts = timed.map((event) => new Date(event.start_at as string).getTime())
		const ends = timed.map((event) => new Date(event.end_at as string).getTime())
		const rangeStart = timed.length > 0 ? Math.min(...starts) : now
		const rangeEnd = timed.length > 0 ? Math.max(...ends) : now

		fetchEvents(
			new Date(rangeStart - DAY_MS).toISOString(),
			new Date(rangeEnd + DAY_MS).toISOString(),
		)
			.then((list) => {
				if (!cancelled) setCalendarEvents(list)
			})
			.catch(() => {
				if (cancelled) return
				setCalendarEvents([])
				setError('カレンダーの予定を確認できませんでした。確定時に重複を再確認します')
			})

		return () => {
			cancelled = true
		}
	}, [events])

	const queue = useMemo(() => buildConflictQueue(workingEvents), [workingEvents])
	const [completedCount, setCompletedCount] = useState(0)
	const currentPair = queue[0] ?? null
	const hasUnresolvedConflicts = currentPair !== null

	const currentNew = currentPair
		? (workingEvents[currentPair.eventIndex] ?? null)
		: null
	const currentExisting = useMemo(() => {
		if (!currentPair) return null
		if (currentPair.kind === 'existing') {
			return resolveExistingConflict(currentPair.conflict, existingOverrides)
		}
		const peer = workingEvents[currentPair.peerIndex]
		if (!peer?.start_at || !peer.end_at) return null
		return {
			title: peer.title,
			location: peer.location,
			start_at: peer.start_at,
			end_at: peer.end_at,
			all_day: peer.all_day,
		}
	}, [currentPair, existingOverrides, workingEvents])
	const pairKind = currentPair?.kind ?? null

	const progress = {
		current: hasUnresolvedConflicts ? completedCount + 1 : completedCount,
		total: completedCount + queue.length,
	}

	const conflictFreeEvents = useMemo(() => {
		const peerIndices = peerConflictIndices(workingEvents)
		return workingEvents.filter(
			(event, index) =>
				event.status === 'ready' &&
				(event.conflicts?.length ?? 0) === 0 &&
				!peerIndices.has(index),
		)
	}, [workingEvents])

	const pendingChangesFor = (selected: ScheduleSuggestionEvent[]) =>
		filterPendingChangesForSelected(
			selected,
			existingOverrides,
			deletedIds,
			originalConflicts,
		)

	const draftFromOtherSide = (next: KeptSide): ConflictTimeDraft | null => {
		if (!currentNew || !currentExisting) return null
		const source = next === 'new' ? currentExisting : currentNew
		if (!source.start_at || !source.end_at) return null
		return {
			start_at: source.start_at,
			end_at: source.end_at,
			all_day: source.all_day,
		}
	}

	/**
	 * 優先側を動かさない前提で、ほかの予定がすでに埋めている時間帯を集める。
	 * 保存済みカレンダー予定・ほかの追加候補・既存の移動後の時刻を含める。
	 * 動かす側（keptSide の反対）は除外する。
	 */
	const buildOccupiedRanges = (nextKept: KeptSide): OccupiedRange[] => {
		if (!currentPair) return []

		const deleted = new Set(deletedIds)
		const movingExistingId =
			currentPair.kind === 'existing' && nextKept === 'new'
				? currentPair.conflict.id
				: null
		const movingSuggestionIndex =
			currentPair.kind === 'peer'
				? nextKept === 'new'
					? currentPair.peerIndex
					: currentPair.eventIndex
				: nextKept === 'existing'
					? currentPair.eventIndex
					: -1
		const ranges: OccupiedRange[] = []
		const seenExistingIds = new Set<number>()

		const pushExisting = (existing: {
			id: number
			start_at: string
			end_at: string
		}) => {
			if (deleted.has(existing.id)) return
			if (movingExistingId !== null && existing.id === movingExistingId) return
			if (seenExistingIds.has(existing.id)) return
			seenExistingIds.add(existing.id)
			const resolved = existingOverrides[existing.id] ?? existing
			ranges.push({ start_at: resolved.start_at, end_at: resolved.end_at })
		}

		for (const calendarEvent of calendarEvents ?? []) {
			pushExisting({
				id: calendarEvent.id,
				start_at: calendarEvent.start_at,
				end_at: calendarEvent.end_at,
			})
		}
		for (const existing of Object.values(knownExistings)) {
			pushExisting(existing)
		}

		workingEvents.forEach((event, index) => {
			if (!event.start_at || !event.end_at) return
			if (index === movingSuggestionIndex) return
			ranges.push({ start_at: event.start_at, end_at: event.end_at })
		})

		return ranges
	}

	// 解決ペアの衝突に加え、動かした側がほかの予定と重なっていないかも見る
	const pairStillConflicting = (() => {
		if (!keptSide || !currentNew?.start_at || !currentNew.end_at || !currentExisting) {
			return true
		}
		const pairConflict = isPairStillConflicting({
			keptSide,
			newEvent: {
				start_at: currentNew.start_at,
				end_at: currentNew.end_at,
				all_day: currentNew.all_day,
			},
			existingEvent: {
				start_at: currentExisting.start_at,
				end_at: currentExisting.end_at,
				all_day: currentExisting.all_day,
			},
			draft,
		})
		if (pairConflict) return true
		if (!draft) return false
		return buildOccupiedRanges(keptSide).some((range) =>
			timeRangesConflict(
				draft.start_at,
				draft.end_at,
				range.start_at,
				range.end_at,
			),
		)
	})()

	const selectKeptSide = (next: KeptSide) => {
		if (!currentNew || !currentExisting || isChecking) return
		const nextDraft = draftFromOtherSide(next)
		if (!nextDraft) return

		setKeptSide(next)
		setDraft(nextDraft)
		setShiftMode(null)
		setError(null)
	}

	const applySuggestedShift = (direction: ShiftDirection) => {
		if (!keptSide || !currentNew || !currentExisting || isChecking) return

		const moving = draftFromOtherSide(keptSide)
		const priority =
			keptSide === 'new'
				? {
						start_at: currentNew.start_at as string,
						end_at: currentNew.end_at as string,
						all_day: currentNew.all_day,
					}
				: {
						start_at: currentExisting.start_at,
						end_at: currentExisting.end_at,
						all_day: currentExisting.all_day,
					}

		if (!moving) return

		const result = suggestConflictShift({
			direction,
			moving,
			priority,
			occupied: buildOccupiedRanges(keptSide),
		})

		setShiftMode(direction)
		if (!result.ok) {
			setError(result.error)
			return
		}

		setDraft(result.draft)
		setError(null)
	}

	const openPicker = () => {
		if (!keptSide || isChecking) return
		setShiftMode('picker')
		setDraft((current) => current ?? draftFromOtherSide(keptSide))
		setError(null)
	}

	const updateDraft = (patch: Partial<ConflictTimeDraft>) => {
		if (isChecking) return
		setShiftMode('picker')
		setDraft((current) => {
			if (!current) return current
			if (patch.start_at && patch.end_at === undefined) {
				return {
					...draftWithPreservedDuration(current, patch.start_at),
					...(patch.all_day !== undefined ? { all_day: patch.all_day } : {}),
				}
			}
			return { ...current, ...patch }
		})
		setError(null)
	}

	const resetPairUi = () => {
		setKeptSide(null)
		setDraft(null)
		setShiftMode(null)
		setError(null)
	}

	const confirmResolution = async (): Promise<boolean> => {
		if (!currentPair || !keptSide || isChecking) return false

		const action = pairStillConflicting ? 'delete' : 'reschedule'
		if (action === 'reschedule' && !draft) return false

		const result = applyConflictResolution({
			workingEvents,
			knownExistings,
			existingOverrides,
			deletedIds,
			pair: currentPair,
			keptSide,
			action,
			draft,
		})

		if (!result.ok) {
			setError(result.error)
			return false
		}

		if (action === 'delete') {
			setExistingOverrides(result.existingOverrides)
			setDeletedIds(result.deletedIds)
			setWorkingEvents(result.workingEvents)
			setCompletedCount((count) => count + 1)
			resetPairUi()
			return true
		}

		if (!draft) return false

		setIsChecking(true)
		setError(null)
		try {
			const query =
				currentPair.kind === 'peer'
					? {
							start_at: draft.start_at,
							end_at: draft.end_at,
							exclude_ids: [...deletedIds],
						}
					: movedSideConflictQuery(
							keptSide,
							draft,
							currentPair.conflict.id,
							deletedIds,
						)
			const fromServer = filterActiveConflicts(
				draft.start_at,
				draft.end_at,
				await fetchEventConflicts(query),
			)

			const movingSavedEvent =
				currentPair.kind === 'existing' && keptSide === 'new'
			if (movingSavedEvent) {
				if (fromServer.length > 0) {
					setError('ずらした時間がほかの予定と重なっています')
					return false
				}

				setExistingOverrides(result.existingOverrides)
				setDeletedIds(result.deletedIds)
				setWorkingEvents(result.workingEvents)
				setCompletedCount((count) => count + 1)
				resetPairUi()
				return true
			}

			const nextKnown = mergeKnownExistings(knownExistings, fromServer)
			const nextEvents = recomputeEventConflicts(
				result.workingEvents,
				nextKnown,
				result.existingOverrides,
				result.deletedIds,
			)

			setKnownExistings(nextKnown)
			setExistingOverrides(result.existingOverrides)
			setDeletedIds(result.deletedIds)
			setWorkingEvents(nextEvents)
			setCompletedCount((count) => count + 1)
			resetPairUi()
			return true
		} catch (error) {
			setError(
				error instanceof Error && error.message.trim() !== ''
					? error.message
					: '重複の確認に失敗しました',
			)
			return false
		} finally {
			setIsChecking(false)
		}
	}

	useEffect(() => {
		if (!setPreview) return

		if (!hasUnresolvedConflicts || !currentNew || !currentExisting || !currentPair) {
			setPreview(null)
			return
		}

		const editingNew = keptSide === 'existing'
		const editingExisting = keptSide === 'new'
		const displayNew =
			editingNew && draft
				? draft
				: currentNew.start_at && currentNew.end_at
					? {
							start_at: currentNew.start_at,
							end_at: currentNew.end_at,
							all_day: currentNew.all_day,
						}
					: null
		const displayExisting =
			editingExisting && draft
				? draft
				: {
						start_at: currentExisting.start_at,
						end_at: currentExisting.end_at,
						all_day: currentExisting.all_day,
					}

		if (!displayNew) {
			setPreview(null)
			return
		}

		const inConflict = pairStillConflicting

		const focusDate = displayNew.start_at
		const useWeekView = !sameCalendarDay(
			displayNew.start_at,
			displayExisting.start_at,
		)

		const overridesForPreview: Record<
			number,
			Pick<ConflictTimeDraft, 'start_at' | 'end_at' | 'all_day'>
		> = {}
		for (const [id, override] of Object.entries(existingOverrides)) {
			overridesForPreview[Number(id)] = {
				start_at: override.start_at,
				end_at: override.end_at,
				all_day: override.all_day,
			}
		}
		if (currentPair.kind === 'existing' && editingExisting && draft) {
			overridesForPreview[currentPair.conflict.id] = {
				start_at: draft.start_at,
				end_at: draft.end_at,
				all_day: draft.all_day,
			}
		}

		const otherPreview = {
			title: currentExisting.title,
			location: currentExisting.location,
			...displayExisting,
			inConflict,
		}

		setPreview({
			focusDate,
			useWeekView,
			newEvent: {
				title: currentNew.title,
				location: currentNew.location,
				...displayNew,
				inConflict,
			},
			existingEvent:
				currentPair.kind === 'existing'
					? {
							id: currentPair.conflict.id,
							...otherPreview,
						}
					: null,
			peerEvent: currentPair.kind === 'peer' ? otherPreview : null,
			deletedIds,
			existingOverrides: overridesForPreview,
		})
	}, [
		setPreview,
		hasUnresolvedConflicts,
		currentNew,
		currentExisting,
		currentPair,
		keptSide,
		draft,
		deletedIds,
		existingOverrides,
		pairStillConflicting,
	])

	useEffect(() => {
		return () => {
			setPreview?.(null)
		}
	}, [setPreview])

	return {
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
	}
}
