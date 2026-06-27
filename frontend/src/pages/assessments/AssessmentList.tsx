import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { assessmentsService, classesService, disciplinesService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Avaliacao, AvaliacaoTipo } from '../../types'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'

const TIPO_LABELS: Record<AvaliacaoTipo, string> = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  RECUPERACAO: 'Recuperação',
  PROVA_FINAL: 'Prova Final',
}

const TIPO_BADGES: Record<AvaliacaoTipo, string> = {
  PROVA: 'badge badge-primary',
  TRABALHO: 'badge badge-secondary',
  RECUPERACAO: 'badge badge-warning',
  PROVA_FINAL: 'badge badge-danger',
}

export default function AssessmentListPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'PROFESSOR'

  const [filterBimestre, setFilterBimestre] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'PROVA' as AvaliacaoTipo,
    disciplina_id: '',
    turma_id: '',
    professor_id: '',
    bimestre: 1,
    ano_letivo: new Date().getFullYear(),
    data_aplicacao: '',
    peso_na_media: 1,
  })

  const params: Record<string, unknown> = {}
  if (filterBimestre) params.bimestre = filterBimestre
  if (filterTipo) params.tipo = filterTipo

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', params],
    queryFn: () => assessmentsService.list(params).then((r) => r.data),
  })

  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const { data: turmasData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.list({ limit: 200 }).then((r) => r.data),
  })

  const disciplineNames: Record<string, string> = useMemo(() => {
    const list = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
    const map: Record<string, string> = {}
    list.forEach((d: { id: string; nome: string }) => { map[d.id] = d.nome })
    return map
  }, [disciplinasData])

  const classNames: Record<string, string> = useMemo(() => {
    const list = turmasData?.data ?? []
    const map: Record<string, string> = {}
    list.forEach((t: { id: string; codigo: string }) => { map[t.id] = t.codigo })
    return map
  }, [turmasData])

  const disciplinas = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
  const turmas = turmasData?.data ?? []

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => assessmentsService.create(d),
    onSuccess: () => {
      toast.success('Avaliação criada!')
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      setModalOpen(false)
      setForm({
        titulo: '', tipo: 'PROVA', disciplina_id: '', turma_id: '', professor_id: '',
        bimestre: 1, ano_letivo: new Date().getFullYear(), data_aplicacao: '', peso_na_media: 1,
      })
    },
    onError: () => toast.error('Erro ao criar avaliação.'),
  })

  const assessments: Avaliacao[] = Array.isArray(data) ? data : data?.data ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = { ...form }
    if (!payload.professor_id) delete payload.professor_id
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Avaliações</h1>
          <p className="page-subtitle">{assessments.length} avaliações encontradas</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Avaliação
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input-field w-44"
          value={filterBimestre}
          onChange={(e) => setFilterBimestre(e.target.value)}
        >
          <option value="">Todos os bimestres</option>
          {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}º Bimestre</option>)}
        </select>
        <select
          className="input-field w-48"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(TIPO_LABELS) as AvaliacaoTipo[]).map((t) => (
            <option key={t} value={t}>{TIPO_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : assessments.length === 0 ? (
          <EmptyState
            title="Nenhuma avaliação encontrada"
            description="Crie uma avaliação para começar a lançar notas."
            action={canCreate ? { label: 'Nova Avaliação', onClick: () => setModalOpen(true) } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Título</th>
                  <th className="th">Tipo</th>
                  <th className="th">Disciplina</th>
                  <th className="th">Turma</th>
                  <th className="th text-center">Bimestre</th>
                  <th className="th">Data</th>
                  <th className="th text-center">Peso</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="tr-row">
                    <td className="td font-medium">{a.titulo}</td>
                    <td className="td">
                      <span className={TIPO_BADGES[a.tipo]}>{TIPO_LABELS[a.tipo]}</span>
                    </td>
                    <td className="td text-on-surface-variant">{disciplineNames[a.disciplina_id] ?? 'Disciplina'}</td>
                    <td className="td text-on-surface-variant">{classNames[a.turma_id] ?? 'Turma'}</td>
                    <td className="td text-center">
                      <span className="badge badge-neutral">{a.bimestre}º</span>
                    </td>
                    <td className="td text-on-surface-variant">
                      {new Date(a.data_aplicacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="td text-center text-on-surface-variant">{a.peso_na_media}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Avaliação" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Título *</label>
            <input className="input-field" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} required />
          </div>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Tipo *</label>
              <select className="input-field" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as AvaliacaoTipo }))}>
                {(Object.keys(TIPO_LABELS) as AvaliacaoTipo[]).map((t) => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Bimestre *</label>
              <select className="input-field" value={form.bimestre} onChange={(e) => setForm((p) => ({ ...p, bimestre: +e.target.value }))}>
                {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}º BIM</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Disciplina *</label>
              <select className="input-field" value={form.disciplina_id} onChange={(e) => setForm((p) => ({ ...p, disciplina_id: e.target.value }))} required>
                <option value="">Selecionar…</option>
                {disciplinas.map((d: { id: string; nome: string }) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Turma *</label>
              <select className="input-field" value={form.turma_id} onChange={(e) => setForm((p) => ({ ...p, turma_id: e.target.value }))} required>
                <option value="">Selecionar…</option>
                {turmas.map((t: { id: string; codigo: string; ano_letivo: number }) => <option key={t.id} value={t.id}>{t.codigo} — {t.ano_letivo}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Data de Aplicação *</label>
              <input type="date" className="input-field" value={form.data_aplicacao} onChange={(e) => setForm((p) => ({ ...p, data_aplicacao: e.target.value }))} required />
            </div>
            <div>
              <label className="field-label">Ano Letivo *</label>
              <input type="number" className="input-field" value={form.ano_letivo} onChange={(e) => setForm((p) => ({ ...p, ano_letivo: +e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="field-label">Peso na Média (1–10) *</label>
            <input type="number" min={1} max={10} step={0.1} className="input-field" value={form.peso_na_media} onChange={(e) => setForm((p) => ({ ...p, peso_na_media: +e.target.value }))} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando…' : 'Criar Avaliação'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
