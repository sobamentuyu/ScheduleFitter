import { useEffect, useRef } from 'react'
import type { EventDetail } from '@/types/event.ts'

export function useEventDetailPopup(event: EventDetail | null) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (event && !dialog.open) {
      dialog.showModal()
    } else if (!event && dialog.open) {
      dialog.close()
    }
  }, [event])

  return {
    dialogRef,
    closeDialog: () => dialogRef.current?.close(),
  }
}
