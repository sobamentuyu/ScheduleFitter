import type { ConflictTimeDraft } from '@/utils/conflictResolution.ts'
import { timeRangesConflict } from '@/utils/timeRangeConflict.ts'

export type ShiftDirection = 'before' | 'after'

export type OccupiedRange = {
	start_at: string
	end_at: string
}

export const NO_SHIFT_SUGGESTION_MESSAGE =
	'提案できる時間がないです。自分で変更してください'

export type SuggestShiftResult =
	| { ok: true; draft: ConflictTimeDraft }
	| { ok: false; error: string }

const HOUR_MS = 60 * 60 * 1000
const MAX_OFFSET_HOURS = 6

function durationMs(startAt: string, endAt: string): number {
	return new Date(endAt).getTime() - new Date(startAt).getTime()
}

function addMs(iso: string, ms: number): string {
	return new Date(new Date(iso).getTime() + ms).toISOString()
}

function addDays(iso: string, days: number): string {
	const date = new Date(iso)
	date.setDate(date.getDate() + days)
	return date.toISOString()
}

function isOccupied(
	startAt: string,
	endAt: string,
	occupied: OccupiedRange[],
): boolean {
	return occupied.some((range) =>
		timeRangesConflict(startAt, endAt, range.start_at, range.end_at),
	)
}

/** 継続時間を保ったまま開始を動かした draft を作る */
export function draftWithPreservedDuration(
	original: ConflictTimeDraft,
	nextStartAt: string,
): ConflictTimeDraft {
	const duration = durationMs(original.start_at, original.end_at)
	return {
		start_at: nextStartAt,
		end_at: addMs(nextStartAt, duration),
		all_day: original.all_day,
	}
}

export function suggestConflictShift(input: {
	direction: ShiftDirection
	moving: ConflictTimeDraft
	priority: ConflictTimeDraft
	occupied: OccupiedRange[]
}): SuggestShiftResult {
	const { direction, moving, priority, occupied } = input
	const duration = durationMs(moving.start_at, moving.end_at)

	if (!(duration > 0)) {
		return { ok: false, error: NO_SHIFT_SUGGESTION_MESSAGE }
	}

	const involvesAllDay = moving.all_day || priority.all_day
	if (involvesAllDay) {
		const dayOffset = direction === 'before' ? -1 : 1
		const candidate: ConflictTimeDraft = {
			start_at: addDays(moving.start_at, dayOffset),
			end_at: addDays(moving.end_at, dayOffset),
			all_day: moving.all_day,
		}

		if (isOccupied(candidate.start_at, candidate.end_at, occupied)) {
			return { ok: false, error: NO_SHIFT_SUGGESTION_MESSAGE }
		}

		return { ok: true, draft: candidate }
	}

	if (duration > MAX_OFFSET_HOURS * HOUR_MS) {
		return { ok: false, error: NO_SHIFT_SUGGESTION_MESSAGE }
	}

	for (let hours = 1; hours <= MAX_OFFSET_HOURS; hours += 1) {
		const offsetMs = hours * HOUR_MS
		let startAt: string
		let endAt: string

		if (direction === 'before') {
			endAt = addMs(priority.start_at, -offsetMs)
			startAt = addMs(endAt, -duration)
		} else {
			startAt = addMs(priority.end_at, offsetMs)
			endAt = addMs(startAt, duration)
		}

		if (!isOccupied(startAt, endAt, occupied)) {
			return {
				ok: true,
				draft: {
					start_at: startAt,
					end_at: endAt,
					all_day: false,
				},
			}
		}
	}

	return { ok: false, error: NO_SHIFT_SUGGESTION_MESSAGE }
}

/** 現ペアが draft 適用後も重なるか */
export function isPairStillConflicting(input: {
	keptSide: 'new' | 'existing'
	newEvent: ConflictTimeDraft
	existingEvent: ConflictTimeDraft
	draft: ConflictTimeDraft | null
}): boolean {
	const { keptSide, newEvent, existingEvent, draft } = input
	if (!draft) {
		return timeRangesConflict(
			newEvent.start_at,
			newEvent.end_at,
			existingEvent.start_at,
			existingEvent.end_at,
		)
	}

	const nextNew = keptSide === 'existing' ? draft : newEvent
	const nextExisting = keptSide === 'new' ? draft : existingEvent

	return timeRangesConflict(
		nextNew.start_at,
		nextNew.end_at,
		nextExisting.start_at,
		nextExisting.end_at,
	)
}
