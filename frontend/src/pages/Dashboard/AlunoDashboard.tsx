import { useQuery } from '@tanstack/react-query'
import { studentsService, gradesService, communicationsService, assessmentsService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Comunicado, Avaliacao, MediaBimestral } from '../../types'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('pt-BR')
}

function avgBadge(avg: number | undefined) {
  if (avg === undefined) return <span className="badge badge-neutral">—</span>
  if (avg >= 7) return <span className="badge badge-success">{avg.toFixed(1).replace('.', ',')}</span>
  if (avg >= 5) return <span className="badge badge-warning">{avg.toFixed(1).replace('.', ',')}</span>
  return <span className="badge badge-danger">{avg.toFixed(1).replace('.', ',')}</span>
}

function StatusIcon({ value }: { value: number }) {
  if (value >= 7)
    return (
      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  if (value >= 5)
    return (
      <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    )
  return (
    <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function AlunoDashboard() {
  const { user } = useAuthStore()
  const alunoId = user?.referenciaId ?? ''

  const { data: profileData } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: () => studentsService.me().then((r) => r.data),
    enabled: !!alunoId,
  })

  const { data: boletimData } = useQuery({
    queryKey: ['boletim', alunoId],
    queryFn: () => gradesService.boletim(alunoId).then((r) => r.data),
    enabled: !!alunoId,
  })

  const { data: commsData } = useQuery({
    queryKey: ['communications', 'recent'],
    queryFn: () => communicationsService.recent().then((r) => r.data),
  })

  const { data: assessmentsData } = useQuery({
    queryKey: ['assessments', 'upcoming'],
    queryFn: () => assessmentsService.list().then((r) => r.data),
  })

  const medias: MediaBimestral[] = boletimData?.medias_bimestrais ?? []
  const comms: Comunicado[] = Array.isArray(commsData) ? commsData.slice(0, 2) : []
  const assessments: Avaliacao[] = Array.isArray(assessmentsData)
    ? assessmentsData.slice(0, 4)
    : assessmentsData?.data?.slice(0, 4) ?? []

  const nome = profileData?.nome_completo ?? user?.sub ?? 'Aluno'
  const turma = profileData?.turma_atual_id ? `Turma ${profileData.turma_atual_id.slice(0, 8)}` : 'Sem turma'

  // Group medias by disciplina
  const byDisciplina = medias.reduce((acc: Record<string, MediaBimestral[]>, m) => {
    if (!acc[m.disciplina_id]) acc[m.disciplina_id] = []
    acc[m.disciplina_id].push(m)
    return acc
  }, {})
  const disciplinas = Object.entries(byDisciplina).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="card-padded flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">
            {nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="page-title">Olá, {nome.split(' ')[0]}!</h1>
          <p className="page-subtitle">{turma} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boletim resumo */}
        <div className="lg:col-span-2 table-wrap">
          <div className="px-4 py-3 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Meu Boletim (resumo)</h3>
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
                  <th className="th text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {disciplinas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="td text-center text-on-surface-variant py-6">
                      Sem notas lançadas.
                    </td>
                  </tr>
                ) : (
                  disciplinas.map(([discId, bims]) => {
                    const getB = (b: number) => bims.find((m) => m.bimestre === b)
                    const avg = bims.reduce((s, m) => s + m.valor_calculado, 0) / (bims.length || 1)
                    return (
                      <tr key={discId} className="tr-row">
                        <td className="td font-medium">{discId.slice(0, 8)}…</td>
                        <td className="td text-center">{avgBadge(getB(1)?.valor_calculado)}</td>
                        <td className="td text-center">{avgBadge(getB(2)?.valor_calculado)}</td>
                        <td className="td text-center">{avgBadge(getB(3)?.valor_calculado)}</td>
                        <td className="td text-center">{avgBadge(getB(4)?.valor_calculado)}</td>
                        <td className="td text-center">
                          <div className="flex justify-center">
                            <StatusIcon value={avg} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Comunicados recentes */}
          <div className="card-padded">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Comunicados Recentes</h3>
            {comms.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhum comunicado.</p>
            ) : (
              <div className="space-y-2">
                {comms.map((c) => {
                  const isUnread = c.destinatario_comunicado?.some((d) => !d.lido)
                  return (
                    <div key={c.id} className="flex items-start gap-2">
                      {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      {!isUnread && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                      <div>
                        <p className={`text-sm ${isUnread ? 'font-semibold' : ''} text-on-surface`}>{c.titulo}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(c.data_envio)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Próximas avaliações */}
          <div className="card-padded">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Próximas Avaliações</h3>
            {assessments.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Sem avaliações próximas.</p>
            ) : (
              <div className="space-y-2">
                {assessments.map((a) => (
                  <div key={a.id} className="p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-[10px] ${
                        a.tipo === 'PROVA' ? 'badge-primary' :
                        a.tipo === 'TRABALHO' ? 'badge-secondary' :
                        a.tipo === 'RECUPERACAO' ? 'badge-warning' :
                        'badge-danger'
                      }`}>{a.tipo}</span>
                      <span className="text-xs text-on-surface-variant">{a.bimestre}º BIM</span>
                    </div>
                    <p className="text-sm font-medium text-on-surface">{a.titulo}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(a.data_aplicacao)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
