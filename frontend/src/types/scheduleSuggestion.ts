export type ScheduleEventStatus = 'ready' | 'needs_clarification'

export type ScheduleSuggestionEvent = {
  title: string
  description: string | null
  location: string | null
  category: string | null
  start_at: string | null
  end_at: string | null
  all_day: boolean
  missing_fields: string[]
  status: ScheduleEventStatus
}

export type ScheduleSuggestion = {
  events: ScheduleSuggestionEvent[]
}
