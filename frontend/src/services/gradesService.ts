import { ms04 } from './httpClient'

export const gradesService = {
  recent: () => ms04.get('/v1/grades/recent'),
  config: () => ms04.get('/v1/grades/config'),
  updateConfig: (data: Record<string, unknown>) => ms04.put('/v1/grades/config', data),
  create: (data: Record<string, unknown>) => ms04.post('/v1/grades', data),
  update: (id: string, data: Record<string, unknown>) => ms04.put(`/v1/grades/${id}`, data),
  boletim: (alunoId: string) => ms04.get(`/v1/grades/${alunoId}/boletim`),
  provaFinal: (data: Record<string, unknown>) => ms04.post('/v1/grades/prova-final', data),
}
