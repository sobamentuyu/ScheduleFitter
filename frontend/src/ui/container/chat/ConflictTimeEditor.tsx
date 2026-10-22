import type { ConflictTimeDraft } from '@/utils/conflictResolution.ts'
import {
	fromAllDayDateInputs,
	fromDatetimeLocalValue,
	toDateInputValue,
	toDatetimeLocalValue,
	toInclusiveAllDayEndDate,
} from '@/utils/datetimeLocal.ts'

type ConflictTimeEditorProps = {
	draft: ConflictTimeDraft
	disabled?: boolean
	onChange: (patch: Partial<ConflictTimeDraft>) => void
}

export function ConflictTimeEditor({
	draft,
	disabled = false,
	onChange,
}: ConflictTimeEditorProps) {
	if (draft.all_day) {
		const startDate = toDateInputValue(draft.start_at)
		const endDate = toInclusiveAllDayEndDate(draft.end_at)

		return (
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium">時間をずらしてください</p>
				<label className="form-control w-full">
					<span className="label-text text-xs">開始日</span>
					<input
						type="date"
						className="input input-bordered input-sm w-full"
						value={startDate}
						disabled={disabled}
						onChange={(event) => {
							const nextStart = event.target.value
							if (!nextStart) return
							const range = fromAllDayDateInputs(
								nextStart,
								endDate || nextStart,
							)
							onChange(range)
						}}
					/>
				</label>
				<label className="form-control w-full">
					<span className="label-text text-xs">終了日</span>
					<input
						type="date"
						className="input input-bordered input-sm w-full"
						value={endDate}
						disabled={disabled}
						onChange={(event) => {
							const nextEnd = event.target.value
							if (!nextEnd) return
							const range = fromAllDayDateInputs(
								startDate || nextEnd,
								nextEnd,
							)
							onChange(range)
						}}
					/>
				</label>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs font-medium">時間をずらしてください</p>
			<label className="form-control w-full">
				<span className="label-text text-xs">開始</span>
				<input
					type="datetime-local"
					className="input input-bordered input-sm w-full"
					value={toDatetimeLocalValue(draft.start_at)}
					disabled={disabled}
					onChange={(event) => {
						const value = event.target.value
						if (!value) return
						onChange({ start_at: fromDatetimeLocalValue(value) })
					}}
				/>
			</label>
			<label className="form-control w-full">
				<span className="label-text text-xs">終了</span>
				<input
					type="datetime-local"
					className="input input-bordered input-sm w-full"
					value={toDatetimeLocalValue(draft.end_at)}
					disabled={disabled}
					onChange={(event) => {
						const value = event.target.value
						if (!value) return
						onChange({ end_at: fromDatetimeLocalValue(value) })
					}}
				/>
			</label>
		</div>
	)
}
