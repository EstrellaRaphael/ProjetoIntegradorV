import { ms03 } from './httpClient'

export const classesService = {
  list: (params?: Record<string, unknown>) => ms03.get('/v1/classes', { params }),
  activeCount: () => ms03.get('/v1/classes/active/count'),
  getById: (id: string) => ms03.get(`/v1/classes/${id}`),
  create: (data: Record<string, unknown>) => ms03.post('/v1/classes', data),
  update: (id: string, data: Record<string, unknown>) => ms03.put(`/v1/classes/${id}`, data),
  remove: (id: string) => ms03.delete(`/v1/classes/${id}`),
  addStudent: (id: string, data: Record<string, unknown>) =>
    ms03.post(`/v1/classes/${id}/students`, data),
  removeStudent: (id: string, alunoId: string) =>
    ms03.delete(`/v1/classes/${id}/students/${alunoId}`),
}
