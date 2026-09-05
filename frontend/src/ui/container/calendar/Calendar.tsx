import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import jaLocale from '@fullcalendar/core/locales/ja'
import { useCalendar } from '@/hooks/useCalendar.ts'
import { Text } from '@/ui/common/Text.tsx'
import { CalendarToolbar } from '@/ui/container/calendar/Toolbar.tsx'
import {
  dayCellClassNames,
  renderDayCell,
  renderDayHeader,
  renderEvent,
  renderSlotLabel,
} from '@/ui/container/calendar/CalendarRenderers.tsx'

type CalendarProps = {
  revision?: number
}

export function Calendar({ revision = 0 }: CalendarProps) {
  const {
    error,
    loadEvents,
    calendarRef,
    wrapRef,
    title,
    currentView,
    handleDatesSet,
    onPrev,
    onNext,
    onToday,
    onChangeView,
  } = useCalendar(revision)

  return (
    <div className="sf-calendar flex h-full min-h-0 min-w-0 w-full flex-1 flex-col bg-base-100 p-3 pr-2 md:p-4 md:pr-3">
      {error && (
        <div role="alert" className="alert alert-error mb-3 shrink-0">
          <Text as="span" size="sm">
            {error}
          </Text>
        </div>
      )}

      <CalendarToolbar
        title={title}
        currentView={currentView}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onChangeView={onChangeView}
      />

      <div ref={wrapRef} className="min-h-0 flex-1 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale={jaLocale}
          height="100%"
          expandRows
          fixedWeekCount={false}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
            omitZeroMinute: true,
          }}
          eventDisplay="block"
          views={{
            timeGridWeek: { displayEventTime: false },
            timeGridDay: { displayEventTime: false },
          }}
          events={loadEvents}
          datesSet={handleDatesSet}
          dayHeaderClassNames="bg-primary py-2"
          dayCellClassNames={dayCellClassNames}
          eventClassNames="font-medium"
          moreLinkClassNames="mx-1.5"
          dayCellContent={renderDayCell}
          dayHeaderContent={renderDayHeader}
          eventContent={renderEvent}
          slotLabelContent={renderSlotLabel}
        />
      </div>
    </div>
  )
}
