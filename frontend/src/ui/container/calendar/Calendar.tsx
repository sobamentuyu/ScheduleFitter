import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import { useCalendar } from "@/hooks/useCalendar.ts";
import { Text } from "@/ui/common/Text.tsx";
import { CalendarToolbar } from "@/ui/container/calendar/Toolbar.tsx";
import { EventDetailPopup } from "@/ui/container/calendar/EventDetailPopup.tsx";
import {
  dayCellClassNames,
  renderDayCell,
  renderDayHeader,
  renderEvent,
  renderSlotLabel,
} from "@/ui/container/calendar/CalendarRenderers.tsx";
type CalendarProps = {
  revision?: number;
  compactMonth?: boolean;
};

export function Calendar({ revision = 0, compactMonth = false }: CalendarProps) {
  const {
    error,
    loadEvents,
    calendarRef,
    wrapRef,
    title,
    currentView,
    selectedEvent,
    showBackToMonth,
    handleDatesSet,
    handleEventClick,
    handleDateClick,
    closeEventDetail,
    onPrev,
    onNext,
    onToday,
    onChangeView,
    onBackToMonth,
    onDeleteEvent,
    onSaveEvent,
  } = useCalendar(revision);
  const [compactEventRows, setCompactEventRows] = useState(1);

  useEffect(() => {
    if (!compactMonth || currentView !== "dayGridMonth") return;
    const monthBody = wrapRef.current?.querySelector<HTMLElement>(".fc-daygrid-body");
    const scroller = monthBody?.closest<HTMLElement>(".fc-scroller");
    const weeks = monthBody?.querySelector<HTMLTableElement>("table")?.tBodies[0]?.rows.length;
    const dateHeader = monthBody?.querySelector<HTMLElement>(".fc-daygrid-day-top");
    if (!monthBody || !scroller || !weeks || !dateHeader) return;

    monthBody.style.setProperty("--compact-month-weeks", String(weeks));
    const updateRowLimit = () => {
      const eventHeight = Number.parseFloat(
        getComputedStyle(monthBody).getPropertyValue("--compact-month-event-height"),
      );
      if (!eventHeight) return;

      // The calendar needs one line for the overflow link when more events exist.
      const weekHeight = Math.floor(scroller.clientHeight / weeks);
      const availableHeight = weekHeight - dateHeader.offsetHeight - 2;
      setCompactEventRows(Math.max(1, Math.min(4, Math.floor(availableHeight / eventHeight))));
    };

    const observer = new ResizeObserver(updateRowLimit);
    observer.observe(scroller);
    observer.observe(dateHeader);
    return () => {
      observer.disconnect();
      monthBody.style.removeProperty("--compact-month-weeks");
    };
  }, [compactMonth, currentView, title, wrapRef]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const stopOverflowActivation = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Stop activation before FullCalendar's more-link handler opens its popover.
    if (!compactMonth || currentView !== "dayGridMonth") return;
    if (!(e.target instanceof Element) || !e.target.closest(".fc-daygrid-more-link")) return;
    if ("key" in e && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) onPrev();
    else onNext();
  };

  return (
    <div data-compact-month={compactMonth || undefined} className="sf-calendar flex h-full min-h-0 min-w-0 w-full flex-1 flex-col bg-base-100 p-3 pr-2 md:p-4 md:pr-3">
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
        showBackToMonth={showBackToMonth}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onChangeView={onChangeView}
        onBackToMonth={onBackToMonth}
      />

      <div
        onClickCapture={stopOverflowActivation}
        onKeyDownCapture={stopOverflowActivation}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        ref={wrapRef}
        className="min-h-0 flex-1 overflow-hidden"
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale={jaLocale}
          height="100%"
          expandRows
          fixedWeekCount={false}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
            omitZeroMinute: true,
          }}
          eventDisplay="block"
          views={{
            dayGridMonth: compactMonth
              ? {
                  dayMaxEvents: compactEventRows === 4 ? 3 : false,
                  dayMaxEventRows: compactEventRows < 4 ? compactEventRows : false,
                  moreLinkContent: () => "…",
                  moreLinkHint: (count: number) => `ほか${count}件の予定`,
                  moreLinkDidMount: ({ el }: { el: HTMLElement }) => {
                    el.removeAttribute("tabindex");
                    el.removeAttribute("aria-expanded");
                    el.removeAttribute("aria-controls");
                  },
                }
              : {},
            timeGridWeek: { displayEventTime: false },
            timeGridDay: { displayEventTime: false },
          }}
          events={loadEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          dayHeaderClassNames="bg-primary py-2"
          dayCellClassNames={dayCellClassNames}
          eventClassNames="cursor-pointer font-medium"
          moreLinkClassNames="mx-1.5"
          dayCellContent={renderDayCell}
          dayHeaderContent={renderDayHeader}
          eventContent={renderEvent}
          slotLabelContent={renderSlotLabel}
          editable={false}
        />
      </div>

      <EventDetailPopup
        event={selectedEvent}
        onClose={closeEventDetail}
        onDelete={onDeleteEvent}
        onSave={onSaveEvent}
      />
    </div>
  );
}
