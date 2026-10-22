import { useMemo, useState } from 'react'
import { fetchEventConflicts } from '@/api/events.ts'
import type { ScheduleSuggestionEvent } from '@/types/scheduleSuggestion.ts'
import {
	applyConflictResolution,
	buildConflictQueue,
	cloneSuggestionEvents,
	collectOriginalConflicts,
	filterActiveConflicts,
	filterPendingChangesForSelected,
	movedSideConflictQuery,
	refreshSuggestionEventStatus,
	resolveExistingConflict,
	type ConflictTimeDraft,
	type ExistingOverride,
	type KeptSide,
	type ResolutionAction,
} from '@/utils/conflictResolution.ts'

export function useConflictResolution(events: ScheduleSuggestionEvent[]) {
	const [workingEvents, setWorkingEvents] = useState(() =>
		cloneSuggestionEvents(events),
	)
	const [originalConflicts] = useState(() => collectOriginalConflicts(events))
	const [existingOverrides, setExistingOverrides] = useState<
		Record<number, ExistingOverride>
	>({})
	const [deletedIds, setDeletedIds] = useState<number[]>([])
	const [keptSide, setKeptSide] = useState<KeptSide | null>(null)
	const [action, setAction] = useState<ResolutionAction>('reschedule')
	const [draft, setDraft] = useState<ConflictTimeDraft | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isChecking, setIsChecking] = useState(false)

	const queue = useMemo(() => buildConflictQueue(workingEvents), [workingEvents])
	const [initialTotal] = useState(() => buildConflictQueue(events).length)
	const currentPair = queue[0] ?? null
	const hasUnresolvedConflicts = currentPair !== null

	const currentNew = currentPair
		? (workingEvents[currentPair.eventIndex] ?? null)
		: null
	const currentExisting = currentPair
		? resolveExistingConflict(currentPair.conflict, existingOverrides)
		: null

	const resolvedCount = Math.max(0, initialTotal - queue.length)
	const progress = {
		current: hasUnresolvedConflicts
			? Math.min(resolvedCount + 1, initialTotal)
			: resolvedCount,
		total: initialTotal,
	}

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

	const selectKeptSide = (next: KeptSide) => {
		if (!currentNew || !currentExisting || isChecking) return
		const nextDraft = draftFromOtherSide(next)
		if (!nextDraft) return

		setKeptSide(next)
		setAction('reschedule')
		setDraft(nextDraft)
		setError(null)
	}

	const selectAction = (next: ResolutionAction) => {
		if (!keptSide || isChecking) return
		setAction(next)
		setError(null)
		if (next === 'reschedule') {
			setDraft((current) => current ?? draftFromOtherSide(keptSide))
			return
		}
		setDraft(null)
	}

	const updateDraft = (patch: Partial<ConflictTimeDraft>) => {
		if (isChecking || action !== 'reschedule') return
		setDraft((current) => (current ? { ...current, ...patch } : current))
		setError(null)
	}

	const confirmResolution = async (): Promise<boolean> => {
		if (!currentPair || !keptSide || isChecking) return false
		if (action === 'reschedule' && !draft) return false

		const result = applyConflictResolution({
			workingEvents,
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
			setKeptSide(null)
			setAction('reschedule')
			setDraft(null)
			setError(null)
			return true
		}

		if (!draft) return false

		setIsChecking(true)
		setError(null)
		try {
			const query = movedSideConflictQuery(
				keptSide,
				draft,
				currentPair.conflict.id,
				deletedIds,
			)
			// 通常の予定追加と同じ半開区間判定で隣接（12:00終了と12:00開始）は非衝突
			const remaining = filterActiveConflicts(
				draft.start_at,
				draft.end_at,
				await fetchEventConflicts(query),
			)

			if (keptSide === 'new') {
				if (remaining.length > 0) {
					setError('ずらした時間がほかの予定と重なっています')
					return false
				}

				setExistingOverrides(result.existingOverrides)
				setDeletedIds(result.deletedIds)
				setWorkingEvents(result.workingEvents)
				setKeptSide(null)
				setAction('reschedule')
				setDraft(null)
				setError(null)
				return true
			}

			// 新規側をずらした場合は、サーバ確認結果を通常追加と同じ衝突リストとして反映する
			const nextEvents = result.workingEvents.map((event, index) => {
				if (index !== currentPair.eventIndex) return event
				return refreshSuggestionEventStatus({
					...event,
					start_at: draft.start_at,
					end_at: draft.end_at,
					all_day: draft.all_day,
					conflicts: remaining,
				})
			})

			setExistingOverrides(result.existingOverrides)
			setDeletedIds(result.deletedIds)
			setWorkingEvents(nextEvents)
			setKeptSide(null)
			setAction('reschedule')
			setDraft(null)
			setError(null)
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

	return {
		workingEvents,
		hasUnresolvedConflicts,
		currentNew,
		currentExisting,
		keptSide,
		action,
		draft,
		error,
		progress,
		pendingChangesFor,
		isChecking,
		selectKeptSide,
		selectAction,
		updateDraft,
		confirmResolution,
	}
}
