'use strict'

module.exports = async (fastify) => {
  fastify.register(require('./avaliacoes'), { prefix: '/assessments' })
  fastify.register(require('./notas'), { prefix: '/grades' })
}
