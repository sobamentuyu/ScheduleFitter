import { request } from "@/api/client.ts";
import type { ConflictingEvent } from "@/entities/scheduleSuggestion.ts";
import type {
  CalendarEvent,
  CreateEventPayload,
  EditEventPayload,
} from "@/entities/event.ts";

export function fetchEvents(
  from?: string,
  to?: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return request(`/api/events${query ? `?${query}` : ""}`);
}

export function createEvent(
  payload: CreateEventPayload,
): Promise<CalendarEvent> {
  return request("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function fetchEventConflicts(payload: {
  start_at: string;
  end_at: string;
  exclude_ids?: number[];
}): Promise<ConflictingEvent[]> {
  return request<{ conflicts: ConflictingEvent[] }>("/api/events/conflicts", {
    method: "POST",
    body: JSON.stringify({
      start_at: payload.start_at,
      end_at: payload.end_at,
      exclude_ids: payload.exclude_ids ?? [],
    }),
  }).then((body) => body.conflicts);
}

export function editEvent(payload: EditEventPayload): Promise<CalendarEvent> {
  return request(`/api/events/${encodeURIComponent(String(payload.id))}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
