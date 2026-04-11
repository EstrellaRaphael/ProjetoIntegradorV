'use strict'

require('dotenv').config()
const fastify = require('fastify')({ logger: true })

fastify.register(require('@fastify/cors'), { origin: true })
fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET })
fastify.register(require('./plugins/prisma'))
fastify.register(require('./plugins/authenticate'))
fastify.register(require('./routes'), { prefix: '/v1' })

fastify.get('/health', async () => ({ status: 'ok', service: 'ms02-gestao-de-professores' }))

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3002, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
