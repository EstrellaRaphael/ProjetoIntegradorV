import { FastifyPluginAsync } from 'fastify'

// ── Interfaces de request ────────────────────────────────────────────────────

interface UpdatePreferencesBody {
  email_obrigatorio: boolean
  whatsapp_opcional: boolean
}

// ── Rotas ────────────────────────────────────────────────────────────────────

const notificacoesRoutes: FastifyPluginAsync = async (fastify) => {

  // ── GET /notifications/preferences ─────────────────────────────────────────
  // Retorna (ou cria com defaults) as preferências do usuário autenticado
  fastify.get('/preferences', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const userId = request.user.sub

    const prefs = await fastify.prisma.preferencia_usuario.upsert({
      where: { usuario_id: userId },
      update: {},
      create: {
        usuario_id: userId,
        email_obrigatorio: true,
        whatsapp_opcional: false
      }
    })

    return reply.send(prefs)
  })

  // ── PUT /notifications/preferences ─────────────────────────────────────────
  // Atualiza preferências do usuário autenticado
  fastify.put<{ Body: UpdatePreferencesBody }>('/preferences', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const userId = request.user.sub
    const { email_obrigatorio, whatsapp_opcional } = request.body

    const prefs = await fastify.prisma.preferencia_usuario.upsert({
      where: { usuario_id: userId },
      update: { email_obrigatorio, whatsapp_opcional },
      create: { usuario_id: userId, email_obrigatorio, whatsapp_opcional }
    })

    return reply.send(prefs)
  })
}

export default notificacoesRoutes
