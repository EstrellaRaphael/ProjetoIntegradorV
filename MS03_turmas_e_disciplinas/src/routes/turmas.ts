import { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { turma_turno } from '@prisma/client'

interface TurmaParams {
  id: string
}

interface TurmaStudentParams {
  id: string
  alunoId: string
}

interface TurmaQuery {
  page?: string
  limit?: string
  ano_letivo?: string
}

interface TurmaBody {
  codigo: string
  ano_letivo: number
  turno: string
  calendario_id: string
  [key: string]: unknown
}

interface AlocacaoAlunoBody {
  aluno_id: string
  data_matricula: string
}

const turmasRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/classes — todos os perfis ────────────────────────────────────
  fastify.get<{ Querystring: TurmaQuery }>('/', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { page = '1', limit = '20', ano_letivo } = request.query
    const skip = (Number(page) - 1) * Number(limit)
    const where = ano_letivo ? { ano_letivo: Number(ano_letivo) } : {}

    const [turmas, total] = await Promise.all([
      fastify.prisma.turma.findMany({
        where,
        skip,
        take: Number(limit),
        include: { alocacao_professor: true, alocacao_aluno: true },
        orderBy: { codigo: 'asc' }
      }),
      fastify.prisma.turma.count({ where })
    ])

    return reply.send({ data: turmas, total, page: Number(page), limit: Number(limit) })
  })

  // ── GET /v1/classes/active/count — Admin dashboard ───────────────────────
  fastify.get('/active/count', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (_request, reply) => {
    const anoAtual = new Date().getFullYear()
    const total = await fastify.prisma.turma.count({ where: { ano_letivo: anoAtual } })
    return reply.send({ total })
  })

  // ── GET /v1/classes/:id ───────────────────────────────────────────────────
  fastify.get<{ Params: TurmaParams }>('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const turma = await fastify.prisma.turma.findUnique({
      where: { id: request.params.id },
      include: { alocacao_professor: true, alocacao_aluno: true }
    })
    if (!turma) return reply.code(404).send({ error: 'Turma não encontrada' })
    return reply.send(turma)
  })

  // ── POST /v1/classes — Admin ──────────────────────────────────────────────
  fastify.post<{ Body: TurmaBody }>('/', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['codigo', 'ano_letivo', 'turno', 'calendario_id'],
        properties: {
          codigo: { type: 'string' },
          ano_letivo: { type: 'integer' },
          turno: { type: 'string', enum: ['MANHA', 'TARDE', 'NOITE'] },
          calendario_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const turma = await fastify.prisma.turma.create({
      data: {
        id: randomUUID(),
        ...request.body,
        turno: request.body.turno as turma_turno
      }
    })
    return reply.code(201).send(turma)
  })

  // ── PUT /v1/classes/:id — Admin ───────────────────────────────────────────
  fastify.put<{ Params: TurmaParams }>('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const turma = await fastify.prisma.turma.update({
      where: { id: request.params.id },
      data: request.body as Record<string, unknown>
    })
    return reply.send(turma)
  })

  // ── DELETE /v1/classes/:id — Admin ────────────────────────────────────────
  fastify.delete<{ Params: TurmaParams }>('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.turma.delete({ where: { id: request.params.id } })
    return reply.code(204).send()
  })

  // ── POST /v1/classes/:id/students — Admin associa aluno à turma ──────────
  fastify.post<{ Params: TurmaParams; Body: AlocacaoAlunoBody }>('/:id/students', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['aluno_id', 'data_matricula'],
        properties: {
          aluno_id: { type: 'string' },
          data_matricula: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const alocacao = await fastify.prisma.alocacao_aluno.create({
      data: { id: randomUUID(), turma_id: request.params.id, ...request.body }
    })
    return reply.code(201).send(alocacao)
  })

  // ── DELETE /v1/classes/:id/students/:alunoId — Admin remove aluno ─────────
  fastify.delete<{ Params: TurmaStudentParams }>('/:id/students/:alunoId', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.alocacao_aluno.deleteMany({
      where: { turma_id: request.params.id, aluno_id: request.params.alunoId }
    })
    return reply.code(204).send()
  })
}

export default turmasRoutes
