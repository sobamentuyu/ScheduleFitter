import type { CalendarEvent, CreateEventPayload } from "@/entities/event.ts";

export type ScheduleEventStatus = "ready" | "needs_clarification";

/** 提案と時間が重なっている、既存の event */
export type ConflictingEvent = {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string | null;
};

export type ScheduleSuggestionEvent = {
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  missing_fields: string[];
  status: ScheduleEventStatus;
  conflicts: ConflictingEvent[] | null;
};

export type ScheduleSuggestion = {
  events: ScheduleSuggestionEvent[];
};

export type ExistingEventUpdate = {
  id: number;
  start_at: string;
  end_at: string;
  all_day: boolean;
};

export type ApproveScheduleSuggestionPayload = {
  creates: CreateEventPayload[];
  updates: ExistingEventUpdate[];
  deletes: number[];
};

export type ApproveScheduleSuggestionResult = {
  created: CalendarEvent[];
  updated_count: number;
  deleted_count: number;
};
