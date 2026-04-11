'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/calendar/events — todos os perfis (filtrado por turma no frontend)
  fastify.get('/events', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { tipo, data_inicio, data_fim } = request.query
    const where = {}
    if (tipo) where.tipo = tipo
    if (data_inicio || data_fim) {
      where.data = {}
      if (data_inicio) where.data.gte = new Date(data_inicio)
      if (data_fim) where.data.lte = new Date(data_fim)
    }

    const eventos = await fastify.prisma.calendario_escolar.findMany({
      where,
      orderBy: { data: 'asc' }
    })
    return reply.send(eventos)
  })

  // POST /v1/calendar/events — Admin cria evento geral
  fastify.post('/events', {
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
      data: { id: randomUUID(), ...request.body }
    })
    return reply.code(201).send(evento)
  })

  // PUT /v1/calendar/events/:id — Admin
  fastify.put('/events/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const evento = await fastify.prisma.calendario_escolar.update({
      where: { id: request.params.id },
      data: request.body
    })
    return reply.send(evento)
  })

  // DELETE /v1/calendar/events/:id — Admin
  fastify.delete('/events/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.calendario_escolar.delete({ where: { id: request.params.id } })
    return reply.code(204).send()
  })
}
