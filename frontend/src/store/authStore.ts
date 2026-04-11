import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JWTPayload, Role } from '../types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: JWTPayload | null
  isAuthenticated: boolean

  setTokens: (accessToken: string, refreshToken: string, role: Role) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

function parseJWT(token: string): JWTPayload | null {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64)) as JWTPayload
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        const user = parseJWT(accessToken)
        set({ accessToken, refreshToken, user, isAuthenticated: true })
      },

      setAccessToken: (token) => {
        const user = parseJWT(token)
        set({ accessToken: token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)
