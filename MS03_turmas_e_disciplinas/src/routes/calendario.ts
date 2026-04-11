import { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { calendario_escolar_tipo } from '@prisma/client'

interface CalendarioParams {
  id: string
}

interface CalendarioQuery {
  tipo?: string
  data_inicio?: string
  data_fim?: string
}

interface CalendarioBody {
  data: string
  descricao: string
  tipo: string
  [key: string]: unknown
}

const calendarioRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/calendar/events — todos os perfis ─────────────────────────────
  fastify.get<{ Querystring: CalendarioQuery }>('/events', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { tipo, data_inicio, data_fim } = request.query
    const where: Record<string, unknown> = {}
    if (tipo) where.tipo = tipo
    if (data_inicio || data_fim) {
      const dataFilter: Record<string, Date> = {}
      if (data_inicio) dataFilter.gte = new Date(data_inicio)
      if (data_fim) dataFilter.lte = new Date(data_fim)
      where.data = dataFilter
    }

    const eventos = await fastify.prisma.calendario_escolar.findMany({
      where,
      orderBy: { data: 'asc' }
    })
    return reply.send(eventos)
  })

  // ── POST /v1/calendar/events — Admin cria evento ──────────────────────────
  fastify.post<{ Body: CalendarioBody }>('/events', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['data', 'descricao', 'tipo'],
        properties: {
          data: { type: 'string' },
          descricao: { type: 'string' },
          tipo: { type: 'string', enum: ['AULA', 'FERIADO', 'RECESSO', 'EVENTO'] }
        }
      }
    }
  }, async (request, reply) => {
    const evento = await fastify.prisma.calendario_escolar.create({
      data: {
        id: randomUUID(),
        ...request.body,
        tipo: request.body.tipo as calendario_escolar_tipo
      }
    })
    return reply.code(201).send(evento)
  })

  // ── PUT /v1/calendar/events/:id — Admin ──────────────────────────────────
  fastify.put<{ Params: CalendarioParams }>('/events/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const evento = await fastify.prisma.calendario_escolar.update({
      where: { id: request.params.id },
      data: request.body as Record<string, unknown>
    })
    return reply.send(evento)
  })

  // ── DELETE /v1/calendar/events/:id — Admin ────────────────────────────────
  fastify.delete<{ Params: CalendarioParams }>('/events/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.calendario_escolar.delete({ where: { id: request.params.id } })
    return reply.code(204).send()
  })
}

export default calendarioRoutes
