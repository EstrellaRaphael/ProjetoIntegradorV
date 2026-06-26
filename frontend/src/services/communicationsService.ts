import { ms05 } from './httpClient'

export const communicationsService = {
  list: () => ms05.get('/v1/communications'),
  recent: () => ms05.get('/v1/communications/recent'),
  unread: () => ms05.get('/v1/communications/unread'),
  getById: (id: string) => ms05.get(`/v1/communications/${id}`),
  create: (data: Record<string, unknown>) => ms05.post('/v1/communications', data),
  markAsRead: (id: string) => ms05.put(`/v1/communications/${id}/read`),
  preferences: () => ms05.get('/v1/notifications/preferences'),
  updatePreferences: (data: Record<string, unknown>) =>
    ms05.put('/v1/notifications/preferences', data),
}
