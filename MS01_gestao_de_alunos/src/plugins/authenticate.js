'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  // Verifica JWT e injeta request.user
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Verifica JWT e exige um dos roles fornecidos
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
