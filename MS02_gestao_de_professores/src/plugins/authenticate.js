'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.decorate('requireRole', (roles) => async (request, reply) => {
    try {
      await request.jwtVerify()
      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Permissão insuficiente' })
      }
    } catch (err) {
      reply.send(err)
    }
  })
})
