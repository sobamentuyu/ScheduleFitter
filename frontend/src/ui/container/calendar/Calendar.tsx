import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
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
import { editEvent } from "@/api/events.ts";
type CalendarProps = {
  revision?: number;
};
import { useRef } from "react";
import type { EventDetail } from "@/types/event";
export function Calendar({ revision = 0 }: CalendarProps) {
  const {
    error,
    loadEvents,
    calendarRef,
    wrapRef,
    title,
    currentView,
    selectedEvent,
    handleDatesSet,
    handleEventClick,
    closeEventDetail,
    setSelectedEvent,
    onPrev,
    onNext,
    onToday,
    onChangeView,
    onDeleteEvent,
  } = useCalendar(revision);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const handleSave = async (updated: EventDetail) => {
    if (!updated.start || !updated.end) {
      throw new Error("イベントの開始日時と終了日時が必要です。");
    }
    const calendar = calendarRef.current?.getApi();
    const fcEvent = calendar?.getEventById(String(updated.id));
    if (fcEvent) {
      // 先にカレンダーの表示を書き換える
      fcEvent.setProp("title", updated.title);
      fcEvent.setDates(updated.start, updated.end, { allDay: updated.allDay });
      fcEvent.setExtendedProp("description", updated.description);
      fcEvent.setExtendedProp("location", updated.location);
      fcEvent.setExtendedProp("category", updated.category);
    }
    try {
      await editEvent({
        ...updated,
        start_at: updated.allDay
          ? toDateStr(updated.start)
          : updated.start.toISOString(),
        end_at: updated.allDay
          ? toDateStr(updated.end)
          : updated.end.toISOString(),
        all_day: updated.allDay,
      });
      setSelectedEvent(updated);
    } catch (e) {
      console.error("save failed:", e);
      calendar?.refetchEvents();
      throw e;
    }
  };

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

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        ref={wrapRef}
        className="min-h-0 flex-1 overflow-hidden"
      >
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
            hour: "numeric",
            minute: "2-digit",
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
          eventClick={handleEventClick}
          dayHeaderClassNames="bg-primary py-2"
          dayCellClassNames={dayCellClassNames}
          eventClassNames="cursor-pointer font-medium"
          moreLinkClassNames="mx-1.5"
          dayCellContent={renderDayCell}
          dayHeaderContent={renderDayHeader}
          eventContent={renderEvent}
          slotLabelContent={renderSlotLabel}
          editable={true}
        />
      </div>

      <EventDetailPopup
        event={selectedEvent}
        onClose={closeEventDetail}
        onDelete={onDeleteEvent}
        onSave={handleSave}
      />
    </div>
  );
}
