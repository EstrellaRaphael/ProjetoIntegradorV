import { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { grade_horaria_dia_semana } from '@prisma/client'

interface GradeParams {
  id: string
}

interface GradeParamsWithId {
  id: string
  gradeId: string
}

interface GradeQuery {
  bimestre?: string
  ano_letivo?: string
}

interface GradeBody {
  turma_id: string
  disciplina_id: string
  bimestre: number
  ano_letivo: number
  dia_semana: string
  horario_inicio: string
  horario_fim: string
}

interface SubstituicaoBody {
  professor_substituto_id: string
  motivo?: string
  data_inicio: string
  data_fim?: string
}

const gradeRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/teachers/:id/schedule — Admin ou próprio professor ────────────
  fastify.get<{ Params: GradeParams; Querystring: GradeQuery }>('/:id/schedule', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'PROFESSOR' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const { bimestre, ano_letivo } = request.query
    const where: Record<string, unknown> = { professor_id: id }
    if (bimestre) where.bimestre = Number(bimestre)
    if (ano_letivo) where.ano_letivo = Number(ano_letivo)

    const grade = await fastify.prisma.grade_horaria.findMany({
      where,
      include: {
        substituicao_professor: {
          where: {
            OR: [{ data_fim: null }, { data_fim: { gte: new Date() } }]
          }
        }
      },
      orderBy: [{ dia_semana: 'asc' }, { horario_inicio: 'asc' }]
    })

    return reply.send(grade)
  })

  // ── GET /v1/teachers/schedule/changes/recent — feed do dashboard ──────────
  fastify.get('/schedule/changes/recent', {
    preHandler: fastify.authenticate
  }, async (_request, reply) => {
    const eventos = await fastify.prisma.evento_grade.findMany({
      where: { processado: false },
      include: { grade_horaria: true },
      orderBy: { publicado_em: 'desc' },
      take: 20
    })
    return reply.send(eventos)
  })

  // ── POST /v1/teachers/:id/schedule — Admin cria entrada na grade ──────────
  fastify.post<{ Params: GradeParams; Body: GradeBody }>('/:id/schedule', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['turma_id', 'disciplina_id', 'bimestre', 'ano_letivo', 'dia_semana', 'horario_inicio', 'horario_fim'],
        properties: {
          turma_id: { type: 'string' },
          disciplina_id: { type: 'string' },
          bimestre: { type: 'integer', minimum: 1, maximum: 4 },
          ano_letivo: { type: 'integer' },
          dia_semana: { type: 'string', enum: ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'] },
          horario_inicio: { type: 'string' },
          horario_fim: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params

    const grade = await fastify.prisma.grade_horaria.create({
      data: {
        id: randomUUID(),
        professor_id: id,
        ...request.body,
        dia_semana: request.body.dia_semana as grade_horaria_dia_semana
      }
    })

    // Publica evento para MS-05 (Outbox Pattern)
    await fastify.prisma.evento_grade.create({
      data: {
        id: randomUUID(),
        grade_horaria_id: grade.id,
        tipo: 'CRIACAO',
        descricao: `Grade criada: ${request.body.dia_semana} ${request.body.horario_inicio}-${request.body.horario_fim}`
      }
    })

    return reply.code(201).send(grade)
  })

  // ── PUT /v1/teachers/:id/schedule/:gradeId — Admin edita grade ────────────
  fastify.put<{ Params: GradeParamsWithId }>('/:id/schedule/:gradeId', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const { gradeId } = request.params

    const grade = await fastify.prisma.grade_horaria.update({
      where: { id: gradeId },
      data: request.body as Record<string, unknown>
    })

    await fastify.prisma.evento_grade.create({
      data: {
        id: randomUUID(),
        grade_horaria_id: grade.id,
        tipo: 'EDICAO',
        descricao: `Grade alterada: ${JSON.stringify(request.body)}`
      }
    })

    return reply.send(grade)
  })

  // ── POST /v1/teachers/:id/schedule/:gradeId/substitution — substituição ───
  fastify.post<{ Params: GradeParamsWithId; Body: SubstituicaoBody }>(
    '/:id/schedule/:gradeId/substitution',
    {
      preHandler: fastify.requireRole(['ADMIN']),
      schema: {
        body: {
          type: 'object',
          required: ['professor_substituto_id', 'data_inicio'],
          properties: {
            professor_substituto_id: { type: 'string' },
            motivo: { type: 'string' },
            data_inicio: { type: 'string' },
            data_fim: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { gradeId } = request.params

      const sub = await fastify.prisma.substituicao_professor.create({
        data: { id: randomUUID(), grade_horaria_id: gradeId, ...request.body }
      })

      await fastify.prisma.evento_grade.create({
        data: {
          id: randomUUID(),
          grade_horaria_id: gradeId,
          tipo: 'SUBSTITUICAO',
          descricao: `Substituição: motivo=${request.body.motivo ?? 'não informado'}`
        }
      })

      return reply.code(201).send(sub)
    }
  )
}

export default gradeRoutes
