import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

export type Role = 'ADMIN' | 'PROFESSOR' | 'ALUNO'

export interface JWTPayload {
  sub: string
  role: Role
  referenciaId: string | null
  turmaId: string | null
  iat?: number
  exp?: number
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload
    user: JWTPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
