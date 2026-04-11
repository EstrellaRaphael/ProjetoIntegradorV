import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { FREQUENCIA_MINIMA_PERCENTUAL } from '../constants'

/**
 * Recalcula (ou cria) o registro de frequencia_consolidada para um aluno
 * em uma disciplina e bimestre específicos, com base nos registros individuais.
 *
 * Responsabilidade única: lógica de negócio de frequência (SRP / Clean Architecture).
 */
export async function recalcularFrequencia(
  prisma: PrismaClient,
  alunoId: string,
  disciplinaId: string,
  bimestre: number
): Promise<void> {
  const registros = await prisma.registro_frequencia.findMany({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre }
  })

  const totalAulas = registros.length
  const totalPresencas = registros.filter(r => r.presente).length
  const percentual =
    totalAulas > 0
      ? Number(((totalPresencas / totalAulas) * 100).toFixed(2))
      : 0
  const reprovadoPorFalta = percentual < FREQUENCIA_MINIMA_PERCENTUAL

  const existing = await prisma.frequencia_consolidada.findFirst({
    where: { aluno_id: alunoId, disciplina_id: disciplinaId, bimestre }
  })

  if (existing) {
    await prisma.frequencia_consolidada.update({
      where: { id: existing.id },
      data: {
        total_aulas: totalAulas,
        total_presencas: totalPresencas,
        percentual,
        reprovado_por_falta: reprovadoPorFalta
      }
    })
  } else {
    await prisma.frequencia_consolidada.create({
      data: {
        id: randomUUID(),
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        bimestre,
        total_aulas: totalAulas,
        total_presencas: totalPresencas,
        percentual,
        reprovado_por_falta: reprovadoPorFalta
      }
    })
  }
}
