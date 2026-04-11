import { FastifyPluginAsync } from 'fastify'
import comunicadosRoutes from './comunicados'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(comunicadosRoutes, { prefix: '/communications' })
}

export default routes
