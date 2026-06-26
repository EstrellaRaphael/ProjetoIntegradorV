import { ms04 } from './httpClient'

export const assessmentsService = {
  list: (params?: Record<string, unknown>) => ms04.get('/v1/assessments', { params }),
  getById: (id: string) => ms04.get(`/v1/assessments/${id}`),
  create: (data: Record<string, unknown>) => ms04.post('/v1/assessments', data),
  update: (id: string, data: Record<string, unknown>) => ms04.put(`/v1/assessments/${id}`, data),
}
