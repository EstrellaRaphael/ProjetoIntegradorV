import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  studentsService,
  teachersService,
  classesService,
  communicationsService,
  gradesService,
} from '../../services/api'
import type { Nota } from '../../types'

function formatDate(str: string) {
  const d = new Date(str)
  return d.toLocaleDateString('pt-BR')
}

function gradeColor(value: string | number) {
  const v = Number(value)
  if (v >= 7) return 'badge badge-success'
  if (v >= 5) return 'badge badge-warning'
  return 'badge badge-danger'
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: studentsCount } = useQuery({
    queryKey: ['students', 'count'],
    queryFn: () => studentsService.count().then((r) => r.data?.total ?? 0),
  })

  const { data: teachersCount } = useQuery({
    queryKey: ['teachers', 'count'],
    queryFn: () => teachersService.count().then((r) => r.data?.total ?? 0),
  })

  const { data: classesCount } = useQuery({
    queryKey: ['classes', 'active-count'],
    queryFn: () => classesService.activeCount().then((r) => r.data?.total ?? 0),
  })

  const { data: unreadComms } = useQuery({
    queryKey: ['communications', 'unread'],
    queryFn: () => communicationsService.unread().then((r) => r.data),
  })

  const { data: recentGrades } = useQuery({
    queryKey: ['grades', 'recent'],
    queryFn: () => gradesService.recent().then((r) => r.data),
  })

  const unreadCount =
    Array.isArray(unreadComms)
      ? unreadComms.length
      : typeof unreadComms?.count === 'number'
      ? unreadComms.count
      : 0

  const grades: Nota[] = Array.isArray(recentGrades) ? recentGrades.slice(0, 8) : []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do sistema escolar</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total de Alunos"
          value={studentsCount ?? '—'}
          color="bg-primary-fixed"
          icon={
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total de Professores"
          value={teachersCount ?? '—'}
          color="bg-secondary-container"
          icon={
            <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443" />
            </svg>
          }
        />
        <StatCard
          label="Turmas Ativas"
          value={classesCount ?? '—'}
          color="bg-success-container"
          icon={
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
        />
        <StatCard
          label="Comunicados Não Lidos"
          value={unreadCount ?? '—'}
          color="bg-warning-container"
          icon={
            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notas recentes */}
        <div className="lg:col-span-2 table-wrap">
          <div className="px-4 py-3 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Notas Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Avaliação</th>
                  <th className="th">Tipo</th>
                  <th className="th text-center">BIM</th>
                  <th className="th text-center">Nota</th>
                  <th className="th">Data</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="td text-center text-on-surface-variant py-6">
                      Nenhuma nota recente encontrada.
                    </td>
                  </tr>
                ) : (
                  grades.map((g) => (
                    <tr key={g.id} className="tr-row">
                      <td className="td font-medium">{g.avaliacao?.titulo ?? g.avaliacao_id.slice(0, 8) + '…'}</td>
                      <td className="td">
                        <span className={`badge text-[10px] ${
                          g.avaliacao?.tipo === 'PROVA' ? 'badge-primary' :
                          g.avaliacao?.tipo === 'TRABALHO' ? 'badge-secondary' :
                          g.avaliacao?.tipo === 'RECUPERACAO' ? 'badge-warning' :
                          'badge-neutral'
                        }`}>
                          {g.avaliacao?.tipo ?? '—'}
                        </span>
                      </td>
                      <td className="td text-center text-on-surface-variant">{g.avaliacao?.bimestre ?? '—'}º</td>
                      <td className="td text-center">
                        <span className={gradeColor(g.valor)}>
                          {Number(g.valor).toFixed(1).replace('.', ',')}
                        </span>
                      </td>
                      <td className="td text-on-surface-variant">{formatDate(g.lancada_em)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="space-y-4">
          <div className="card-padded">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <button className="btn-primary w-full justify-start" onClick={() => navigate('/students/new')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Matricular Aluno
              </button>
              <button className="btn-secondary w-full justify-start" onClick={() => navigate('/assessments')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nova Avaliação
              </button>
              <button className="btn-secondary w-full justify-start" onClick={() => navigate('/communications')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Novo Comunicado
              </button>
              <button className="btn-secondary w-full justify-start" onClick={() => navigate('/grades')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Lançar Notas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
