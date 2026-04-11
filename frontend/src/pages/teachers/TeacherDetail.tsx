import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { teachersService } from '../../services/api'
import type { Professor, GradeHoraria, DiaSemana } from '../../types'
import Modal from '../../components/ui/Modal'

const DAYS: DiaSemana[] = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
const DAYS_PT: Record<DiaSemana, string> = {
  SEGUNDA: 'Segunda', TERCA: 'Terça', QUARTA: 'Quarta',
  QUINTA: 'Quinta', SEXTA: 'Sexta', SABADO: 'Sábado',
}

type Tab = 'dados' | 'grade' | 'substituicoes'

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('dados')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTeacher, setEditTeacher] = useState(false)
  const [editForm, setEditForm] = useState({ nome_completo: '', email: '' })
  const [scheduleForm, setScheduleForm] = useState({
    turma_id: '', disciplina_id: '', bimestre: 1, ano_letivo: new Date().getFullYear(),
    dia_semana: 'SEGUNDA' as DiaSemana, horario_inicio: '07:00', horario_fim: '08:00',
  })

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => teachersService.getById(id!).then((r) => r.data as Professor),
    enabled: !!id,
  })

  const { data: scheduleData } = useQuery({
    queryKey: ['teacher-schedule', id],
    queryFn: () => teachersService.schedule(id!).then((r) => r.data),
    enabled: !!id && tab === 'grade',
  })

  const { data: changesData } = useQuery({
    queryKey: ['teacher-changes'],
    queryFn: () => teachersService.recentChanges().then((r) => r.data),
    enabled: !!id && tab === 'substituicoes',
  })

  const updateMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => teachersService.update(id!, d),
    onSuccess: () => {
      toast.success('Professor atualizado!')
      queryClient.invalidateQueries({ queryKey: ['teacher', id] })
      setEditTeacher(false)
    },
    onError: () => toast.error('Erro ao atualizar professor.'),
  })

  const addScheduleMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => teachersService.addSchedule(id!, d),
    onSuccess: () => {
      toast.success('Horário adicionado!')
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule', id] })
      setModalOpen(false)
    },
    onError: () => toast.error('Erro ao adicionar horário.'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-surface-container animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!teacher) return <div className="card-padded text-center text-on-surface-variant">Professor não encontrado.</div>

  const schedule: GradeHoraria[] = Array.isArray(scheduleData) ? scheduleData : scheduleData?.data ?? []
  const changes = Array.isArray(changesData) ? changesData : []

  // Build weekly grid
  const grid: Record<DiaSemana, GradeHoraria[]> = {} as Record<DiaSemana, GradeHoraria[]>
  DAYS.forEach((d) => { grid[d] = schedule.filter((s) => s.dia_semana === d) })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'grade', label: 'Grade Horária' },
    { key: 'substituicoes', label: 'Substituições' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-padded">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
              <span className="text-secondary text-xl font-bold">
                {teacher.nome_completo.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="page-title">{teacher.nome_completo}</h1>
              <p className="page-subtitle">{teacher.email}</p>
            </div>
          </div>
          <button className="btn-secondary btn-sm flex-shrink-0" onClick={() => {
            setEditForm({ nome_completo: teacher.nome_completo, email: teacher.email })
            setEditTeacher(true)
          }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Editar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/40">
        <div className="flex gap-0 overflow-x-auto">
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
            <div>
              <p className="field-label">Nome Completo</p>
              <p className="text-sm text-on-surface">{teacher.nome_completo}</p>
            </div>
            <div>
              <p className="field-label">E-mail</p>
              <p className="text-sm text-on-surface">{teacher.email}</p>
            </div>
            <div>
              <p className="field-label">Cadastrado em</p>
              <p className="text-sm text-on-surface">{new Date(teacher.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'grade' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar Horário
            </button>
          </div>
          <div className="table-wrap overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {DAYS.map((d) => (
                    <th key={d} className="th text-center">{DAYS_PT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS.map((d) => (
                    <td key={d} className="td align-top">
                      <div className="space-y-1 min-h-[4rem]">
                        {grid[d].length === 0 ? (
                          <span className="text-xs text-on-surface-variant/40">—</span>
                        ) : (
                          grid[d].map((s) => (
                            <div key={s.id} className="p-2 bg-primary-fixed rounded text-xs">
                              <p className="font-semibold text-primary">{s.horario_inicio}–{s.horario_fim}</p>
                              <p className="text-on-surface-variant truncate">{s.bimestre}º BIM</p>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'substituicoes' && (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Tipo</th>
                  <th className="th">Descrição</th>
                  <th className="th">Data</th>
                  <th className="th text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {changes.length === 0 ? (
                  <tr><td colSpan={4} className="td text-center text-on-surface-variant py-6">Sem substituições.</td></tr>
                ) : (
                  changes.map((c: { id: string; tipo: string; descricao: string; publicado_em: string; processado: boolean }) => (
                    <tr key={c.id} className="tr-row">
                      <td className="td"><span className="badge badge-secondary">{c.tipo}</span></td>
                      <td className="td">{c.descricao}</td>
                      <td className="td text-on-surface-variant">{new Date(c.publicado_em).toLocaleDateString('pt-BR')}</td>
                      <td className="td text-center">
                        {c.processado ? <span className="badge badge-success">Processado</span> : <span className="badge badge-warning">Pendente</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit professor modal */}
      <Modal isOpen={editTeacher} onClose={() => setEditTeacher(false)} title="Editar Professor" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ nome_completo: editForm.nome_completo, email: editForm.email }) }} className="space-y-4">
          <div>
            <label className="field-label">Nome Completo *</label>
            <input className="input-field" value={editForm.nome_completo} onChange={(e) => setEditForm((p) => ({ ...p, nome_completo: e.target.value }))} required />
          </div>
          <div>
            <label className="field-label">E-mail *</label>
            <input type="email" className="input-field" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditTeacher(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {/* Add schedule modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Horário" size="md">
        <form onSubmit={(e) => { e.preventDefault(); addScheduleMutation.mutate({ ...scheduleForm }) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Turma ID *</label>
              <input className="input-field" value={scheduleForm.turma_id} onChange={(e) => setScheduleForm((p) => ({ ...p, turma_id: e.target.value }))} required />
            </div>
            <div>
              <label className="field-label">Disciplina ID *</label>
              <input className="input-field" value={scheduleForm.disciplina_id} onChange={(e) => setScheduleForm((p) => ({ ...p, disciplina_id: e.target.value }))} required />
            </div>
            <div>
              <label className="field-label">Dia da Semana *</label>
              <select className="input-field" value={scheduleForm.dia_semana} onChange={(e) => setScheduleForm((p) => ({ ...p, dia_semana: e.target.value as DiaSemana }))}>
                {DAYS.map((d) => <option key={d} value={d}>{DAYS_PT[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Bimestre *</label>
              <select className="input-field" value={scheduleForm.bimestre} onChange={(e) => setScheduleForm((p) => ({ ...p, bimestre: +e.target.value }))}>
                {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}º BIM</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Horário Início *</label>
              <input type="time" className="input-field" value={scheduleForm.horario_inicio} onChange={(e) => setScheduleForm((p) => ({ ...p, horario_inicio: e.target.value }))} required />
            </div>
            <div>
              <label className="field-label">Horário Fim *</label>
              <input type="time" className="input-field" value={scheduleForm.horario_fim} onChange={(e) => setScheduleForm((p) => ({ ...p, horario_fim: e.target.value }))} required />
            </div>
            <div>
              <label className="field-label">Ano Letivo *</label>
              <input type="number" className="input-field" value={scheduleForm.ano_letivo} onChange={(e) => setScheduleForm((p) => ({ ...p, ano_letivo: +e.target.value }))} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={addScheduleMutation.isPending}>{addScheduleMutation.isPending ? 'Salvando…' : 'Adicionar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
