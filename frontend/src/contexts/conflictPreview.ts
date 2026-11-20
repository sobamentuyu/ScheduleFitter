import { createContext } from 'react'
import type { ConflictCalendarPreview } from '@/types/conflictPreview.ts'

export type ConflictPreviewContextValue = {
	preview: ConflictCalendarPreview
	setPreview: (preview: ConflictCalendarPreview) => void
}

export const ConflictPreviewContext =
	createContext<ConflictPreviewContextValue | null>(null)
