'use strict'

const bcrypt = require('bcryptjs')

module.exports = async (fastify) => {
  // POST /auth/login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, senha } = request.body

    const usuario = await fastify.prisma.usuario.findUnique({
      where: { email },
      include: {
        aluno: { select: { id: true, turma_atual_id: true, status: true } }
      }
    })

    if (!usuario || !usuario.ativo) {
      return reply.code(401).send({ error: 'Credenciais inválidas' })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaValida) {
      return reply.code(401).send({ error: 'Credenciais inválidas' })
    }

    const payload = {
      sub: usuario.id,
      role: usuario.role,
      referenciaId: usuario.referencia_id,
      turmaId: usuario.aluno?.turma_atual_id ?? null
    }

    const accessToken = fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    })

    const refreshToken = fastify.refreshJwt.sign(
      { sub: usuario.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    )

    return reply.send({ accessToken, refreshToken, role: usuario.role })
  })

  // POST /auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body ?? {}
    if (!refreshToken) {
      return reply.code(400).send({ error: 'refreshToken obrigatório' })
    }

    let decoded
    try {
      decoded = fastify.refreshJwt.verify(refreshToken)
    } catch {
      return reply.code(401).send({ error: 'Refresh token inválido ou expirado' })
    }

    const usuario = await fastify.prisma.usuario.findUnique({
      where: { id: decoded.sub },
      include: {
        aluno: { select: { turma_atual_id: true } }
      }
    })

    if (!usuario || !usuario.ativo) {
      return reply.code(401).send({ error: 'Usuário inativo ou não encontrado' })
    }

    const payload = {
      sub: usuario.id,
      role: usuario.role,
      referenciaId: usuario.referencia_id,
      turmaId: usuario.aluno?.turma_atual_id ?? null
    }

    const newAccessToken = fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    })

    return reply.send({ accessToken: newAccessToken })
  })

  // GET /auth/validate  — usado pelos outros MSs e pelo API Gateway
  fastify.get('/validate', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    return reply.send({ valid: true, user: request.user })
  })
}
