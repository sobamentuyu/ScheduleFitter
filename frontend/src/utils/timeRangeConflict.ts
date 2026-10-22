/** True when two half-open ranges conflict. Touching boundaries do not count. */
export function timeRangesConflict(
	startA: string,
	endA: string,
	startB: string,
	endB: string,
): boolean {
	const aStart = new Date(startA).getTime()
	const aEnd = new Date(endA).getTime()
	const bStart = new Date(startB).getTime()
	const bEnd = new Date(endB).getTime()

	if (
		Number.isNaN(aStart) ||
		Number.isNaN(aEnd) ||
		Number.isNaN(bStart) ||
		Number.isNaN(bEnd)
	) {
		return false
	}

	return aStart < bEnd && aEnd > bStart
}
