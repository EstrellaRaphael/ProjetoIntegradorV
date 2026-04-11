'use strict'

module.exports = async (fastify) => {
  fastify.register(require('./turmas'), { prefix: '/classes' })
  fastify.register(require('./disciplinas'), { prefix: '/disciplines' })
  fastify.register(require('./calendario'), { prefix: '/calendar' })
}
