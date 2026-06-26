import { ms03 } from './httpClient'

export const calendarService = {
  list: (params?: Record<string, unknown>) => ms03.get('/v1/calendar/events', { params }),
  create: (data: Record<string, unknown>) => ms03.post('/v1/calendar/events', data),
  update: (id: string, data: Record<string, unknown>) => ms03.put(`/v1/calendar/events/${id}`, data),
  remove: (id: string) => ms03.delete(`/v1/calendar/events/${id}`),
}
