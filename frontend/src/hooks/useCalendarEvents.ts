import { useState } from 'react'
import type { EventInput } from '@fullcalendar/core'
import { fetchEvents } from '@/api/events.ts'
import type { CalendarEvent } from '@/types/event.ts'

type FetchInfo = { startStr: string; endStr: string }

function toFullCalendarEvent(event: CalendarEvent): EventInput {
  return {
    id: String(event.id),
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    extendedProps: {
      description: event.description,
      location: event.location,
      category: event.category,
    },
  }
}

export function useCalendarEvents() {
  const [error, setError] = useState<string | null>(null)

  const loadEvents = async (
    fetchInfo: FetchInfo,
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: Error) => void,
  ) => {
    try {
      const events = await fetchEvents(fetchInfo.startStr, fetchInfo.endStr)
      setError(null)
      successCallback(events.map(toFullCalendarEvent))
    } catch (e) {
      const message = e instanceof Error ? e.message : '予定の取得に失敗しました'
      setError(message)
      failureCallback(new Error(message))
    }
  }

  return { error, loadEvents }
}
