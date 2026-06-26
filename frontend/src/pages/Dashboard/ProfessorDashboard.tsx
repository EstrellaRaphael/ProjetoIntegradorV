import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teachersService, communicationsService, assessmentsService, classesService, disciplinesService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../utils/formatters'
import type { GradeHoraria, Comunicado, Avaliacao, Turma, Disciplina } from '../../types'

const DAYS_PT: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
}

function todayDayName(): string {
  const days = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
  return days[new Date().getDay()]
}

export default function ProfessorDashboard() {
  const { user } = useAuthStore()
  const professorId = user?.referenciaId ?? ''

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['teacher-schedule', professorId],
    queryFn: () => teachersService.schedule(professorId).then((r) => r.data),
    enabled: !!professorId,
  })

  const { data: commsData } = useQuery({
    queryKey: ['communications', 'recent'],
    queryFn: () => communicationsService.recent().then((r) => r.data),
  })

  const { data: assessmentsData } = useQuery({
    queryKey: ['assessments', { professorId }],
    queryFn: () =>
      assessmentsService.list({ professor_id: professorId }).then((r) => r.data),
    enabled: !!professorId,
  })

  const { data: turmasData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesService.list({ limit: 200 }).then((r) => r.data),
  })

  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const turmaNames = useMemo(() => {
    const list: Turma[] = Array.isArray(turmasData) ? turmasData : turmasData?.data ?? []
    return list.reduce<Record<string, string>>((acc, t) => { acc[t.id] = t.codigo; return acc }, {})
  }, [turmasData])

  const disciplinaNames = useMemo(() => {
    const list: Disciplina[] = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
    return list.reduce<Record<string, string>>((acc, d) => { acc[d.id] = d.nome; return acc }, {})
  }, [disciplinasData])

  const today = todayDayName()
  const allSchedule: GradeHoraria[] = Array.isArray(scheduleData) ? scheduleData : scheduleData?.data ?? []
  const todaySchedule = allSchedule.filter((s) => s.dia_semana === today)
  const comms: Comunicado[] = Array.isArray(commsData) ? commsData.slice(0, 5) : []
  const assessments: Avaliacao[] = Array.isArray(assessmentsData)
    ? assessmentsData
    : assessmentsData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bem-vindo, Professor!</h1>
          <p className="page-subtitle">Confira sua agenda e lançamentos do dia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários de hoje */}
        <div className="card-padded">
          <h3 className="section-title">
            Horários de Hoje — {DAYS_PT[today] ?? today}
          </h3>
          {scheduleLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container animate-pulse rounded-lg" />
              ))}
            </div>
          ) : todaySchedule.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">
              Nenhuma aula para hoje.
            </p>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      Turma: {turmaNames[s.turma_id] ?? s.turma_id.slice(0, 8) + '…'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Disciplina: {disciplinaNames[s.disciplina_id] ?? s.disciplina_id.slice(0, 8) + '…'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{s.horario_inicio}</p>
                    <p className="text-xs text-on-surface-variant">{s.horario_fim}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comunicados */}
        <div className="card-padded">
          <h3 className="section-title">Comunicados Recentes</h3>
          {comms.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">Sem comunicados.</p>
          ) : (
            <div className="space-y-3">
              {comms.map((c) => {
                const isUnread = c.destinatario_comunicado.some((d) => !d.lido)
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    {isUnread && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    {!isUnread && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                    <div>
                      <p className={`text-sm ${isUnread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                        {c.titulo}
                      </p>
                      <p className="text-xs text-on-surface-variant">{formatDate(c.data_envio)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lançamentos pendentes */}
      <div className="table-wrap">
        <div className="px-4 py-3 border-b border-outline-variant/30">
          <h3 className="text-sm font-semibold text-on-surface">Avaliações — Lançamentos Pendentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Título</th>
                <th className="th">Tipo</th>
                <th className="th">Bimestre</th>
                <th className="th">Data</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td text-center text-on-surface-variant py-6">
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                assessments.slice(0, 10).map((a) => (
                  <tr key={a.id} className="tr-row">
                    <td className="td font-medium">{a.titulo}</td>
                    <td className="td">
                      <span className="badge badge-secondary">{a.tipo}</span>
                    </td>
                    <td className="td">{a.bimestre}º BIM</td>
                    <td className="td text-on-surface-variant">{formatDate(a.data_aplicacao)}</td>
                    <td className="td">
                      <span className="badge badge-warning">Pendente</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
