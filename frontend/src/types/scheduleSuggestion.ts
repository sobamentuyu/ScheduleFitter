export type ScheduleSuggestionEvent = {
  title: string
  description: string | null
  location: string | null
  category: string | null
  start_at: string | null
  end_at: string | null
  all_day: boolean
  missing_fields: string[]
}

export type ScheduleSuggestion = {
  status: 'ready' | 'needs_clarification'
  events: ScheduleSuggestionEvent[]
}
