import { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'

interface DisciplinaParams {
  id: string
}

interface DisciplinaBody {
  nome: string
  carga_horaria: number
  [key: string]: unknown
}

const disciplinasRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/disciplines ───────────────────────────────────────────────────
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (_request, reply) => {
    const disciplinas = await fastify.prisma.disciplina.findMany({
      orderBy: { nome: 'asc' }
    })
    return reply.send(disciplinas)
  })

  // ── GET /v1/disciplines/:id ───────────────────────────────────────────────
  fastify.get<{ Params: DisciplinaParams }>('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const d = await fastify.prisma.disciplina.findUnique({ where: { id: request.params.id } })
    if (!d) return reply.code(404).send({ error: 'Disciplina não encontrada' })
    return reply.send(d)
  })

  // ── POST /v1/disciplines — Admin ──────────────────────────────────────────
  fastify.post<{ Body: DisciplinaBody }>('/', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['nome', 'carga_horaria'],
        properties: {
          nome: { type: 'string' },
          carga_horaria: { type: 'integer', minimum: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const d = await fastify.prisma.disciplina.create({
      data: { id: randomUUID(), ...request.body }
    })
    return reply.code(201).send(d)
  })

  // ── PUT /v1/disciplines/:id — Admin ───────────────────────────────────────
  fastify.put<{ Params: DisciplinaParams }>('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const d = await fastify.prisma.disciplina.update({
      where: { id: request.params.id },
      data: request.body as Record<string, unknown>
    })
    return reply.send(d)
  })

  // ── DELETE /v1/disciplines/:id — Admin ────────────────────────────────────
  fastify.delete<{ Params: DisciplinaParams }>('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.disciplina.delete({ where: { id: request.params.id } })
    return reply.code(204).send()
  })
}

export default disciplinasRoutes
