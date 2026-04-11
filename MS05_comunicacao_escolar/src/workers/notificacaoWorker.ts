/**
 * Notificação Worker — MS-05
 *
 * Processa a fila de notificações externas (tabela notificacao_externa).
 * Implementa retry com backoff exponencial (RF-40):
 *   - Máx. 3 tentativas
 *   - 1ª retry: 1 min · 2ª retry: 5 min · 3ª retry: 15 min
 *   - Após 3 falhas: status = 'FALHA'
 *
 * TODO: substituir sendEmail/sendWhatsApp por implementações reais quando
 *       as credenciais SMTP e/ou WhatsApp estiverem disponíveis.
 */

import { PrismaClient } from '@prisma/client'

const POLL_INTERVAL_MS = 30_000 // 30 segundos

// Delay mínimo (em ms) antes de cada retry, indexado por (tentativas - 1)
const BACKOFF_MS = [
  60_000,   // 1ª retry: 1 min
  300_000,  // 2ª retry: 5 min
  900_000   // 3ª retry: 15 min
]

// Rastreia o timestamp da última falha por notificação (em memória)
// Chave: notificacao.id → timestamp da última tentativa falhada
const lastAttemptAt = new Map<string, number>()

// ── Funções de envio (substituir por implementações reais) ───────────────────

async function sendEmail(usuarioId: string, mensagem: string): Promise<void> {
  /**
   * TODO: implementar com Nodemailer quando SMTP_HOST estiver configurado.
   *
   * Exemplo de implementação futura:
   *   const transporter = nodemailer.createTransport({
   *     host: process.env.SMTP_HOST,
   *     port: Number(process.env.SMTP_PORT ?? 587),
   *     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
   *   })
   *   await transporter.sendMail({ to: email, subject: '...', text: mensagem })
   */
  console.log(`[notificacaoWorker] [EMAIL MOCK] → usuário ${usuarioId}: ${mensagem}`)
  // Simula sucesso — remover este log e implementar acima em produção
}

async function sendWhatsApp(usuarioId: string, mensagem: string): Promise<void> {
  /**
   * TODO: implementar com Twilio ou API não-oficial quando token estiver disponível.
   *
   * Exemplo com Twilio:
   *   await twilioClient.messages.create({
   *     body: mensagem,
   *     from: 'whatsapp:+14155238886',
   *     to: `whatsapp:${telefone}`
   *   })
   */
  console.log(`[notificacaoWorker] [WHATSAPP MOCK] → usuário ${usuarioId}: ${mensagem}`)
}

// ── Lógica de processamento ──────────────────────────────────────────────────

async function processNotifications(prisma: PrismaClient): Promise<void> {
  const now = Date.now()

  const pendentes = await prisma.notificacao_externa.findMany({
    where: { status: 'PENDENTE' },
    take: 50,
    orderBy: { data_criacao: 'asc' }
  })

  for (const notif of pendentes) {
    // Verifica backoff: se já houve tentativas, aguarda o delay correspondente
    if (notif.tentativas > 0) {
      const backoffMs = BACKOFF_MS[notif.tentativas - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1]
      const lastAttempt = lastAttemptAt.get(notif.id) ?? 0
      if (now - lastAttempt < backoffMs) continue
    }

    try {
      if (notif.canal === 'EMAIL') {
        await sendEmail(notif.usuario_id, notif.mensagem)
      } else if (notif.canal === 'WHATSAPP') {
        await sendWhatsApp(notif.usuario_id, notif.mensagem)
      }

      // Sucesso: atualiza status
      await prisma.notificacao_externa.update({
        where: { id: notif.id },
        data: { status: 'ENVIADO' }
      })

      lastAttemptAt.delete(notif.id)
      console.log(`[notificacaoWorker] Notificação ${notif.id} enviada via ${notif.canal}`)

    } catch (err) {
      const novasTentativas = notif.tentativas + 1
      lastAttemptAt.set(notif.id, now)

      const novoStatus = novasTentativas >= 3 ? 'FALHA' : 'PENDENTE'

      await prisma.notificacao_externa.update({
        where: { id: notif.id },
        data: {
          tentativas: novasTentativas,
          status: novoStatus
        }
      })

      if (novoStatus === 'FALHA') {
        console.error(
          `[notificacaoWorker] Notificação ${notif.id} marcada como FALHA após ${novasTentativas} tentativas`
        )
      } else {
        console.warn(
          `[notificacaoWorker] Notificação ${notif.id} falhou (tentativa ${novasTentativas}/3) — retry com backoff`,
          err
        )
      }
    }
  }
}

// ── Inicialização ─────────────────────────────────────────────────────────────

export function startNotificacaoWorker(prisma: PrismaClient): void {
  console.log('[notificacaoWorker] Iniciado — processando fila a cada 30s')
  void processNotifications(prisma)
  setInterval(() => { void processNotifications(prisma) }, POLL_INTERVAL_MS)
}
