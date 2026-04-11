'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/students — Admin lista todos
  fastify.get('/', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const { page = 1, limit = 20, status } = request.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = status ? { status } : {}

    const [alunos, total] = await Promise.all([
      fastify.prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { nome_completo: 'asc' }
      }),
      fastify.prisma.aluno.count({ where })
    ])

    return reply.send({ data: alunos, total, page: Number(page), limit: Number(limit) })
  })

  // GET /v1/students/count — Admin
  fastify.get('/count', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const total = await fastify.prisma.aluno.count()
    return reply.send({ total })
  })

  // GET /v1/students/me — Aluno vê próprio perfil
  fastify.get('/me', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    if (request.user.role !== 'ALUNO') {
      return reply.code(403).send({ error: 'Rota exclusiva para alunos' })
    }

    const aluno = await fastify.prisma.aluno.findUnique({
      where: { id: request.user.referenciaId }
    })

    if (!aluno) return reply.code(404).send({ error: 'Aluno não encontrado' })
    return reply.send(aluno)
  })

  // GET /v1/students/:id — Admin ou o próprio aluno
  fastify.get('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'ALUNO' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const aluno = await fastify.prisma.aluno.findUnique({ where: { id } })
    if (!aluno) return reply.code(404).send({ error: 'Aluno não encontrado' })
    return reply.send(aluno)
  })

  // POST /v1/students — Admin cria aluno
  fastify.post('/', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['nome_completo', 'data_nascimento', 'email', 'cpf',
          'end_logradouro', 'end_numero', 'end_bairro', 'end_cidade', 'end_estado', 'end_cep'],
        properties: {
          matricula: { type: 'string' },
          nome_completo: { type: 'string' },
          data_nascimento: { type: 'string' },
          email: { type: 'string', format: 'email' },
          cpf: { type: 'string' },
          telefone: { type: 'string' },
          end_logradouro: { type: 'string' },
          end_numero: { type: 'string' },
          end_complemento: { type: 'string' },
          end_bairro: { type: 'string' },
          end_cidade: { type: 'string' },
          end_estado: { type: 'string', maxLength: 2 },
          end_cep: { type: 'string' },
          turma_atual_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const data = {
      id: randomUUID(),
      matricula: request.body.matricula ?? `MAT-${Date.now()}`,
      ...request.body
    }

    const aluno = await fastify.prisma.aluno.create({ data })
    return reply.code(201).send(aluno)
  })

  // PUT /v1/students/:id — Admin edita
  fastify.put('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const { id } = request.params

    const aluno = await fastify.prisma.aluno.update({
      where: { id },
      data: request.body
    })
    return reply.send(aluno)
  })

  // DELETE /v1/students/:id — Admin remove (soft: muda status para INATIVO)
  fastify.delete('/:id', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    await fastify.prisma.aluno.update({
      where: { id: request.params.id },
      data: { status: 'INATIVO' }
    })
    return reply.code(204).send()
  })
}
