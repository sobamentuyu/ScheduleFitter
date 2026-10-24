import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { useCalendarEvents } from "@/hooks/useCalendarEvents.ts";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { VIEWS, type CalendarView } from "@/model/calendar.ts";
import type { EventDetail } from "@/model/event.ts";

export function useCalendar(revision = 0) {
  const { error, loadEvents, removeEvent } = useCalendarEvents();
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
    setSelectedEvent,
    handleDateClick,
    closeEventDetail: () => setSelectedEvent(null),
    onDeleteEvent: handleDeleteEvent,
    onPrev: () => api()?.prev(),
    onNext: () => api()?.next(),
    onToday: () => api()?.today(),
    onChangeView: (view: CalendarView) => api()?.changeView(view),
    onBackToMonth: () => api()?.changeView("dayGridMonth"),
  };
}
