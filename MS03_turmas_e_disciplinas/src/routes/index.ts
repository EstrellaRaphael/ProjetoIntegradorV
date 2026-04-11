import { FastifyPluginAsync } from 'fastify'
import turmasRoutes from './turmas'
import disciplinasRoutes from './disciplinas'
import calendarioRoutes from './calendario'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(turmasRoutes, { prefix: '/classes' })
  fastify.register(disciplinasRoutes, { prefix: '/disciplines' })
  fastify.register(calendarioRoutes, { prefix: '/calendar' })
}

export default routes
