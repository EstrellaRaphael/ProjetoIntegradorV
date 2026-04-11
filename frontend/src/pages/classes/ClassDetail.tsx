import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { classesService, studentsService } from '../../services/api'
import type { Turma, Aluno } from '../../types'
import Modal from '../../components/ui/Modal'

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

  const addStudentMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => classesService.addStudent(id!, d),
    onSuccess: () => {
      toast.success('Aluno alocado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['class', id] })
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
      <div className="border-b border-outline-variant/40">
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dados' && (
        <div className="card-padded">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><p className="field-label">Código</p><p className="text-sm text-on-surface">{turma.codigo}</p></div>
            <div><p className="field-label">Ano Letivo</p><p className="text-sm text-on-surface">{turma.ano_letivo}</p></div>
            <div><p className="field-label">Turno</p><p className="text-sm text-on-surface">{turnos[turma.turno]}</p></div>
            <div><p className="field-label">Total de Alunos</p><p className="text-sm text-on-surface">{alocacoes.length}</p></div>
            <div><p className="field-label">Calendário</p><p className="text-sm text-on-surface">{turma.calendario_id ?? '—'}</p></div>
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
                    <th className="th">Aluno ID</th>
                    <th className="th">Data de Matrícula</th>
                  </tr>
                </thead>
                <tbody>
                  {alocacoes.length === 0 ? (
                    <tr><td colSpan={2} className="td text-center text-on-surface-variant py-6">Nenhum aluno alocado.</td></tr>
                  ) : (
                    alocacoes.map((a) => (
                      <tr key={a.id} className="tr-row">
                        <td className="td font-mono text-xs">{a.aluno_id}</td>
                        <td className="td text-on-surface-variant">{new Date(a.data_matricula).toLocaleDateString('pt-BR')}</td>
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={addStudentMutation.isPending}>{addStudentMutation.isPending ? 'Alocando…' : 'Alocar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
