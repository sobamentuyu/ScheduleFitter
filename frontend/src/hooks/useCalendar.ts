import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core'
import { useCalendarEvents } from '@/hooks/useCalendarEvents.ts'
import { VIEWS, type CalendarView } from '@/constants/calendarViews.ts'
import type { EventDetail } from '@/types/event.ts'

export function useCalendar(revision = 0) {
  const { error, loadEvents } = useCalendarEvents()
  const calendarRef = useRef<FullCalendar>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState('')
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth')
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)

  const api = () => calendarRef.current?.getApi()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(() => api()?.updateSize())
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (revision > 0) {
      calendarRef.current?.getApi().refetchEvents()
    }
  }, [revision])

  const handleDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title)
    if (VIEWS.some((view) => view.id === arg.view.type)) {
      setCurrentView(arg.view.type as CalendarView)
    }
  }

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault()
    const { event } = arg
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      description: event.extendedProps.description ?? null,
      location: event.extendedProps.location ?? null,
      category: event.extendedProps.category ?? null,
    })
  }

  return {
    error,
    loadEvents,
    calendarRef,
    wrapRef,
    title,
    currentView,
    selectedEvent,
    handleDatesSet,
    handleEventClick,
    closeEventDetail: () => setSelectedEvent(null),
    onPrev: () => api()?.prev(),
    onNext: () => api()?.next(),
    onToday: () => api()?.today(),
    onChangeView: (view: CalendarView) => api()?.changeView(view),
  }
}
