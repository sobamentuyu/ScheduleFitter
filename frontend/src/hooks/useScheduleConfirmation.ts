import { useEffect, useRef, useState } from "react";
import type { ConfirmationState } from "@/types/chat.ts";
import type { ScheduleSuggestionEvent } from "@/types/scheduleSuggestion.ts";

function readyIndexes(events: ScheduleSuggestionEvent[]): number[] {
  return events.flatMap((event, i) => (event.status === "ready" ? [i] : []));
}

export function useScheduleConfirmation(
  events: ScheduleSuggestionEvent[],
  state: ConfirmationState,
) {
  const [selected, setSelected] = useState(() => new Set(readyIndexes(events)));
  const previousReadyRef = useRef(new Set(readyIndexes(events)));
  const isSaving = state === "saving";
  const selectedEvents = events.filter(
    (event, i) => event.status === "ready" && selected.has(i),
  );
  const readyCount = events.filter((event) => event.status === "ready").length;
  const allReadySelected =
    readyCount > 0 && selectedEvents.length === readyCount;

  useEffect(() => {
    const nowReadyList = readyIndexes(events);
    const nowReady = new Set(nowReadyList);
    const previousReady = previousReadyRef.current;

    setSelected((current) => {
      const next = new Set<number>();
      for (const index of nowReadyList) {
        if (current.has(index) || !previousReady.has(index)) {
          next.add(index);
        }
      }
      // ready があるのに1件も選ばれていないときは全選択に戻す
      if (next.size === 0 && nowReadyList.length > 0) {
        return new Set(nowReadyList);
      }
      return next;
    });

    previousReadyRef.current = nowReady;
  }, [events]);

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
        : new Set(readyIndexes(events)),
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
