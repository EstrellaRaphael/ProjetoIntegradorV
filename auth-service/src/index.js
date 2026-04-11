'use strict'

require('dotenv').config()
const fastify = require('fastify')({ logger: true })

fastify.register(require('@fastify/cors'), { origin: true })

// JWT principal (access token — 15 min)
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
  namespace: 'jwt'
})

// JWT de refresh (7 dias) — namespace separado para não misturar segredos
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_REFRESH_SECRET,
  namespace: 'refreshJwt'
})

fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.register(require('./plugins/prisma'))

fastify.register(require('./routes/auth'), { prefix: '/v1/auth' })

fastify.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
