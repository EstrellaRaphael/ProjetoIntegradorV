import { FastifyPluginAsync } from 'fastify'
import comunicadosRoutes from './comunicados'
import notificacoesRoutes from './notificacoes'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(comunicadosRoutes, { prefix: '/communications' })
  fastify.register(notificacoesRoutes, { prefix: '/notifications' })
}

export default routes
