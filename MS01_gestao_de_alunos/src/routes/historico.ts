import { FastifyPluginAsync } from 'fastify'

interface HistoricoParams {
  id: string
}

const historicoRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/students/:id/history — Admin ou próprio aluno ─────────────────
  fastify.get<{ Params: HistoricoParams }>('/:id/history', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params
    const { role, referenciaId } = request.user

    if (role === 'ALUNO' && referenciaId !== id) {
      return reply.code(403).send({ error: 'Acesso negado' })
    }

    const historico = await fastify.prisma.historico_escolar.findMany({
      where: { aluno_id: id },
      include: { resultado_disciplina: true },
      orderBy: { ano_letivo: 'desc' }
    })

    return reply.send(historico)
  })
}

export default historicoRoutes
