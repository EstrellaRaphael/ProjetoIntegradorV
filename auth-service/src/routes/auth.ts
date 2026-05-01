import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'

interface LoginBody {
  email: string
  senha: string
}

interface RefreshBody {
  refreshToken?: string
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ── POST /v1/auth/login ────────────────────────────────────────────────────
  fastify.post<{ Body: LoginBody }>('/login', {
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
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m'
    })

    // O refresh token usa o namespace 'refreshJwt' (fastify.jwt.refreshJwt)
    const refreshToken = (fastify.jwt as any).refreshJwt.sign(
      { sub: usuario.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' }
    )

    return reply.send({ accessToken, refreshToken, role: usuario.role })
  })

  // ── POST /v1/auth/refresh ──────────────────────────────────────────────────
  fastify.post<{ Body: RefreshBody }>('/refresh', async (request, reply) => {
    const { refreshToken } = request.body ?? {}
    if (!refreshToken) {
      return reply.code(400).send({ error: 'refreshToken obrigatório' })
    }

    let decoded: { sub: string }
    try {
      decoded = (fastify.jwt as any).refreshJwt.verify(refreshToken) as { sub: string }
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
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m'
    })

    return reply.send({ accessToken: newAccessToken })
  })

  // ── GET /v1/auth/validate ──────────────────────────────────────────────────
  fastify.get('/validate', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    return reply.send({ valid: true, user: request.user })
  })
}

export default authRoutes
