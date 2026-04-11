import { FastifyPluginAsync } from 'fastify'
import crypto from 'crypto'

// ── Tipos locais (enums da camada de aplicação) ──────────────────────────────

export type TipoPublico = 'GERAL' | 'TURMA_ESPECIFICA' | 'TODOS_PROFESSORES' | 'LISTA_MANUAL'

// ── Interfaces de request ────────────────────────────────────────────────────

interface CreateComunicadoBody {
  titulo: string
  conteudo: string
  publico_alvo: TipoPublico
  turma_id?: string        // obrigatório se TURMA_ESPECIFICA
  destinatarios?: string[] // lista de usuario_ids (obrigatório se LISTA_MANUAL)
}

interface ComunicadoParams {
  id: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Busca alunos de uma turma via MS-03 */
async function resolveAlunosDaTurma(turmaId: string): Promise<string[]> {
  const ms03Url = process.env.MS03_URL ?? 'http://localhost:3003'
  try {
    const res = await fetch(`${ms03Url}/v1/classes/${turmaId}`)
    if (!res.ok) return []
    const turma = await res.json() as { alocacao_aluno?: { aluno_id: string }[] }
    return (turma.alocacao_aluno ?? []).map((a) => a.aluno_id)
  } catch {
    return []
  }
}

/** Busca IDs de todos os professores via MS-02 */
async function resolveTodosProfessores(): Promise<string[]> {
  const ms02Url = process.env.MS02_URL ?? 'http://localhost:3002'
  try {
    const res = await fetch(`${ms02Url}/v1/teachers?limit=1000`)
    if (!res.ok) return []
    const body = await res.json() as { data?: { id: string }[] }
    return (body.data ?? []).map((p) => p.id)
  } catch {
    return []
  }
}

// ── Rotas ────────────────────────────────────────────────────────────────────

const comunicadosRoutes: FastifyPluginAsync = async (fastify) => {

  // ── GET /communications ─────────────────────────────────────────────────────
  // Lista comunicados filtrados por role:
  //   ADMIN → todos
  //   PROFESSOR → os que enviou + os que recebeu
  //   ALUNO → publico_alvo = GERAL + os que recebeu
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const user = request.user

    if (user.role === 'ADMIN') {
      const comunicados = await fastify.prisma.comunicado.findMany({
        include: {
          destinatario_comunicado: {
            select: { id: true, usuario_id: true, lido: true, data_leitura: true }
          }
        },
        orderBy: { data_envio: 'desc' }
      })
      return reply.send(comunicados)
    }

    if (user.role === 'PROFESSOR') {
      const comunicados = await fastify.prisma.comunicado.findMany({
        where: {
          OR: [
            { remetente_id: user.sub },
            { destinatario_comunicado: { some: { usuario_id: user.sub } } }
          ]
        },
        include: {
          destinatario_comunicado: {
            where: { usuario_id: user.sub },
            select: { id: true, lido: true, data_leitura: true }
          }
        },
        orderBy: { data_envio: 'desc' }
      })
      return reply.send(comunicados)
    }

    // ALUNO
    const comunicados = await fastify.prisma.comunicado.findMany({
      where: {
        OR: [
          { publico_alvo: 'GERAL' },
          { destinatario_comunicado: { some: { usuario_id: user.sub } } }
        ]
      },
      include: {
        destinatario_comunicado: {
          where: { usuario_id: user.sub },
          select: { id: true, lido: true, data_leitura: true }
        }
      },
      orderBy: { data_envio: 'desc' }
    })
    return reply.send(comunicados)
  })

  // ── GET /communications/recent ──────────────────────────────────────────────
  // Feed dos 20 comunicados mais recentes visíveis ao usuário atual
  fastify.get('/recent', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const user = request.user

    const where =
      user.role === 'ADMIN'
        ? {}
        : user.role === 'PROFESSOR'
        ? {
            OR: [
              { remetente_id: user.sub },
              { destinatario_comunicado: { some: { usuario_id: user.sub } } }
            ]
          }
        : {
            OR: [
              { publico_alvo: 'GERAL' },
              { destinatario_comunicado: { some: { usuario_id: user.sub } } }
            ]
          }

    const comunicados = await fastify.prisma.comunicado.findMany({
      where,
      orderBy: { data_envio: 'desc' },
      take: 20,
      include: {
        destinatario_comunicado:
          user.role !== 'ADMIN'
            ? { where: { usuario_id: user.sub }, select: { lido: true } }
            : { select: { lido: true } }
      }
    })

    return reply.send(comunicados)
  })

  // ── GET /communications/unread ──────────────────────────────────────────────
  // Contagem de comunicados não lidos — usado no dashboard
  fastify.get('/unread', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const total = await fastify.prisma.destinatario_comunicado.count({
      where: { usuario_id: request.user.sub, lido: false }
    })
    return reply.send({ total })
  })

  // ── GET /communications/:id ─────────────────────────────────────────────────
  // Detalhes de um comunicado (com validação de acesso para ALUNO)
  fastify.get<{ Params: ComunicadoParams }>('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user

    const comunicado = await fastify.prisma.comunicado.findUnique({
      where: { id },
      include: {
        destinatario_comunicado:
          user.role === 'ADMIN'
            ? true
            : { where: { usuario_id: user.sub } }
      }
    })

    if (!comunicado) {
      return reply.code(404).send({ error: 'Comunicado não encontrado' })
    }

    // ALUNO: valida acesso
    if (user.role === 'ALUNO') {
      const temAcesso =
        comunicado.publico_alvo === 'GERAL' ||
        comunicado.destinatario_comunicado.some((d) => d.usuario_id === user.sub)
      if (!temAcesso) {
        return reply.code(403).send({ error: 'Acesso negado a este comunicado' })
      }
    }

    return reply.send(comunicado)
  })

  // ── POST /communications ────────────────────────────────────────────────────
  // Cria e envia comunicado (ADMIN ou PROFESSOR)
  fastify.post<{ Body: CreateComunicadoBody }>('/', {
    preHandler: fastify.requireRole(['ADMIN', 'PROFESSOR'])
  }, async (request, reply) => {
    const { titulo, conteudo, publico_alvo, turma_id, destinatarios } = request.body
    const remetenteId = request.user.sub
    const comunicadoId = crypto.randomUUID()

    // Resolve lista de destinatários conforme o tipo de público
    let usuarioIds: string[] = []

    if (publico_alvo === 'LISTA_MANUAL') {
      usuarioIds = destinatarios ?? []
    } else if (publico_alvo === 'TURMA_ESPECIFICA') {
      if (!turma_id) {
        return reply.code(400).send({ error: 'turma_id é obrigatório para TURMA_ESPECIFICA' })
      }
      usuarioIds = await resolveAlunosDaTurma(turma_id)
    } else if (publico_alvo === 'TODOS_PROFESSORES') {
      usuarioIds = await resolveTodosProfessores()
    }
    // GERAL: não precisa de destinatários explícitos — todos veem

    const comunicado = await fastify.prisma.$transaction(async (tx) => {
      // 1. Cria o comunicado
      const c = await tx.comunicado.create({
        data: {
          id: comunicadoId,
          remetente_id: remetenteId,
          titulo,
          conteudo,
          publico_alvo
        }
      })

      if (usuarioIds.length > 0) {
        // 2. Cria registros de destinatário (controle de leitura)
        await tx.destinatario_comunicado.createMany({
          data: usuarioIds.map((uid) => ({
            id: crypto.randomUUID(),
            comunicado_id: comunicadoId,
            usuario_id: uid,
            lido: false
          })),
          skipDuplicates: true
        })

        // 3. Cria notificações externas (processadas pelo worker)
        await tx.notificacao_externa.createMany({
          data: usuarioIds.map((uid) => ({
            id: crypto.randomUUID(),
            usuario_id: uid,
            mensagem: `Novo comunicado: ${titulo}`,
            canal: 'EMAIL',
            status: 'PENDENTE',
            tentativas: 0
          }))
        })
      }

      return c
    })

    return reply.code(201).send(comunicado)
  })

  // ── PUT /communications/:id/read ────────────────────────────────────────────
  // Marca comunicado como lido para o usuário autenticado
  fastify.put<{ Params: ComunicadoParams }>('/:id/read', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const userId = request.user.sub

    const destinatario = await fastify.prisma.destinatario_comunicado.findFirst({
      where: { comunicado_id: id, usuario_id: userId }
    })

    if (!destinatario) {
      return reply.code(404).send({ error: 'Destinatário não encontrado para este comunicado' })
    }

    if (destinatario.lido) {
      return reply.send({ success: true, message: 'Já estava marcado como lido' })
    }

    await fastify.prisma.destinatario_comunicado.update({
      where: { id: destinatario.id },
      data: { lido: true, data_leitura: new Date() }
    })

    return reply.send({ success: true })
  })
}

export default comunicadosRoutes
