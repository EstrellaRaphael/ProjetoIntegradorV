import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '../types'

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
  /** Verifica JWT e injeta request.user */
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  /** Verifica JWT e exige um dos roles fornecidos */
  fastify.decorate(
    'requireRole',
    (roles: Role[]) => async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
        if (!roles.includes(request.user.role)) {
          return reply.code(403).send({ error: 'Permissão insuficiente' })
        }
      } catch (err) {
        reply.send(err)
      }
    }
  )
}

export default fp(authenticatePlugin)
