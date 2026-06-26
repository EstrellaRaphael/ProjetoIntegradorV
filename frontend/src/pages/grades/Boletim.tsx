import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gradesService, studentsService, classesService, disciplinesService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../utils/formatters'
import GradeBadge from '../../components/ui/GradeBadge'
import type { Aluno, MediaBimestral, ProvaFinal, FrequenciaConsolidada } from '../../types'

export default function BoletimPage() {
  const { alunoId } = useParams<{ alunoId?: string }>()
  const { user } = useAuthStore()

  const targetId = alunoId ?? user?.referenciaId ?? ''

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', targetId],
    queryFn: () =>
      user?.role === 'ALUNO'
        ? studentsService.me().then((r) => r.data as Aluno)
        : studentsService.getById(targetId).then((r) => r.data as Aluno),
    enabled: !!targetId,
  })

  const { data: boletimData, isLoading: boletimLoading } = useQuery({
    queryKey: ['boletim', targetId],
    queryFn: () => gradesService.boletim(targetId).then((r) => r.data),
    enabled: !!targetId,
  })

  const { data: frequenciaData } = useQuery({
    queryKey: ['student-frequency', targetId],
    queryFn: () => studentsService.frequency(targetId).then((r) => r.data),
    enabled: !!targetId,
  })

  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const medias: MediaBimestral[] = boletimData?.medias_bimestrais ?? []
  const provasFinais: ProvaFinal[] = boletimData?.provas_final ?? []
  const student: Aluno | undefined = studentData ?? boletimData?.aluno

  const { data: turmaData } = useQuery({
    queryKey: ['class', student?.turma_atual_id],
    queryFn: () => classesService.getById(student!.turma_atual_id!).then((r) => r.data),
    enabled: !!student?.turma_atual_id,
  })

  const disciplineNames: Record<string, string> = useMemo(() => {
    const list = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
    const map: Record<string, string> = {}
    list.forEach((d: { id: string; nome: string }) => { map[d.id] = d.nome })
    return map
  }, [disciplinasData])
  const frequencias: FrequenciaConsolidada[] = Array.isArray(frequenciaData) ? frequenciaData : frequenciaData?.data ?? []

  // Group by disciplina_id
  const disciplinaIds = [...new Set(medias.map((m) => m.disciplina_id))]

  const byDisc: Record<string, MediaBimestral[]> = {}
  medias.forEach((m) => {
    if (!byDisc[m.disciplina_id]) byDisc[m.disciplina_id] = []
    byDisc[m.disciplina_id].push(m)
  })

  // Group frequency by disciplina
  const freqByDisc: Record<string, FrequenciaConsolidada[]> = {}
  frequencias.forEach((f) => {
    if (!freqByDisc[f.disciplina_id]) freqByDisc[f.disciplina_id] = []
    freqByDisc[f.disciplina_id].push(f)
  })

  if (studentLoading || boletimLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-card" />
        <div className="skeleton-block" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-info">
          <div className="avatar-lg avatar-primary">
            <span className="avatar-initials-lg">
              {getInitials(student?.nome_completo ?? 'A')}
            </span>
          </div>
          <div>
            <h1 className="page-title">{student?.nome_completo ?? 'Aluno'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {student?.matricula && <span className="badge badge-neutral font-mono">{student.matricula}</span>}
              {student?.turma_atual_id && <span className="badge badge-primary">Turma {turmaData?.codigo ?? 'Turma'}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Boletim table */}
      <div className="table-wrap">
        <div className="px-4 py-3 border-b border-outline-variant/30">
          <h3 className="text-sm font-semibold text-on-surface">Boletim de Notas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Disciplina</th>
                <th className="th text-center">1º BIM</th>
                <th className="th text-center">2º BIM</th>
                <th className="th text-center">3º BIM</th>
                <th className="th text-center">4º BIM</th>
                <th className="th text-center">Rec.</th>
                <th className="th text-center">Média</th>
                <th className="th text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {disciplinaIds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="td text-center text-on-surface-variant py-8">
                    Nenhuma nota disponível.
                  </td>
                </tr>
              ) : (
                disciplinaIds.map((discId) => {
                  const bims = byDisc[discId] ?? []
                  const getB = (b: number) => bims.find((m) => m.bimestre === b)
                  const recBim = bims.find((m) => m.recuperacao_aplicada)
                  const regularBims = bims.filter((m) => !m.recuperacao_aplicada)
                  const avg = regularBims.length > 0
                    ? regularBims.reduce((s, m) => s + Number(m.valor_calculado), 0) / regularBims.length
                    : 0

                  const pf = provasFinais.find((p) => p.disciplina_id === discId)
                  const statusLabel =
                    pf?.status === 'APROVADO_PF' ? 'Aprovado(PF)' :
                    pf?.status === 'REPROVADO_NOTA' ? 'Reprovado' :
                    avg >= 7 ? 'Aprovado' :
                    avg >= 5 ? 'Rec.' :
                    regularBims.length === 0 ? 'Em curso' :
                    'Reprovado'
                  const statusBadge =
                    statusLabel === 'Aprovado' || statusLabel === 'Aprovado(PF)' ? 'badge badge-success' :
                    statusLabel === 'Rec.' ? 'badge badge-warning' :
                    statusLabel === 'Em curso' ? 'badge badge-neutral' :
                    'badge badge-danger'

                  return (
                    <tr key={discId} className="tr-row">
                      <td className="td font-medium">{disciplineNames[discId] ?? 'Disciplina'}</td>
                      <td className="td text-center"><GradeBadge value={getB(1)?.valor_calculado} /></td>
                      <td className="td text-center"><GradeBadge value={getB(2)?.valor_calculado} /></td>
                      <td className="td text-center"><GradeBadge value={getB(3)?.valor_calculado} /></td>
                      <td className="td text-center"><GradeBadge value={getB(4)?.valor_calculado} /></td>
                      <td className="td text-center"><GradeBadge value={recBim?.valor_calculado} /></td>
                      <td className="td text-center"><GradeBadge value={regularBims.length > 0 ? avg : undefined} /></td>
                      <td className="td text-center">
                        <span className={statusBadge}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequência */}
      {frequencias.length > 0 && (
        <div className="table-wrap">
          <div className="px-4 py-3 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Frequência</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Disciplina</th>
                  <th className="th text-center">Bimestre</th>
                  <th className="th text-center">Total Aulas</th>
                  <th className="th text-center">Presenças</th>
                  <th className="th text-center">Faltas</th>
                  <th className="th text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {frequencias.map((f) => (
                  <tr key={f.id} className="tr-row">
                    <td className="td font-medium">{disciplineNames[f.disciplina_id] ?? 'Disciplina'}</td>
                    <td className="td text-center">{f.bimestre}º BIM</td>
                    <td className="td text-center">{f.total_aulas}</td>
                    <td className="td text-center text-success">{f.total_presencas}</td>
                    <td className="td text-center text-error">{f.total_aulas - f.total_presencas}</td>
                    <td className="td text-center">
                      <span className={`badge ${Number(f.percentual) >= 75 ? 'badge-success' : 'badge-danger'}`}>
                        {Number(f.percentual).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prova Final */}
      {provasFinais.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-on-surface mb-3">Prova Final</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {provasFinais.map((pf) => (
              <div key={pf.id} className="card-padded space-y-2">
                <p className="text-xs text-on-surface-variant">Disciplina: {disciplineNames[pf.disciplina_id] ?? 'Disciplina'}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Média Anual</span>
                  <span className="font-semibold">{Number(pf.media_anual).toFixed(1).replace('.', ',')}</span>
                </div>
                {pf.nota_prova_final !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Nota PF</span>
                    <span className="font-semibold">{Number(pf.nota_prova_final).toFixed(1).replace('.', ',')}</span>
                  </div>
                )}
                {pf.media_final !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Média Final</span>
                    <span className="font-bold">{Number(pf.media_final).toFixed(1).replace('.', ',')}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className={`badge ${
                    pf.status === 'APROVADO_PF' ? 'badge-success' :
                    pf.status === 'REPROVADO_NOTA' ? 'badge-danger' :
                    'badge-warning'
                  }`}>
                    {pf.status === 'APROVADO_PF' ? 'Aprovado' :
                     pf.status === 'REPROVADO_NOTA' ? 'Reprovado' :
                     'Em Curso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
