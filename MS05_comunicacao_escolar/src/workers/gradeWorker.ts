/**
 * Grade Worker — MS-05
 *
 * Faz polling no MS-02 buscando eventos de alteração de grade não processados
 * (evento_grade WHERE processado = FALSE). Para cada evento:
 *   1. Cria um comunicado automático de alteração de horário
 *   2. Resolve os alunos da turma via MS-03
 *   3. Cria registros de destinatario_comunicado e notificacao_externa
 *
 * Padrão: Outbox Pattern simplificado (RF-39 / RF-13)
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const POLL_INTERVAL_MS = 30_000 // 30 segundos

// ── Tipos de resposta dos outros MSs ────────────────────────────────────────

interface GradeHoraria {
  turma_id: string
  disciplina_id: string
  professor_id: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
}

interface EventoGrade {
  id: string
  grade_horaria_id: string
  tipo: 'CRIACAO' | 'EDICAO' | 'SUBSTITUICAO'
  descricao: string
  processado: boolean
  publicado_em: string
  grade_horaria?: GradeHoraria
}

interface TurmaResponse {
  alocacao_aluno?: { aluno_id: string }[]
}

// ── Rastreamento local de eventos já processados ─────────────────────────────
// (reseta ao reiniciar o serviço — aceitável para o escopo do projeto)
const processedEventIds = new Set<string>()

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveAlunosDaTurma(turmaId: string): Promise<string[]> {
  const ms03Url = process.env.MS03_URL ?? 'http://localhost:3003'
  try {
    const res = await fetch(`${ms03Url}/v1/classes/${turmaId}`)
    if (!res.ok) return []
    const turma = await res.json() as TurmaResponse
    return (turma.alocacao_aluno ?? []).map((a) => a.aluno_id)
  } catch {
    return []
  }
}

function buildTituloEvento(tipo: EventoGrade['tipo']): string {
  switch (tipo) {
    case 'CRIACAO':      return 'Novo Horário Adicionado'
    case 'EDICAO':       return 'Horário Alterado'
    case 'SUBSTITUICAO': return 'Substituição de Professor'
  }
}

// ── Lógica principal de polling ──────────────────────────────────────────────

async function pollGradeEvents(prisma: PrismaClient): Promise<void> {
  const ms02Url = process.env.MS02_URL ?? 'http://localhost:3002'

  let eventos: EventoGrade[]
  try {
    const res = await fetch(`${ms02Url}/v1/teachers/schedule/changes/recent`)
    if (!res.ok) return
    eventos = await res.json() as EventoGrade[]
  } catch {
    // MS-02 indisponível — tentar na próxima rodada
    return
  }

  for (const evento of eventos) {
    if (processedEventIds.has(evento.id)) continue

    const titulo = buildTituloEvento(evento.tipo)
    const conteudo = evento.descricao ?? `Alteração na grade horária (${evento.tipo})`
    const turmaId = evento.grade_horaria?.turma_id
    const comunicadoId = crypto.randomUUID()

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Comunicado automático
        await tx.comunicado.create({
          data: {
            id: comunicadoId,
            remetente_id: 'sistema',
            titulo,
            conteudo,
            publico_alvo: turmaId ? 'TURMA_ESPECIFICA' : 'GERAL'
          }
        })

        // 2. Resolve alunos da turma e cria destinatários + notificações
        if (turmaId) {
          const alunoIds = await resolveAlunosDaTurma(turmaId)

          if (alunoIds.length > 0) {
            await tx.destinatario_comunicado.createMany({
              data: alunoIds.map((uid) => ({
                id: crypto.randomUUID(),
                comunicado_id: comunicadoId,
                usuario_id: uid,
                lido: false
              })),
              skipDuplicates: true
            })

            await tx.notificacao_externa.createMany({
              data: alunoIds.map((uid) => ({
                id: crypto.randomUUID(),
                usuario_id: uid,
                mensagem: `${titulo}: ${conteudo}`,
                canal: 'EMAIL',
                status: 'PENDENTE',
                tentativas: 0
              }))
            })
          }
        }
      })

      processedEventIds.add(evento.id)
      console.log(`[gradeWorker] Evento ${evento.id} (${evento.tipo}) processado → comunicado ${comunicadoId}`)
    } catch (err) {
      console.error(`[gradeWorker] Erro ao processar evento ${evento.id}:`, err)
    }
  }
}

// ── Inicialização ─────────────────────────────────────────────────────────────

export function startGradeWorker(prisma: PrismaClient): void {
  console.log('[gradeWorker] Iniciado — polling MS-02 a cada 30s')
  // Executa imediatamente ao iniciar e depois a cada intervalo
  void pollGradeEvents(prisma)
  setInterval(() => { void pollGradeEvents(prisma) }, POLL_INTERVAL_MS)
}
