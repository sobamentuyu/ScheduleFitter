import type { ConflictTimeDraft } from '@/utils/conflictResolution.ts'

export type ConflictPreviewEvent = ConflictTimeDraft & {
	title: string
	location?: string | null
	inConflict: boolean
}

export type ConflictCalendarPreview = {
	/** フォーカスする日付（ISO） */
	focusDate: string
	/** true なら週表示、false なら日表示 */
	useWeekView: boolean
	newEvent: ConflictPreviewEvent | null
	/** 追加候補同士の衝突で、もう一方の新規予定 */
	peerEvent: ConflictPreviewEvent | null
	existingEvent: (ConflictPreviewEvent & { id: number }) | null
	/** 解決中に削除予定の既存 ID */
	deletedIds: number[]
	/** 解決中にずらした既存の時刻 */
	existingOverrides: Record<
		number,
		Pick<ConflictTimeDraft, 'start_at' | 'end_at' | 'all_day'>
	>
} | null
