'use strict'

module.exports = async (fastify) => {
  fastify.register(require('./professores'), { prefix: '/teachers' })
  fastify.register(require('./grade'), { prefix: '/teachers' })
}
