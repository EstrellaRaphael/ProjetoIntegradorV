import { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { recalcularMedia } from '../services/nota.service'
import { MEDIA_MINIMA_APROVACAO_PADRAO } from '../constants'

interface NotaParams {
  id: string
}

interface BoletimParams {
  alunoId: string
}

interface NotaBody {
  avaliacao_id: string
  aluno_id: string
  valor: number
  professor_id?: string
}

interface NotaEditBody {
  valor: number
}

interface ConfigBody {
  media_min_aprovacao: number
}

interface ProvaFinalBody {
  aluno_id: string
  disciplina_id: string
  ano_letivo: number
  nota_prova_final: number
}

const notasRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/grades/recent — Admin/Professor — feed do dashboard ───────────
  fastify.get('/recent', {
    preHandler: fastify.requireRole(['ADMIN', 'PROFESSOR'])
  }, async (request, reply) => {
    const where: Record<string, unknown> = {}
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

  // ── GET /v1/grades/config — Admin lê configuração de média mínima ─────────
  fastify.get('/config', {
    preHandler: fastify.requireRole(['ADMIN'])
  }, async (_request, reply) => {
    const config = await fastify.prisma.configuracao_avaliacao.findFirst({
      where: { ativa: true },
      orderBy: { vigente_desde: 'desc' }
    })
    return reply.send(config ?? { media_min_aprovacao: MEDIA_MINIMA_APROVACAO_PADRAO })
  })

  // ── PUT /v1/grades/config — Admin altera média mínima ─────────────────────
  fastify.put<{ Body: ConfigBody }>('/config', {
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

  // ── POST /v1/grades — Professor lança nota ────────────────────────────────
  fastify.post<{ Body: NotaBody }>('/', {
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
    const professorId =
      request.user.role === 'PROFESSOR'
        ? request.user.referenciaId
        : request.body.professor_id

    const nota = await fastify.prisma.nota.create({
      data: {
        id: randomUUID(),
        professor_id: professorId ?? '',
        avaliacao_id: request.body.avaliacao_id,
        aluno_id: request.body.aluno_id,
        valor: request.body.valor
      }
    })

    // Delega recálculo da média ao service layer
    const avaliacao = await fastify.prisma.avaliacao.findUnique({
      where: { id: request.body.avaliacao_id }
    })
    if (avaliacao) {
      await recalcularMedia(
        fastify.prisma,
        request.body.aluno_id,
        avaliacao.disciplina_id,
        avaliacao.bimestre,
        avaliacao.ano_letivo
      )
    }

    return reply.code(201).send(nota)
  })

  // ── PUT /v1/grades/:id — Professor edita nota ─────────────────────────────
  fastify.put<{ Params: NotaParams; Body: NotaEditBody }>('/:id', {
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
      await recalcularMedia(
        fastify.prisma,
        nota.aluno_id,
        avaliacao.disciplina_id,
        avaliacao.bimestre,
        avaliacao.ano_letivo
      )
    }

    return reply.send(nota)
  })

  // ── GET /v1/grades/:alunoId/boletim — aluno vê boletim ───────────────────
  fastify.get<{ Params: BoletimParams }>('/:alunoId/boletim', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { alunoId } = request.params
    const { role, referenciaId } = request.user

    if (role === 'ALUNO' && referenciaId !== alunoId) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const [medias, provasFinal] = await Promise.all([
      fastify.prisma.media_bimestral.findMany({
        where: { aluno_id: alunoId },
        orderBy: [{ disciplina_id: 'asc' }, { bimestre: 'asc' }]
      }),
      fastify.prisma.prova_final.findMany({
        where: { aluno_id: alunoId },
        orderBy: { disciplina_id: 'asc' }
      })
    ])

    return reply.send({ medias_bimestrais: medias, provas_final: provasFinal })
  })

  // ── POST /v1/grades/prova-final — Professor lança nota de prova final ─────
  fastify.post<{ Body: ProvaFinalBody }>('/prova-final', {
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
      return reply.code(400).send({
        error: 'Registro de prova final não encontrado. Calcule a média anual primeiro.'
      })
    }

    // media_anual é Decimal (MySQL DECIMAL); converte antes de operar com number
    const mediaFinal = Number(((Number(existing.media_anual) + nota_prova_final) / 2).toFixed(2))

    const config = await fastify.prisma.configuracao_avaliacao.findFirst({
      where: { ativa: true }
    })
    const mediaMin = Number(config?.media_min_aprovacao ?? MEDIA_MINIMA_APROVACAO_PADRAO)

    const status = mediaFinal >= mediaMin ? 'APROVADO_PF' : 'REPROVADO_NOTA'

    const pf = await fastify.prisma.prova_final.update({
      where: { id: existing.id },
      data: { nota_prova_final, media_final: mediaFinal, status }
    })

    return reply.send(pf)
  })
}

export default notasRoutes
