import { ms03 } from './httpClient'

export const disciplinesService = {
  list: () => ms03.get('/v1/disciplines'),
  getById: (id: string) => ms03.get(`/v1/disciplines/${id}`),
  create: (data: Record<string, unknown>) => ms03.post('/v1/disciplines', data),
  update: (id: string, data: Record<string, unknown>) => ms03.put(`/v1/disciplines/${id}`, data),
  remove: (id: string) => ms03.delete(`/v1/disciplines/${id}`),
}
