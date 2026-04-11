import 'dotenv/config'
import Fastify, { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { Prisma } from '@prisma/client'
import './types'

import prismaPlugin from './plugins/prisma'
import authRoutes from './routes/auth'

const fastify = Fastify({ logger: true })

// ── Middlewares globais ───────────────────────────────────────────────────────
fastify.register(cors, { origin: true })

// JWT principal — access token (15 min)
fastify.register(jwt, {
  secret: process.env.JWT_SECRET as string,
  namespace: 'jwt'
})

// JWT de refresh — 7 dias (namespace separado para não misturar segredos)
fastify.register(jwt, {
  secret: process.env.JWT_REFRESH_SECRET as string,
  namespace: 'refreshJwt'
})

// ── Decorator de autenticação ─────────────────────────────────────────────────
fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// ── Plugins e rotas ───────────────────────────────────────────────────────────
fastify.register(prismaPlugin)
fastify.register(authRoutes, { prefix: '/v1/auth' })

// ── Health check ──────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

// ── Tratamento global de erros (inclui erros Prisma) ─────────────────────────
fastify.setErrorHandler((err, _request, reply) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return reply.code(409).send({ error: 'Registro já existe (chave única violada)' })
    }
    if (err.code === 'P2025') {
      return reply.code(404).send({ error: 'Registro não encontrado' })
    }
  }
  fastify.log.error(err)
  const statusCode = err instanceof Error && 'statusCode' in err
    ? (err as FastifyError).statusCode ?? 500
    : 500
  const message = err instanceof Error ? err.message : 'Erro interno do servidor'
  return reply.code(statusCode).send({ error: message })
})

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
