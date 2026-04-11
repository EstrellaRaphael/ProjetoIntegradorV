'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/teachers — Admin
  fastify.get('/', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query
    const skip = (Number(page) - 1) * Number(limit)

    const [professores, total] = await Promise.all([
      fastify.prisma.professor.findMany({
        skip,
        take: Number(limit),
        include: { professor_disciplina: true, professor_turma: true },
        orderBy: { nome_completo: 'asc' }
      }),
      fastify.prisma.professor.count()
    ])

    return reply.send({ data: professores, total, page: Number(page), limit: Number(limit) })
  })

  // GET /v1/teachers/count — Admin
  fastify.get('/count', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const total = await fastify.prisma.professor.count()
    return reply.send({ total })
  })

  // GET /v1/teachers/me — Professor vê próprio perfil
  fastify.get('/me', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    if (request.user.role !== 'PROFESSOR') {
      return reply.code(403).send({ error: 'Rota exclusiva para professores' })
    }
    const professor = await fastify.prisma.professor.findUnique({
      where: { id: request.user.referenciaId },
      include: { professor_disciplina: true, professor_turma: true }
    })
    if (!professor) return reply.code(404).send({ error: 'Professor não encontrado' })
    return reply.send(professor)
  })

  // GET /v1/teachers/:id
  fastify.get('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'PROFESSOR' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const professor = await fastify.prisma.professor.findUnique({
      where: { id },
      include: { professor_disciplina: true, professor_turma: true }
    })
    if (!professor) return reply.code(404).send({ error: 'Professor não encontrado' })
    return reply.send(professor)
  })

  // POST /v1/teachers — Admin
  fastify.post('/', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['nome_completo', 'email'],
        properties: {
          nome_completo: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    const professor = await fastify.prisma.professor.create({
      data: { id: randomUUID(), ...request.body }
    })
    return reply.code(201).send(professor)
  })

  // PUT /v1/teachers/:id — Admin
  fastify.put('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const professor = await fastify.prisma.professor.update({
      where: { id: request.params.id },
      data: request.body
    })
    return reply.send(professor)
  })

  // DELETE /v1/teachers/:id — Admin
  fastify.delete('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.professor.delete({ where: { id: request.params.id } })
    return reply.code(204).send()
  })
}
