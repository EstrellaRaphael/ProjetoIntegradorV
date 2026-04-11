'use strict'

const { randomUUID } = require('crypto')

module.exports = async (fastify) => {
  // GET /v1/grades/recent — Admin/Professor — feed do dashboard
  fastify.get('/recent', {
    preHandler: fastify.requireRole(['ADMIN', 'PROFESSOR'])
  }, async (request, reply) => {
    const where = {}
    if (request.user.role === 'PROFESSOR') {
      where.professor_id = request.user.referenciaId
    }
    const notas = await fastify.prisma.nota.findMany({
      where,
      include: { avaliacao: true },
      orderBy: { lancada_em: 'desc' },
      take: 20
    })
    return reply.send(notas)
  })

  // GET /v1/grades/config — Admin lê configuração de média mínima
  fastify.get('/config', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (request, reply) => {
    const config = await fastify.prisma.configuracao_avaliacao.findFirst({
      where: { ativa: true },
      orderBy: { vigente_desde: 'desc' }
    })
    return reply.send(config ?? { media_min_aprovacao: 6.0 })
  })

  // PUT /v1/grades/config — Admin altera média mínima
  fastify.put('/config', {
    preHandler: fastify.requireRole(['ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['media_min_aprovacao'],
        properties: {
          media_min_aprovacao: { type: 'number', minimum: 0, maximum: 10 }
        }
      }
    }
  }, async (request, reply) => {
    // Desativa configuração anterior
    await fastify.prisma.configuracao_avaliacao.updateMany({
      where: { ativa: true },
      data: { ativa: false }
    })

    const config = await fastify.prisma.configuracao_avaliacao.create({
      data: {
        id: randomUUID(),
        media_min_aprovacao: request.body.media_min_aprovacao,
        vigente_desde: new Date(),
        alterado_por_admin_id: request.user.sub,
        ativa: true
      }
    })
    return reply.send(config)
  })

  // POST /v1/grades — Professor lança nota
  fastify.post('/', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['avaliacao_id', 'aluno_id', 'valor'],
        properties: {
          avaliacao_id: { type: 'string' },
          aluno_id: { type: 'string' },
          valor: { type: 'number', minimum: 0, maximum: 10 }
        }
      }
    }
  }, async (request, reply) => {
    const professorId = request.user.role === 'PROFESSOR'
      ? request.user.referenciaId
      : request.body.professor_id

    const nota = await fastify.prisma.nota.create({
      data: {
        id: randomUUID(),
        professor_id: professorId,
        avaliacao_id: request.body.avaliacao_id,
        aluno_id: request.body.aluno_id,
        valor: request.body.valor
      }
    })

    // Recalcula media bimestral após lançamento
    const avaliacao = await fastify.prisma.avaliacao.findUnique({
      where: { id: request.body.avaliacao_id }
    })
    if (avaliacao) {
      await recalcularMedia(fastify.prisma, request.body.aluno_id, avaliacao.disciplina_id, avaliacao.bimestre, avaliacao.ano_letivo)
    }

    return reply.code(201).send(nota)
  })

  // PUT /v1/grades/:id — Professor edita nota
  fastify.put('/:id', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN'])
  }, async (request, reply) => {
    const nota = await fastify.prisma.nota.update({
      where: { id: request.params.id },
      data: { valor: request.body.valor, editada_em: new Date() }
    })

    const avaliacao = await fastify.prisma.avaliacao.findUnique({
      where: { id: nota.avaliacao_id }
    })
    if (avaliacao) {
      await recalcularMedia(fastify.prisma, nota.aluno_id, avaliacao.disciplina_id, avaliacao.bimestre, avaliacao.ano_letivo)
    }

    return reply.send(nota)
  })

  // GET /v1/grades/:alunoId/boletim — aluno vê boletim, admin/professor também
  fastify.get('/:alunoId/boletim', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { alunoId } = request.params
    const { role, referenciaId } = request.user

    if (role === 'ALUNO' && referenciaId !== alunoId) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const medias = await fastify.prisma.media_bimestral.findMany({
      where: { aluno_id: alunoId },
      orderBy: [{ disciplina_id: 'asc' }, { bimestre: 'asc' }]
    })

    const provasFinal = await fastify.prisma.prova_final.findMany({
      where: { aluno_id: alunoId },
      orderBy: { disciplina_id: 'asc' }
    })

    return reply.send({ medias_bimestrais: medias, provas_final: provasFinal })
  })

  // POST /v1/grades/prova-final — Professor lança nota de prova final
  fastify.post('/prova-final', {
    preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN']),
    schema: {
      body: {
        type: 'object',
        required: ['aluno_id', 'disciplina_id', 'ano_letivo', 'nota_prova_final'],
        properties: {
          aluno_id: { type: 'string' },
          disciplina_id: { type: 'string' },
          ano_letivo: { type: 'integer' },
          nota_prova_final: { type: 'number', minimum: 0, maximum: 10 }
        }
      }
    }
  }, async (request, reply) => {
    const { aluno_id, disciplina_id, ano_letivo, nota_prova_final } = request.body

    const existing = await fastify.prisma.prova_final.findUnique({
      where: { aluno_id_disciplina_id_ano_letivo: { aluno_id, disciplina_id, ano_letivo } }
    })

    if (!existing) {
      return reply.code(400).send({ error: 'Registro de prova final não encontrado. Calcule a média anual primeiro.' })
    }

    const mediaFinal = Number(((existing.media_anual + nota_prova_final) / 2).toFixed(2))

    const config = await fastify.prisma.configuracao_avaliacao.findFirst({
      where: { ativa: true }
    })
    const mediaMin = Number(config?.media_min_aprovacao ?? 6.0)

    const status = mediaFinal >= mediaMin ? 'APROVADO_PF' : 'REPROVADO_NOTA'

    const pf = await fastify.prisma.prova_final.update({
      where: { id: existing.id },
      data: { nota_prova_final, media_final: mediaFinal, status }
    })

    return reply.send(pf)
  })
}

async function recalcularMedia(prisma, alunoId, disciplinaId, bimestre, anoLetivo) {
  const notas = await prisma.nota.findMany({
    where: { aluno_id: alunoId, substituida: false },
    include: { avaliacao: true }
  })

  const notasDoBimestre = notas.filter(n =>
    n.avaliacao.disciplina_id === disciplinaId &&
    n.avaliacao.bimestre === bimestre &&
    n.avaliacao.ano_letivo === anoLetivo &&
    n.avaliacao.tipo !== 'RECUPERACAO'
  )

  if (notasDoBimestre.length === 0) return

  const media = notasDoBimestre.reduce((acc, n) => acc + Number(n.valor), 0) / notasDoBimestre.length
  const valorCalculado = Number(media.toFixed(2))

  const existing = await prisma.media_bimestral.findFirst({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre, ano_letivo: anoLetivo }
  })

  if (existing) {
    await prisma.media_bimestral.update({
      where: { id: existing.id },
      data: { valor_calculado: valorCalculado }
    })
  } else {
    await prisma.media_bimestral.create({
      data: {
        id: require('crypto').randomUUID(),
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        bimestre,
        ano_letivo: anoLetivo,
        valor_calculado: valorCalculado
      }
    })
  }
}
