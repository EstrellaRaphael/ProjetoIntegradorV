import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { classesService, calendarService } from '../../services/api'
import type { Turma, TurmaStatus } from '../../types'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

const TURNO_LABELS: Record<TurmaStatus, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
}

const TURNO_BADGES: Record<TurmaStatus, string> = {
  MANHA: 'badge badge-primary',
  TARDE: 'badge badge-warning',
  NOITE: 'badge badge-secondary',
}

export default function ClassListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const limit = 15
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    codigo: '', ano_letivo: new Date().getFullYear(), turno: 'MANHA' as TurmaStatus, calendario_id: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['classes', { page, limit }],
    queryFn: () => classesService.list({ page, limit }).then((r) => r.data),
  })

  const { data: calendarsData } = useQuery({
    queryKey: ['calendars'],
    queryFn: () => calendarService.list().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => classesService.create(d),
    onSuccess: () => {
      toast.success('Turma criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setModalOpen(false)
      setForm({ codigo: '', ano_letivo: new Date().getFullYear(), turno: 'MANHA', calendario_id: '' })
    },
    onError: () => toast.error('Erro ao criar turma.'),
  })

  const turmas: Turma[] = data?.data ?? []
  const total: number = data?.total ?? 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = { ...form }
    if (!payload.calendario_id) delete payload.calendario_id
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Turmas</h1>
          <p className="page-subtitle">
            {total > 0 && <span className="badge badge-neutral ml-1">{total} turmas</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Turma
        </button>
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-surface-container animate-pulse rounded-lg" />)}
          </div>
        ) : turmas.length === 0 ? (
          <EmptyState
            title="Nenhuma turma encontrada"
            description="Crie uma nova turma para começar."
            action={{ label: 'Nova Turma', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Código</th>
                    <th className="th">Ano Letivo</th>
                    <th className="th">Turno</th>
                    <th className="th text-center">Alunos</th>
                    <th className="th-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {turmas.map((t) => (
                    <tr key={t.id} className="tr-row">
                      <td className="td font-semibold">{t.codigo}</td>
                      <td className="td text-on-surface-variant">{t.ano_letivo}</td>
                      <td className="td">
                        <span className={TURNO_BADGES[t.turno]}>{TURNO_LABELS[t.turno]}</span>
                      </td>
                      <td className="td text-center">
                        <span className="badge badge-neutral">{t.alocacao_aluno?.length ?? 0}</span>
                      </td>
                      <td className="td-right">
                        <button
                          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
                          onClick={() => navigate(`/classes/${t.id}`)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={limit} onChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Turma" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Código *</label>
            <input className="input-field" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ex: 1A, 2B…" required />
          </div>
          <div>
            <label className="field-label">Ano Letivo *</label>
            <input type="number" className="input-field" value={form.ano_letivo} onChange={(e) => setForm((p) => ({ ...p, ano_letivo: +e.target.value }))} required />
          </div>
          <div>
            <label className="field-label">Turno *</label>
            <select className="input-field" value={form.turno} onChange={(e) => setForm((p) => ({ ...p, turno: e.target.value as TurmaStatus }))}>
              <option value="MANHA">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
            </select>
          </div>
          <div>
            <label className="field-label">Calendário</label>
            <select className="input-field" value={form.calendario_id} onChange={(e) => setForm((p) => ({ ...p, calendario_id: e.target.value }))}>
              <option value="">Sem calendário</option>
              {Array.isArray(calendarsData) && calendarsData.map((c: { id: string; descricao: string }) => (
                <option key={c.id} value={c.id}>{c.descricao}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando…' : 'Criar Turma'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
