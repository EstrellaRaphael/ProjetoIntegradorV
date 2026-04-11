'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/teachers/:id/schedule — Admin ou próprio professor
  fastify.get('/:id/schedule', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'PROFESSOR' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const { bimestre, ano_letivo } = request.query
    const where = { professor_id: id }
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

  // GET /v1/schedule/changes/recent — para o dashboard (alunos/professores)
  fastify.get('/schedule/changes/recent', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const eventos = await fastify.prisma.evento_grade.findMany({
      where: { processado: false },
      include: { grade_horaria: true },
      orderBy: { publicado_em: 'desc' },
      take: 20
    })
    return reply.send(eventos)
  })

  // POST /v1/teachers/:id/schedule — Admin cria entrada na grade
  fastify.post('/:id/schedule', {
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
      data: { id: randomUUID(), professor_id: id, ...request.body }
    })

    // Publica evento para MS-5
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

  // PUT /v1/teachers/:id/schedule/:gradeId — Admin edita grade
  fastify.put('/:id/schedule/:gradeId', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const { gradeId } = request.params

    const grade = await fastify.prisma.grade_horaria.update({
      where: { id: gradeId },
      data: request.body
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

  // POST /v1/teachers/:id/schedule/:gradeId/substitution — Admin registra substituição
  fastify.post('/:id/schedule/:gradeId/substitution', {
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
  }, async (request, reply) => {
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
  })
}
