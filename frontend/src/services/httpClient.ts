import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const SERVICES = {
  auth: import.meta.env.VITE_AUTH_URL || 'http://localhost:3000',
  ms01: import.meta.env.VITE_MS01_URL || 'http://localhost:3001',
  ms02: import.meta.env.VITE_MS02_URL || 'http://localhost:3002',
  ms03: import.meta.env.VITE_MS03_URL || 'http://localhost:3003',
  ms04: import.meta.env.VITE_MS04_URL || 'http://localhost:3004',
  ms05: import.meta.env.VITE_MS05_URL || 'http://localhost:3005',
}

function createClient(baseURL: string) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

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
export const ms01 = createClient(SERVICES.ms01)
export const ms02 = createClient(SERVICES.ms02)
export const ms03 = createClient(SERVICES.ms03)
export const ms04 = createClient(SERVICES.ms04)
export const ms05 = createClient(SERVICES.ms05)
