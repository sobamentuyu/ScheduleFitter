import { useState } from "react";
import type { ConfirmationState } from "@/types/chat.ts";
import type { ScheduleSuggestionEvent } from "@/types/scheduleSuggestion.ts";

export function useScheduleConfirmation(
  events: ScheduleSuggestionEvent[],
  state: ConfirmationState,
) {
  const [selected, setSelected] = useState(
    () =>
      new Set(
        events.flatMap((event, i) => (event.status === "ready" ? [i] : [])),
      ),
  );
  const isSaving = state === "saving";
  const selectedEvents = events.filter(
    (event, i) => event.status === "ready" && selected.has(i),
  );
  const readyCount = events.filter((event) => event.status === "ready").length;
  const allReadySelected =
    readyCount > 0 && selectedEvents.length === readyCount;

  const isSelected = (i: number) => selected.has(i);

  const toggle = (i: number) => {
    if (events[i]?.status !== "ready" || isSaving) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isSaving || readyCount === 0) return;
    setSelected(
      allReadySelected
        ? new Set()
        : new Set(
            events.flatMap((event, i) => (event.status === "ready" ? [i] : [])),
          ),
    );
  };

  return {
    selectedEvents,
    readyCount,
    allReadySelected,
    isSaving,
    isSelected,
    toggle,
    toggleSelectAll,
  };
}
