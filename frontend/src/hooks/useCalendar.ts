import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { useCalendarEvents } from "@/hooks/useCalendarEvents.ts";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { VIEWS, type CalendarView } from "@/constants/calendarViews.ts";
import type { EventDetail } from "@/types/event.ts";

export function useCalendar(revision = 0) {
  const { error, loadEvents, removeEvent, reviseEvent } = useCalendarEvents();
  const isMobile = useIsMobile();
  const calendarRef = useRef<FullCalendar>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [currentView, setCurrentView] = useState<CalendarView>("dayGridMonth");
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  const api = () => calendarRef.current?.getApi();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => api()?.updateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (revision > 0) {
      calendarRef.current?.getApi().refetchEvents();
    }
  }, [revision]);

  const handleDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);
    if (VIEWS.some((view) => view.id === arg.view.type)) {
      setCurrentView(arg.view.type as CalendarView);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    const { event } = arg;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      description: event.extendedProps.description ?? null,
      location: event.extendedProps.location ?? null,
      category: event.extendedProps.category ?? null,
    });
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (!isMobile) return;
    if (arg.view.type !== "dayGridMonth") return;
    api()?.changeView("timeGridDay", arg.date);
  };

  const handleDeleteEvent = async (event: EventDetail) => {
    const calendar = api();
    calendar?.getEventById(event.id)?.remove();
    setSelectedEvent(null);
    try {
      await removeEvent(event.id);
    } catch {
      calendar?.refetchEvents();
    }
  };

  const handleSaveEvent = async (updated: EventDetail) => {
    if (!updated.start || !updated.end) {
      throw new Error("イベントの開始日時と終了日時が必要です。");
    }
    const calendar = api();
    const fcEvent = calendar?.getEventById(String(updated.id));
    if (fcEvent) {
      fcEvent.setProp("title", updated.title);
      fcEvent.setDates(updated.start, updated.end, { allDay: updated.allDay });
      fcEvent.setExtendedProp("description", updated.description);
      fcEvent.setExtendedProp("location", updated.location);
      fcEvent.setExtendedProp("category", updated.category);
    }
    try {
      await reviseEvent({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        location: updated.location,
        category: updated.category,
        start_at: updated.start.toISOString(),
        end_at: updated.end.toISOString(),
        all_day: updated.allDay,
      });
      setSelectedEvent((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
    } catch (e) {
      console.error("save failed:", e);
      calendar?.refetchEvents();
      throw e;
    }
  };
  return {
    error,
    loadEvents,
    calendarRef,
    wrapRef,
    title,
    currentView,
    selectedEvent,
    showBackToMonth: isMobile && currentView === "timeGridDay",
    handleDatesSet,
    handleEventClick,
    handleDateClick,
    closeEventDetail: () => setSelectedEvent(null),
    onDeleteEvent: handleDeleteEvent,
    onSaveEvent: handleSaveEvent,
    onPrev: () => api()?.prev(),
    onNext: () => api()?.next(),
    onToday: () => api()?.today(),
    onChangeView: (view: CalendarView) => api()?.changeView(view),
    onBackToMonth: () => api()?.changeView("dayGridMonth"),
  };
}
