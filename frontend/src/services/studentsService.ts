import { ms01 } from './httpClient'

export const studentsService = {
  list: (params?: Record<string, unknown>) => ms01.get('/v1/students', { params }),
  count: () => ms01.get('/v1/students/count'),
  me: () => ms01.get('/v1/students/me'),
  getById: (id: string) => ms01.get(`/v1/students/${id}`),
  create: (data: Record<string, unknown>) => ms01.post('/v1/students', data),
  update: (id: string, data: Record<string, unknown>) => ms01.put(`/v1/students/${id}`, data),
  remove: (id: string) => ms01.delete(`/v1/students/${id}`),
  frequency: (id: string, params?: Record<string, unknown>) =>
    ms01.get(`/v1/students/${id}/frequency`, { params }),
  addFrequency: (id: string, data: Record<string, unknown>) =>
    ms01.post(`/v1/students/${id}/frequency`, data),
  overrideFrequency: (id: string, data: Record<string, unknown>) =>
    ms01.post(`/v1/students/${id}/frequency/override`, data),
  history: (id: string) => ms01.get(`/v1/students/${id}/history`),
}
