import { Calendar } from '@/ui/container/calendar/Calendar.tsx'

export function Top() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-base-200">
      <Calendar />
    </div>
  )
}
