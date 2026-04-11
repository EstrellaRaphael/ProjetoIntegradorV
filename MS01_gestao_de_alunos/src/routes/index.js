'use strict'

module.exports = async (fastify) => {
  fastify.register(require('./alunos'), { prefix: '/students' })
  fastify.register(require('./frequencias'), { prefix: '/students' })
  fastify.register(require('./historico'), { prefix: '/students' })
}
