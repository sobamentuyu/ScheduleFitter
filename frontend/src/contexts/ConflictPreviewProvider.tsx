import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { ConflictCalendarPreview } from '@/types/conflictPreview.ts'
import { ConflictPreviewContext } from '@/contexts/conflictPreview.ts'

function previewFingerprint(preview: ConflictCalendarPreview): string {
	return JSON.stringify(preview)
}

export function ConflictPreviewProvider({ children }: { children: ReactNode }) {
	const [preview, setPreviewState] = useState<ConflictCalendarPreview>(null)

	const setPreview = useCallback((next: ConflictCalendarPreview) => {
		setPreviewState((prev) => {
			if (prev === next) return prev
			if (previewFingerprint(prev) === previewFingerprint(next)) return prev
			return next
		})
	}, [])

	const value = useMemo(() => ({ preview, setPreview }), [preview, setPreview])

	return (
		<ConflictPreviewContext.Provider value={value}>
			{children}
		</ConflictPreviewContext.Provider>
	)
}
