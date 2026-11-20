import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateClickArg } from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import { useCalendarEvents } from "@/hooks/useCalendarEvents.ts";
import { useConflictPreview } from "@/hooks/useConflictPreview.ts";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { VIEWS, type CalendarView } from "@/constants/calendarViews.ts";
import type { EventDetail } from "@/types/event.ts";
import type { ConflictCalendarPreview } from "@/types/conflictPreview.ts";

const PREVIEW_NEW_ID = "sf-preview-new";
const PREVIEW_PEER_ID = "sf-preview-peer";

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function applyPreviewToEvents(
  events: EventInput[],
  preview: ConflictCalendarPreview,
): EventInput[] {
  if (!preview) return events;

  const deleted = new Set(preview.deletedIds);
  const next = events
    .filter((event) => !deleted.has(Number(event.id)))
    .map((event) => {
      const id = Number(event.id);
      const override = preview.existingOverrides[id];
      const isHighlighted = preview.existingEvent?.id === id;
      const start = override?.start_at ?? event.start;
      const end = override?.end_at ?? event.end;
      const allDay = override?.all_day ?? event.allDay;

      const mapped: EventInput = {
        ...event,
        start,
        end,
        allDay,
        classNames: [
          ...(Array.isArray(event.classNames)
            ? event.classNames
            : event.classNames
              ? [event.classNames]
              : []),
          isHighlighted ? "sf-event-existing-focus" : "",
          isHighlighted && preview.existingEvent?.inConflict
            ? "sf-event-conflict"
            : "",
        ].filter(Boolean),
        extendedProps: {
          ...(event.extendedProps ?? {}),
          previewKind: isHighlighted ? "existing-conflict" : undefined,
          inConflict: Boolean(
            isHighlighted && preview.existingEvent?.inConflict,
          ),
        },
      };
      return mapped;
    });

  const pushNewPreview = (
    id: string,
    event: NonNullable<ConflictCalendarPreview>["newEvent"],
  ) => {
    if (!event) return;
    const previewEvent: EventInput = {
      id,
      title: event.title.trim() || "タイトル未定",
      start: event.start_at,
      end: event.end_at,
      allDay: event.all_day,
      editable: false,
      classNames: [
        "sf-event-new",
        event.inConflict ? "sf-event-conflict" : "",
      ].filter(Boolean),
      extendedProps: {
        description: null,
        location: event.location ?? null,
        category: null,
        previewKind: "new",
        inConflict: event.inConflict,
      },
    };
    next.push(previewEvent);
  };

  pushNewPreview(PREVIEW_NEW_ID, preview.newEvent);
  pushNewPreview(PREVIEW_PEER_ID, preview.peerEvent);

  return next;
}

function runAfterRender(task: () => void): () => void {
  const id = window.setTimeout(task, 0);
  return () => window.clearTimeout(id);
}

export function useCalendar(revision = 0) {
  const { error, loadEvents, removeEvent, reviseEvent } = useCalendarEvents();
  const { preview } = useConflictPreview();
  const isMobile = useIsMobile();
  const calendarRef = useRef<FullCalendar>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [currentView, setCurrentView] = useState<CalendarView>("dayGridMonth");
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const savedViewRef = useRef<{ view: string; date: Date } | null>(null);
  const previewRef = useRef(preview);
  const appliedViewKeyRef = useRef<string | null>(null);
  const appliedEventsKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    previewRef.current = preview;
    return runAfterRender(() => {
      const calendar = api();
      if (!calendar) return;

      if (!preview) {
        if (savedViewRef.current) {
          const { view, date } = savedViewRef.current;
          savedViewRef.current = null;
          appliedViewKeyRef.current = null;
          calendar.changeView(view, date);
        }
        appliedEventsKeyRef.current = null;
        calendar.refetchEvents();
        return;
      }

      if (!savedViewRef.current) {
        savedViewRef.current = {
          view: calendar.view.type,
          date: calendar.getDate(),
        };
      }

      const viewKey = `${preview.useWeekView ? "week" : "day"}|${preview.focusDate}`;
      if (appliedViewKeyRef.current !== viewKey) {
        const targetView = preview.useWeekView ? "timeGridWeek" : "timeGridDay";
        const focusDate = new Date(preview.focusDate);
        appliedViewKeyRef.current = viewKey;
        if (
          calendar.view.type !== targetView ||
          !sameCalendarDay(calendar.getDate(), focusDate)
        ) {
          calendar.changeView(targetView, focusDate);
        }
      }

      const eventsKey = JSON.stringify(preview);
      if (appliedEventsKeyRef.current === eventsKey) return;
      appliedEventsKeyRef.current = eventsKey;
      calendar.refetchEvents();
    });
  }, [preview]);

  const loadEventsWithPreview = useCallback(
    (
      fetchInfo: { startStr: string; endStr: string },
      successCallback: (events: EventInput[]) => void,
      failureCallback: (error: Error) => void,
    ) => {
      void loadEvents(
        fetchInfo,
        (events) => {
          successCallback(applyPreviewToEvents(events, previewRef.current));
        },
        failureCallback,
      );
    },
    [loadEvents],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);
    if (VIEWS.some((view) => view.id === arg.view.type)) {
      setCurrentView(arg.view.type as CalendarView);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    const { event } = arg;
    if (
      event.id === PREVIEW_NEW_ID ||
      event.id === PREVIEW_PEER_ID ||
      event.extendedProps.previewKind === "new" ||
      event.extendedProps.previewKind === "existing-conflict"
    ) {
      return;
    }
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
    loadEvents: loadEventsWithPreview,
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
