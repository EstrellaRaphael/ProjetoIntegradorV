import { FastifyPluginAsync } from 'fastify'

// TODO: Aguardando script SQL e diagrama de classes do MS-05 (Otávio Brito)
// Implementar após receber: script_db_ms05.sql e diagrama_de_classes_ms05

const comunicadosRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (_request, reply) => {
    return reply.send({ message: 'MS-05 em desenvolvimento — aguardando definição do schema' })
  })
}

export default comunicadosRoutes
