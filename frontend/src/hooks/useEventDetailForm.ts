import { useState } from "react";
import type { EventDetail } from "@/types/event.ts";
import {
  addCalendarDays,
  fromAllDayDateInputs,
  toDatetimeLocalFromDate,
} from "@/utils/datetimeLocal.ts";

export type EventDraft = {
  title: string;
  location: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
};

const emptyDraft: EventDraft = {
  title: "",
  location: "",
  category: "",
  description: "",
  startDate: "",
  endDate: "",
  allDay: false,
};

export function toEventDraft(event: EventDetail): EventDraft {
  return {
    title: event.title.trim() || "",
    location: event.location || "",
    category: event.category || "",
    description: event.description || "",
    startDate: toDatetimeLocalFromDate(event.start),
    endDate: toDatetimeLocalFromDate(
      event.allDay && event.end ? addCalendarDays(event.end, -1) : event.end,
    ),
    allDay: event.allDay,
  };
}

function datesFromDraft(draft: EventDraft): {
  start: Date;
  end: Date | null;
} {
  const start = new Date(draft.startDate);
  const end = draft.endDate ? new Date(draft.endDate) : null;
  if (!draft.allDay) return { start, end };

  const range = fromAllDayDateInputs(
    draft.startDate.slice(0, 10),
    (draft.endDate || draft.startDate).slice(0, 10),
  );
  return {
    start: new Date(range.start_at),
    end: new Date(range.end_at),
  };
}

export function useEventDetailForm(
  event: EventDetail | null,
  onSave: (updated: EventDetail) => void | Promise<void>,
) {
  const [draft, setDraft] = useState<EventDraft>(() =>
    event ? toEventDraft(event) : emptyDraft,
  );
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [trackedEvent, setTrackedEvent] = useState(event);

  if (event !== trackedEvent) {
    setTrackedEvent(event);
    if (event) {
      setDraft(toEventDraft(event));
      setError("");
      setEditing(false);
    }
  }

  const inputStart = new Date(draft.startDate);
  const inputEnd = draft.endDate ? new Date(draft.endDate) : null;
  const isDateValid =
    !Number.isNaN(inputStart.getTime()) &&
    (draft.allDay
      ? inputEnd === null ||
        (!Number.isNaN(inputEnd.getTime()) && inputStart <= inputEnd)
      : inputEnd !== null &&
        !Number.isNaN(inputEnd.getTime()) &&
        inputStart < inputEnd);
  const isTitleValid = draft.title.trim() !== "";
  const savedDates =
    draft.allDay && isDateValid
      ? datesFromDraft(draft)
      : { start: inputStart, end: inputEnd };
  const savedStart = savedDates.start;
  const savedEnd = savedDates.end;

  const update = (patch: Partial<EventDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const setAllDay = (checked: boolean) => {
    setDraft((prev) => {
      if (checked) {
        return {
          ...prev,
          allDay: true,
          endDate: prev.endDate || prev.startDate,
        };
      }
      const currentStart = new Date(prev.startDate);
      return {
        ...prev,
        allDay: false,
        endDate:
          prev.endDate ||
          (Number.isNaN(currentStart.getTime())
            ? ""
            : toDatetimeLocalFromDate(
                new Date(currentStart.getTime() + 60 * 60 * 1000),
              )),
      };
    });
  };

  const setDateInput = (key: "startDate" | "endDate", value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev.allDay ? `${value}T00:00` : value,
    }));
  };

  const save = async () => {
    if (!event || !isDateValid || !isTitleValid) return;
    setError("");
    setEditing(false);
    try {
      await onSave({
        ...event,
        title: draft.title,
        location: draft.location,
        category: draft.category,
        description: draft.description,
        start: savedStart,
        end: savedEnd,
        allDay: draft.allDay,
      });
      setError("");
      setEditing(false);
    } catch {
      setEditing(true);
      setError("保存に失敗しました。もう一度試してください。");
    }
  };

  const cancel = () => {
    if (!event) return;
    setDraft(toEventDraft(event));
    setError("");
    setEditing(false);
  };

  return {
    draft,
    editing,
    error,
    isDateValid,
    isTitleValid,
    displayStart: isDateValid ? savedStart : (event?.start ?? null),
    displayEnd: isDateValid ? savedEnd : (event?.end ?? null),
    startEditing: () => setEditing(true),
    update,
    setAllDay,
    setDateInput,
    save,
    cancel,
  };
}
