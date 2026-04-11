'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/students/:id/frequency — Admin ou Professor ou próprio aluno
  fastify.get('/:id/frequency', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'ALUNO' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const { bimestre, disciplina_id } = request.query
    const where = { aluno_id: id }
    if (bimestre) where.bimestre = Number(bimestre)
    if (disciplina_id) where.disciplina_id = disciplina_id

    const frequencias = await fastify.prisma.frequencia_consolidada.findMany({
      where,
      orderBy: [{ bimestre: 'asc' }]
    })

    return reply.send(frequencias)
  })

  // POST /v1/students/:id/frequency — Professor lança presença/falta
  fastify.post('/:id/frequency', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['disciplina_id', 'turma_id', 'data', 'presente', 'bimestre'],
        properties: {
          disciplina_id: { type: 'string' },
          turma_id: { type: 'string' },
          data: { type: 'string' },
          presente: { type: 'boolean' },
          bimestre: { type: 'integer', minimum: 1, maximum: 4 },
          observacao: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const professorId = request.user.role === 'PROFESSOR'
      ? request.user.referenciaId
      : request.body.professor_id

    const registro = await fastify.prisma.registro_frequencia.create({
      data: {
        id: randomUUID(),
        aluno_id: id,
        professor_id: professorId,
        ...request.body
      }
    })

    // Recalcula frequencia_consolidada
    await recalcularFrequencia(fastify.prisma, id, request.body.disciplina_id, request.body.bimestre)

    return reply.code(201).send(registro)
  })

  // POST /v1/students/:id/frequency/override — Admin faz override de reprovação por falta
  fastify.post('/:id/frequency/override', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['disciplina_id', 'justificativa'],
        properties: {
          disciplina_id: { type: 'string' },
          justificativa: { type: 'string', minLength: 10 }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const { disciplina_id, justificativa } = request.body

    const fc = await fastify.prisma.frequencia_consolidada.findFirst({
      where: { aluno_id: id, disciplina_id }
    })

    if (!fc) return reply.code(404).send({ error: 'Frequência não encontrada' })

    const override = await fastify.prisma.override_frequencia.create({
      data: {
        id: randomUUID(),
        aluno_id: id,
        disciplina_id,
        admin_id: request.user.sub,
        justificativa,
        status_anterior: fc.reprovado_por_falta
      }
    })

    await fastify.prisma.frequencia_consolidada.update({
      where: { id: fc.id },
      data: { reprovado_por_falta: false }
    })

    return reply.code(201).send(override)
  })
}

async function recalcularFrequencia(prisma, alunoId, disciplinaId, bimestre) {
  const registros = await prisma.registro_frequencia.findMany({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre }
  })

  const totalAulas = registros.length
  const totalPresencas = registros.filter(r => r.presente).length
  const percentual = totalAulas > 0
    ? Number(((totalPresencas / totalAulas) * 100).toFixed(2))
    : 0
  const reprovadoPorFalta = percentual < 75

  const existing = await prisma.frequencia_consolidada.findFirst({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre }
  })

  if (existing) {
    await prisma.frequencia_consolidada.update({
      where: { id: existing.id },
      data: { total_aulas: totalAulas, total_presencas: totalPresencas, percentual, reprovado_por_falta: reprovadoPorFalta }
    })
  } else {
    await prisma.frequencia_consolidada.create({
      data: {
        id: require('crypto').randomUUID(),
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        bimestre,
        total_aulas: totalAulas,
        total_presencas: totalPresencas,
        percentual,
        reprovado_por_falta: reprovadoPorFalta
      }
    })
  }
}
