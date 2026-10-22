import type { CalendarEvent, CreateEventPayload } from "@/types/event"
import type { ConflictingEvent } from "@/types/scheduleSuggestion.ts"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

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
  console.log("deleting id:", id);
}

export function fetchEventConflicts(payload: {
  start_at: string
  end_at: string
  exclude_ids?: number[]
}): Promise<ConflictingEvent[]> {
  return request<{ conflicts: ConflictingEvent[] }>('/api/events/conflicts', {
    method: 'POST',
    body: JSON.stringify({
      start_at: payload.start_at,
      end_at: payload.end_at,
      exclude_ids: payload.exclude_ids ?? [],
    }),
  }).then((body) => body.conflicts)
}
