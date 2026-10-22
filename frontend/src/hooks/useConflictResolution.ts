import { useMemo, useState } from 'react'
import { fetchEventConflicts } from '@/api/events.ts'
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
	recomputeEventConflicts,
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
	const [knownExistings, setKnownExistings] = useState<
		Record<number, ConflictingEvent>
	>(() => collectOriginalConflicts(events))
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
	const [completedCount, setCompletedCount] = useState(0)
	const currentPair = queue[0] ?? null
	const hasUnresolvedConflicts = currentPair !== null

	const currentNew = currentPair
		? (workingEvents[currentPair.eventIndex] ?? null)
		: null
	const currentExisting = currentPair
		? resolveExistingConflict(currentPair.conflict, existingOverrides)
		: null

	// 解決の途中で新しい衝突が増えても追えるように、完了数＋残件数で総数を出す
	const progress = {
		current: hasUnresolvedConflicts ? completedCount + 1 : completedCount,
		total: completedCount + queue.length,
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

	const resetPairUi = () => {
		setKeptSide(null)
		setAction('reschedule')
		setDraft(null)
		setError(null)
	}

	const confirmResolution = async (): Promise<boolean> => {
		if (!currentPair || !keptSide || isChecking) return false
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
			const query = movedSideConflictQuery(
				keptSide,
				draft,
				currentPair.conflict.id,
				deletedIds,
			)
			// カレンダー上の未知の予定はサーバで確認。隣接は通常追加と同じ半開区間で除外。
			const fromServer = filterActiveConflicts(
				draft.start_at,
				draft.end_at,
				await fetchEventConflicts(query),
			)

			if (keptSide === 'new') {
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

			// 新規をずらしたあと:
			// 1) サーバで新たに見つかった既存を既知に合流
			// 2) override 込みのカレンダーで conflicts を再計算
			// → 手順3で動かした既存Aと、手順4で動かした新規Yの重なりをここで検出する
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
