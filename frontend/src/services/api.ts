import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// ── URLs dos microsserviços ──────────────────────────────────────────────────
const SERVICES = {
  auth:  import.meta.env.VITE_AUTH_URL  || 'http://localhost:3000',
  ms01:  import.meta.env.VITE_MS01_URL  || 'http://localhost:3001',
  ms02:  import.meta.env.VITE_MS02_URL  || 'http://localhost:3002',
  ms03:  import.meta.env.VITE_MS03_URL  || 'http://localhost:3003',
  ms04:  import.meta.env.VITE_MS04_URL  || 'http://localhost:3004',
  ms05:  import.meta.env.VITE_MS05_URL  || 'http://localhost:3005',
}

function createClient(baseURL: string) {
  const client = axios.create({ baseURL })

  // Injeta token em todas as requisições
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Renova token automaticamente em 401
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true
        try {
          const { refreshToken } = useAuthStore.getState()
          if (!refreshToken) throw new Error('No refresh token')
          const { data } = await axios.post(`${SERVICES.auth}/v1/auth/refresh`, { refreshToken })
          useAuthStore.getState().setAccessToken(data.accessToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return client(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const authApi = createClient(SERVICES.auth)
export const ms01    = createClient(SERVICES.ms01)
export const ms02    = createClient(SERVICES.ms02)
export const ms03    = createClient(SERVICES.ms03)
export const ms04    = createClient(SERVICES.ms04)
export const ms05    = createClient(SERVICES.ms05)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login:    (email: string, senha: string) =>
              authApi.post('/v1/auth/login', { email, senha }),
  refresh:  (refreshToken: string) =>
              authApi.post('/v1/auth/refresh', { refreshToken }),
  validate: () => authApi.get('/v1/auth/validate'),
}

// ── MS-01 Alunos ─────────────────────────────────────────────────────────────
export const studentsService = {
  list:      (params?: Record<string, unknown>) => ms01.get('/v1/students', { params }),
  count:     () => ms01.get('/v1/students/count'),
  me:        () => ms01.get('/v1/students/me'),
  getById:   (id: string) => ms01.get(`/v1/students/${id}`),
  create:    (data: Record<string, unknown>) => ms01.post('/v1/students', data),
  update:    (id: string, data: Record<string, unknown>) => ms01.put(`/v1/students/${id}`, data),
  remove:    (id: string) => ms01.delete(`/v1/students/${id}`),
  frequency: (id: string, params?: Record<string, unknown>) =>
               ms01.get(`/v1/students/${id}/frequency`, { params }),
  addFrequency: (id: string, data: Record<string, unknown>) =>
               ms01.post(`/v1/students/${id}/frequency`, data),
  overrideFrequency: (id: string, data: Record<string, unknown>) =>
               ms01.post(`/v1/students/${id}/frequency/override`, data),
  history:   (id: string) => ms01.get(`/v1/students/${id}/history`),
}

// ── MS-02 Professores ─────────────────────────────────────────────────────────
export const teachersService = {
  list:      (params?: Record<string, unknown>) => ms02.get('/v1/teachers', { params }),
  count:     () => ms02.get('/v1/teachers/count'),
  me:        () => ms02.get('/v1/teachers/me'),
  getById:   (id: string) => ms02.get(`/v1/teachers/${id}`),
  create:    (data: Record<string, unknown>) => ms02.post('/v1/teachers', data),
  update:    (id: string, data: Record<string, unknown>) => ms02.put(`/v1/teachers/${id}`, data),
  remove:    (id: string) => ms02.delete(`/v1/teachers/${id}`),
  schedule:  (id: string, params?: Record<string, unknown>) =>
               ms02.get(`/v1/teachers/${id}/schedule`, { params }),
  addSchedule: (id: string, data: Record<string, unknown>) =>
               ms02.post(`/v1/teachers/${id}/schedule`, data),
  updateSchedule: (id: string, gradeId: string, data: Record<string, unknown>) =>
               ms02.put(`/v1/teachers/${id}/schedule/${gradeId}`, data),
  addSubstitution: (id: string, gradeId: string, data: Record<string, unknown>) =>
               ms02.post(`/v1/teachers/${id}/schedule/${gradeId}/substitution`, data),
  recentChanges: () => ms02.get('/v1/teachers/schedule/changes/recent'),
}

// ── MS-03 Turmas e Disciplinas ────────────────────────────────────────────────
export const classesService = {
  list:        (params?: Record<string, unknown>) => ms03.get('/v1/classes', { params }),
  activeCount: () => ms03.get('/v1/classes/active/count'),
  getById:     (id: string) => ms03.get(`/v1/classes/${id}`),
  create:      (data: Record<string, unknown>) => ms03.post('/v1/classes', data),
  update:      (id: string, data: Record<string, unknown>) => ms03.put(`/v1/classes/${id}`, data),
  remove:      (id: string) => ms03.delete(`/v1/classes/${id}`),
  addStudent:  (id: string, data: Record<string, unknown>) =>
                 ms03.post(`/v1/classes/${id}/students`, data),
  removeStudent: (id: string, alunoId: string) =>
                 ms03.delete(`/v1/classes/${id}/students/${alunoId}`),
}

export const disciplinesService = {
  list:    () => ms03.get('/v1/disciplines'),
  getById: (id: string) => ms03.get(`/v1/disciplines/${id}`),
  create:  (data: Record<string, unknown>) => ms03.post('/v1/disciplines', data),
  update:  (id: string, data: Record<string, unknown>) => ms03.put(`/v1/disciplines/${id}`, data),
  remove:  (id: string) => ms03.delete(`/v1/disciplines/${id}`),
}

export const calendarService = {
  list:    (params?: Record<string, unknown>) => ms03.get('/v1/calendar/events', { params }),
  create:  (data: Record<string, unknown>) => ms03.post('/v1/calendar/events', data),
  update:  (id: string, data: Record<string, unknown>) => ms03.put(`/v1/calendar/events/${id}`, data),
  remove:  (id: string) => ms03.delete(`/v1/calendar/events/${id}`),
}

// ── MS-04 Avaliações e Notas ──────────────────────────────────────────────────
export const assessmentsService = {
  list:    (params?: Record<string, unknown>) => ms04.get('/v1/assessments', { params }),
  getById: (id: string) => ms04.get(`/v1/assessments/${id}`),
  create:  (data: Record<string, unknown>) => ms04.post('/v1/assessments', data),
  update:  (id: string, data: Record<string, unknown>) => ms04.put(`/v1/assessments/${id}`, data),
}

export const gradesService = {
  recent:     () => ms04.get('/v1/grades/recent'),
  config:     () => ms04.get('/v1/grades/config'),
  updateConfig: (data: Record<string, unknown>) => ms04.put('/v1/grades/config', data),
  create:     (data: Record<string, unknown>) => ms04.post('/v1/grades', data),
  update:     (id: string, data: Record<string, unknown>) => ms04.put(`/v1/grades/${id}`, data),
  boletim:    (alunoId: string) => ms04.get(`/v1/grades/${alunoId}/boletim`),
  provaFinal: (data: Record<string, unknown>) => ms04.post('/v1/grades/prova-final', data),
}

// ── MS-05 Comunicação ─────────────────────────────────────────────────────────
export const communicationsService = {
  list:        () => ms05.get('/v1/communications'),
  recent:      () => ms05.get('/v1/communications/recent'),
  unread:      () => ms05.get('/v1/communications/unread'),
  getById:     (id: string) => ms05.get(`/v1/communications/${id}`),
  create:      (data: Record<string, unknown>) => ms05.post('/v1/communications', data),
  markAsRead:  (id: string) => ms05.put(`/v1/communications/${id}/read`),
  preferences: () => ms05.get('/v1/notifications/preferences'),
  updatePreferences: (data: Record<string, unknown>) =>
                       ms05.put('/v1/notifications/preferences', data),
}
