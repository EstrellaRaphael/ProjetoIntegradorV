import { FastifyPluginAsync } from 'fastify'
import avaliacoesRoutes from './avaliacoes'
import notasRoutes from './notas'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(avaliacoesRoutes, { prefix: '/assessments' })
  fastify.register(notasRoutes, { prefix: '/grades' })
}

export default routes
