import { useContext } from 'react'
import { ConflictPreviewContext } from '@/contexts/conflictPreview.ts'

export function useConflictPreview() {
	const context = useContext(ConflictPreviewContext)
	if (!context) {
		throw new Error(
			'useConflictPreview must be used within ConflictPreviewProvider',
		)
	}
	return context
}
