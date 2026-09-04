export type ScheduleSuggestionEvent = {
  title: string
  description: string | null
  location: string | null
  category: string | null
  start_at: string | null
  end_at: string | null
  all_day: boolean
}

export type ScheduleSuggestion = {
  status: 'ready' | 'needs_clarification'
  event: ScheduleSuggestionEvent
  missing_fields: string[]
}
