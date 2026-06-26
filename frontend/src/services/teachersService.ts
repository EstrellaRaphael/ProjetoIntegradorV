import { ms02 } from './httpClient'

export const teachersService = {
  list: (params?: Record<string, unknown>) => ms02.get('/v1/teachers', { params }),
  count: () => ms02.get('/v1/teachers/count'),
  me: () => ms02.get('/v1/teachers/me'),
  getById: (id: string) => ms02.get(`/v1/teachers/${id}`),
  create: (data: Record<string, unknown>) => ms02.post('/v1/teachers', data),
  update: (id: string, data: Record<string, unknown>) => ms02.put(`/v1/teachers/${id}`, data),
  remove: (id: string) => ms02.delete(`/v1/teachers/${id}`),
  schedule: (id: string, params?: Record<string, unknown>) =>
    ms02.get(`/v1/teachers/${id}/schedule`, { params }),
  addSchedule: (id: string, data: Record<string, unknown>) =>
    ms02.post(`/v1/teachers/${id}/schedule`, data),
  updateSchedule: (id: string, gradeId: string, data: Record<string, unknown>) =>
    ms02.put(`/v1/teachers/${id}/schedule/${gradeId}`, data),
  addSubstitution: (id: string, gradeId: string, data: Record<string, unknown>) =>
    ms02.post(`/v1/teachers/${id}/schedule/${gradeId}/substitution`, data),
  recentChanges: () => ms02.get('/v1/teachers/schedule/changes/recent'),
}
