'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/assessments — Professor lista suas avaliações; Admin vê todas
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { turma_id, disciplina_id, bimestre, ano_letivo } = request.query
    const where = {}
    if (turma_id) where.turma_id = turma_id
    if (disciplina_id) where.disciplina_id = disciplina_id
    if (bimestre) where.bimestre = Number(bimestre)
    if (ano_letivo) where.ano_letivo = Number(ano_letivo)

    if (request.user.role === 'PROFESSOR') {
      where.professor_id = request.user.referenciaId
    }

    const avaliacoes = await fastify.prisma.avaliacao.findMany({
      where, orderBy: [{ bimestre: 'asc' }, { data_aplicacao: 'asc' }]
    })
    return reply.send(avaliacoes)
  })

  // GET /v1/assessments/:id
  fastify.get('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const av = await fastify.prisma.avaliacao.findUnique({ where: { id: request.params.id } })
    if (!av) return reply.code(404).send({ error: 'Avaliação não encontrada' })
    return reply.send(av)
  })

  // POST /v1/assessments — Professor cria avaliação
  fastify.post('/', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['titulo', 'tipo', 'bimestre', 'ano_letivo', 'disciplina_id', 'turma_id', 'data_aplicacao'],
        properties: {
          titulo: { type: 'string' },
          tipo: { type: 'string', enum: ['PROVA', 'TRABALHO', 'RECUPERACAO', 'PROVA_FINAL'] },
          bimestre: { type: 'integer', minimum: 1, maximum: 4 },
          ano_letivo: { type: 'integer' },
          disciplina_id: { type: 'string' },
          turma_id: { type: 'string' },
          data_aplicacao: { type: 'string' },
          peso_na_media: { type: 'number', minimum: 0.01 }
        }
      }
    }
  }, async (request, reply) => {
    const professorId = request.user.role === 'PROFESSOR'
      ? request.user.referenciaId
      : request.body.professor_id

    const av = await fastify.prisma.avaliacao.create({
      data: { id: randomUUID(), professor_id: professorId, ...request.body }
    })
    return reply.code(201).send(av)
  })

  // PUT /v1/assessments/:id — Professor edita sua avaliação
  fastify.put('/:id', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN'])
  }, async (request, reply) => {
    const av = await fastify.prisma.avaliacao.update({
      where: { id: request.params.id },
      data: request.body
    })
    return reply.send(av)
  })
}
