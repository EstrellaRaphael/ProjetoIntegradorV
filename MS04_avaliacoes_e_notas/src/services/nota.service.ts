import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'

/**
 * Recalcula (ou cria) a media_bimestral de um aluno para uma disciplina,
 * bimestre e ano letivo específicos, excluindo avaliações do tipo RECUPERACAO.
 *
 * Usa filtragem via Prisma (query eficiente) em vez de buscar todas as notas
 * do aluno e filtrar em memória.
 *
 * Responsabilidade única: lógica de negócio de notas/médias (SRP / Clean Architecture).
 */
export async function recalcularMedia(
  prisma: PrismaClient,
  alunoId: string,
  disciplinaId: string,
  bimestre: number,
  anoLetivo: number
): Promise<void> {
  // Query eficiente: filtragem feita no banco, não em memória
  const notas = await prisma.nota.findMany({
    where: {
      aluno_id: alunoId,
      substituida: false,
      avaliacao: {
        disciplina_id: disciplinaId,
        bimestre,
        ano_letivo: anoLetivo,
        tipo: { not: 'RECUPERACAO' }
      }
    },
    include: { avaliacao: true }
  })

  if (notas.length === 0) return

  const soma = notas.reduce((acc, n) => acc + Number(n.valor), 0)
  const valorCalculado = Number((soma / notas.length).toFixed(2))

  const existing = await prisma.media_bimestral.findFirst({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre, ano_letivo: anoLetivo }
  })

  if (existing) {
    await prisma.media_bimestral.update({
      where: { id: existing.id },
      data: { valor_calculado: valorCalculado }
    })
  } else {
    await prisma.media_bimestral.create({
      data: {
        id: randomUUID(),
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        bimestre,
        ano_letivo: anoLetivo,
        valor_calculado: valorCalculado
      }
    })
  }
}
