import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { classesService, studentsService } from '../../services/api'
import type { Turma, Aluno } from '../../types'
import Modal from '../../components/ui/Modal'
import TabNav from '../../components/ui/TabNav'
import Field from '../../components/ui/Field'
import { formatDate } from '../../utils/formatters'

type Tab = 'dados' | 'alunos' | 'grade'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('dados')
  const [modalOpen, setModalOpen] = useState(false)
  const [alocarForm, setAlocarForm] = useState({ aluno_id: '', data_matricula: new Date().toISOString().split('T')[0] })

  const { data: turma, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesService.getById(id!).then((r) => r.data as Turma),
    enabled: !!id,
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => studentsService.list({ limit: 200 }).then((r) => r.data),
    enabled: modalOpen,
  })

  const { data: classStudentsData } = useQuery({
    queryKey: ['students', 'class', id],
    queryFn: () => studentsService.list({ turma_id: id, limit: 200 }).then((r) => r.data),
    enabled: !!id && tab === 'alunos',
  })

  const studentLookup: Record<string, Aluno> = {}
  const classStudents: Aluno[] = classStudentsData?.data ?? []
  classStudents.forEach((s) => { studentLookup[s.id] = s })

  const addStudentMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => classesService.addStudent(id!, d),
    onSuccess: () => {
      toast.success('Aluno alocado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['class', id] })
      queryClient.invalidateQueries({ queryKey: ['students', 'class', id] })
      setModalOpen(false)
      setAlocarForm({ aluno_id: '', data_matricula: new Date().toISOString().split('T')[0] })
    },
    onError: () => toast.error('Erro ao alocar aluno.'),
  })

  if (isLoading) return <div className="h-32 bg-surface-container animate-pulse rounded-xl" />
  if (!turma) return <div className="card-padded text-center text-on-surface-variant">Turma não encontrada.</div>

  const alocacoes = turma.alocacao_aluno ?? []
  const availableStudents: Aluno[] = studentsData?.data ?? []

  const turnos: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' }
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'alunos', label: `Alunos (${alocacoes.length})` },
    { key: 'grade', label: 'Grade' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-padded">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{turma.codigo}</h1>
            <p className="page-subtitle">{turma.ano_letivo} · {turnos[turma.turno]}</p>
          </div>
          <span className="badge badge-success">Ativa</span>
        </div>
      </div>

      {/* Tabs */}
      <TabNav tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'dados' && (
        <div className="card-padded">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Código" value={turma.codigo} />
            <Field label="Ano Letivo" value={turma.ano_letivo} />
            <Field label="Turno" value={turnos[turma.turno]} />
            <Field label="Total de Alunos" value={alocacoes.length} />
            <Field label="Calendário" value={turma.calendario_id ? 'Vinculado' : '—'} />
          </div>
        </div>
      )}

      {tab === 'alunos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Alocar Aluno
            </button>
          </div>
          <div className="table-wrap">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Aluno</th>
                    <th className="th">Matrícula</th>
                    <th className="th">Data de Matrícula</th>
                  </tr>
                </thead>
                <tbody>
                  {alocacoes.length === 0 ? (
                    <tr><td colSpan={3} className="td text-center text-on-surface-variant py-6">Nenhum aluno alocado.</td></tr>
                  ) : (
                    alocacoes.map((a) => (
                      <tr key={a.id} className="tr-row">
                        <td className="td">{studentLookup[a.aluno_id]?.nome_completo ?? a.aluno_id.slice(0, 8)}</td>
                        <td className="td text-on-surface-variant">{studentLookup[a.aluno_id]?.matricula ?? '—'}</td>
                        <td className="td text-on-surface-variant">{formatDate(a.data_matricula)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'grade' && (
        <div className="card-padded">
          <p className="text-sm text-on-surface-variant">Grade horária da turma em desenvolvimento.</p>
        </div>
      )}

      {/* Alocar aluno modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Alocar Aluno" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); addStudentMutation.mutate({ aluno_id: alocarForm.aluno_id, data_matricula: alocarForm.data_matricula }) }} className="space-y-4">
          <div>
            <label className="field-label">Aluno *</label>
            <select className="input-field" value={alocarForm.aluno_id} onChange={(e) => setAlocarForm((p) => ({ ...p, aluno_id: e.target.value }))} required>
              <option value="">Selecione um aluno…</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.nome_completo} — {s.matricula}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Data de Matrícula *</label>
            <input type="date" className="input-field" value={alocarForm.data_matricula} onChange={(e) => setAlocarForm((p) => ({ ...p, data_matricula: e.target.value }))} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={addStudentMutation.isPending}>{addStudentMutation.isPending ? 'Alocando…' : 'Alocar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
