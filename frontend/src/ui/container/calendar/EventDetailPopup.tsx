import type { ReactNode } from 'react'
import {
  ClockIcon,
  MapPinIcon,
  NoteIcon,
  TagIcon,
  XIcon,
} from '@phosphor-icons/react'
import { Text } from '@/ui/common/Text.tsx'
import type { EventDetail } from '@/types/event.ts'
import { formatEventSchedule } from '@/utils/formatEventSchedule.ts'
import { useEventDetailPopup } from '@/hooks/useEventDetailPopup.ts'

export function EventDetailPopup({
  event,
  onClose,
}: {
  event: EventDetail | null
  onClose: () => void
}) {
  const { dialogRef, closeDialog } = useEventDetailPopup(event)

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="event-detail-title"
      onClose={onClose}
    >
      {event && (
        <div className="modal-box bg-base-100">
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
            aria-label="閉じる"
            onClick={closeDialog}
          >
            <XIcon size={24} weight="light" />
          </button>

          <div id="event-detail-title">
            <Text as="h3" size="lg" weight="medium" className="pr-10">
              {event.title.trim() || '無題の予定'}
            </Text>
          </div>

          <dl className="mt-4 flex flex-col gap-3">
            <DetailRow icon={<ClockIcon size={20} />} label="日時">
              {formatEventSchedule(event.start, event.end, event.allDay)}
            </DetailRow>
            <DetailRow icon={<MapPinIcon size={20} />} label="場所">
              {event.location}
            </DetailRow>
            <DetailRow icon={<TagIcon size={20} />} label="カテゴリ">
              {event.category}
            </DetailRow>
            <DetailRow icon={<NoteIcon size={20} />} label="詳細">
              {event.description}
            </DetailRow>
          </dl>
        </div>
      )}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">閉じる</button>
      </form>
    </dialog>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  const value = typeof children === 'string' ? children.trim() : children
  const isEmpty = value == null || value === ''

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-base-content/60" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <Text as="span" size="xs" color="muted" className="block">
          {label}
        </Text>
        <Text
          as="p"
          size="sm"
          color={isEmpty ? 'muted' : 'base'}
          className="whitespace-pre-wrap break-words"
        >
          {isEmpty ? '未入力' : value}
        </Text>
      </div>
    </div>
  )
}
