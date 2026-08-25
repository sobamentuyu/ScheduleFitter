import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { Text } from '@/ui/common/Text.tsx'
import { VIEWS, type CalendarView } from '@/constants/calendarViews.ts'

function ViewSwitcher({
  currentView,
  onChange,
}: {
  currentView: CalendarView
  onChange: (view: CalendarView) => void
}) {
  return (
    <div className="join justify-self-end rounded-full bg-secondary p-0.5 sm:col-start-3">
      {VIEWS.map((view) => {
        const active = currentView === view.id
        return (
          <button
            key={view.id}
            type="button"
            className={`btn btn-sm join-item rounded-full border-none shadow-none ${
              active ? 'bg-primary' : 'btn-ghost'
            }`}
            onClick={() => onChange(view.id)}
          >
            <Text as="span" size="sm" color={active ? 'primaryContent' : 'base'}>
              {view.label}
            </Text>
          </button>
        )
      })}
    </div>
  )
}

export function CalendarToolbar({
  title,
  currentView,
  onPrev,
  onNext,
  onToday,
  onChangeView,
}: {
  title: string
  currentView: CalendarView
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onChangeView: (view: CalendarView) => void
}) {
  return (
    <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-y-2 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full hover:bg-primary"
          aria-label="前へ"
          onClick={onPrev}
        >
          <CaretLeftIcon size={24} weight="regular" />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full hover:bg-primary"
          aria-label="次へ"
          onClick={onNext}
        >
          <CaretRightIcon size={24} weight="regular" />
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm rounded-full shadow-none"
          onClick={onToday}
        >
          <Text as="span" size="sm" color="primaryContent">
            今日
          </Text>
        </button>
      </div>

      <ViewSwitcher currentView={currentView} onChange={onChangeView} />

      <Text
        as="h2"
        size="lg"
        className="col-span-2 text-center sm:col-span-1 sm:col-start-2 sm:row-start-1"
      >
        {title}
      </Text>
    </div>
  )
}
