import { FastifyPluginAsync } from 'fastify'
import alunosRoutes from './alunos'
import frequenciasRoutes from './frequencias'
import historicoRoutes from './historico'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(alunosRoutes, { prefix: '/students' })
  fastify.register(frequenciasRoutes, { prefix: '/students' })
  fastify.register(historicoRoutes, { prefix: '/students' })
}

export default routes
