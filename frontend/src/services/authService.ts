import { authApi } from './httpClient'

export const authService = {
  login: (email: string, senha: string) =>
    authApi.post('/v1/auth/login', { email, senha }),
  refresh: (refreshToken: string) =>
    authApi.post('/v1/auth/refresh', { refreshToken }),
  validate: () => authApi.get('/v1/auth/validate'),
}
