function pad(value: number): string {
	return String(value).padStart(2, '0')
}

/** Convert an ISO datetime to a `datetime-local` input value in local time. */
export function toDatetimeLocalValue(iso: string): string {
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''

	return [
		date.getFullYear(),
		'-',
		pad(date.getMonth() + 1),
		'-',
		pad(date.getDate()),
		'T',
		pad(date.getHours()),
		':',
		pad(date.getMinutes()),
	].join('')
}

/** Convert an ISO datetime to a `date` input value in local time. */
export function toDateInputValue(iso: string): string {
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''

	return [
		date.getFullYear(),
		'-',
		pad(date.getMonth() + 1),
		'-',
		pad(date.getDate()),
	].join('')
}

/** Convert a `datetime-local` value to an ISO string. */
export function fromDatetimeLocalValue(value: string): string {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return value
	return date.toISOString()
}

/**
 * Build an all-day range from date input values.
 * End date is inclusive in the UI; stored end is exclusive (next midnight local).
 */
export function fromAllDayDateInputs(
	startDate: string,
	endDate: string,
): { start_at: string; end_at: string } {
	const start = new Date(`${startDate}T00:00:00`)
	const endInclusive = new Date(`${endDate}T00:00:00`)
	const endExclusive = new Date(endInclusive)
	endExclusive.setDate(endExclusive.getDate() + 1)

	return {
		start_at: start.toISOString(),
		end_at: endExclusive.toISOString(),
	}
}

/** Inclusive all-day end date for a `date` input (exclusive end → previous day). */
export function toInclusiveAllDayEndDate(endIso: string): string {
	const end = new Date(endIso)
	if (Number.isNaN(end.getTime())) return ''

	if (
		end.getHours() === 0 &&
		end.getMinutes() === 0 &&
		end.getSeconds() === 0 &&
		end.getMilliseconds() === 0
	) {
		end.setDate(end.getDate() - 1)
	}

	return toDateInputValue(end.toISOString())
}
