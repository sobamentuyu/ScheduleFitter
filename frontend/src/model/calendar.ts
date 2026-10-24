export const VIEWS = [
  { id: 'dayGridMonth', label: '月' },
  { id: 'timeGridWeek', label: '週' },
  { id: 'timeGridDay', label: '日' },
] as const

export type CalendarView = (typeof VIEWS)[number]['id']
