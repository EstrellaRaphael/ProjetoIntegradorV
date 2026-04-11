import { FastifyPluginAsync } from 'fastify'
import professoresRoutes from './professores'
import gradeRoutes from './grade'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(professoresRoutes, { prefix: '/teachers' })
  fastify.register(gradeRoutes, { prefix: '/teachers' })
}

export default routes
