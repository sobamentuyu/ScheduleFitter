export type CalendarEvent = {
  id: number
  user_id: number
  title: string
  description: string | null
  location: string | null
  category: string | null
  start_at: string
  end_at: string
  all_day: boolean
  created_at: string | null
  updated_at: string | null
  start: string
  end: string
  allDay: boolean
}

export type CreateEventPayload = {
  title: string
  description: string | null
  location: string | null
  category: string | null
  start_at: string
  end_at: string
  all_day: boolean
}
