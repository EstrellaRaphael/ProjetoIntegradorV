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

function isExpired(payload: JWTPayload | null): boolean {
  if (!payload?.exp) return false
  return payload.exp * 1000 < Date.now()
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
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken) return
        const user = parseJWT(state.accessToken)
        if (!user || (isExpired(user) && !state.refreshToken)) {
          state.accessToken = null
          state.refreshToken = null
          state.user = null
          state.isAuthenticated = false
          return
        }
        state.user = user
        state.isAuthenticated = true
      },
    }
  )
)
