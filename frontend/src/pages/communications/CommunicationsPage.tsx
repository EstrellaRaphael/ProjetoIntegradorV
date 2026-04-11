import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { communicationsService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Comunicado, TipoPublico } from '../../types'
import Modal from '../../components/ui/Modal'

const PUBLICO_LABELS: Record<TipoPublico, string> = {
  GERAL: 'Geral',
  TURMA_ESPECIFICA: 'Turma Específica',
  TODOS_PROFESSORES: 'Todos os Professores',
  LISTA_MANUAL: 'Lista Manual',
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('pt-BR')
}

function getInitials(id: string) {
  return id.slice(0, 2).toUpperCase()
}

export default function CommunicationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'

  const [selected, setSelected] = useState<Comunicado | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    publico_alvo: 'GERAL' as TipoPublico,
    turma_id: '',
    lista_ids: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['communications', 'list'],
    queryFn: () => communicationsService.list().then((r) => r.data),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => communicationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => communicationsService.create(d),
    onSuccess: () => {
      toast.success('Comunicado enviado!')
      queryClient.invalidateQueries({ queryKey: ['communications'] })
      setModalOpen(false)
      setForm({ titulo: '', conteudo: '', publico_alvo: 'GERAL', turma_id: '', lista_ids: '' })
    },
    onError: () => toast.error('Erro ao enviar comunicado.'),
  })

  const communications: Comunicado[] = Array.isArray(data) ? data : data?.data ?? []

  const filtered = communications.filter(
    (c) =>
      !search ||
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      c.conteudo.toLowerCase().includes(search.toLowerCase())
  )

  function isUnread(c: Comunicado) {
    return c.destinatario_comunicado?.some((d) => !d.lido)
  }

  function handleSelect(c: Comunicado) {
    setSelected(c)
    if (isUnread(c)) {
      markAsReadMutation.mutate(c.id)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      publico_alvo: form.publico_alvo,
    }
    if (form.publico_alvo === 'TURMA_ESPECIFICA' && form.turma_id) {
      payload.turma_id = form.turma_id
    }
    if (form.publico_alvo === 'LISTA_MANUAL' && form.lista_ids) {
      payload.lista_ids = form.lista_ids.split(',').map((s) => s.trim())
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comunicados</h1>
          <p className="page-subtitle">Mensagens e avisos do sistema</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Comunicado
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[60vh]">
        {/* Left: list (35%) */}
        <div className="lg:w-[35%] flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Buscar comunicados…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="card flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface-container animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                Nenhum comunicado encontrado.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {filtered.map((c) => {
                  const unread = isUnread(c)
                  const isSelected = selected?.id === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-container/60 ${
                        isSelected ? 'bg-primary-fixed/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {unread && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        {!unread && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${unread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                            {c.titulo}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{c.conteudo}</p>
                          <p className="text-xs text-on-surface-variant/60 mt-1">{formatDate(c.data_envio)}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: content (65%) */}
        <div className="lg:w-[65%]">
          {selected ? (
            <div className="card-padded h-full flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">{selected.titulo}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center">
                        <span className="text-secondary text-[10px] font-bold">{getInitials(selected.remetente_id)}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{selected.remetente_id.slice(0, 12)}…</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">·</span>
                    <span className="text-xs text-on-surface-variant">{formatDate(selected.data_envio)}</span>
                    <span className="badge badge-neutral text-[10px]">{PUBLICO_LABELS[selected.publico_alvo]}</span>
                  </div>
                </div>
                {isUnread(selected) && (
                  <button
                    className="btn-secondary btn-sm flex-shrink-0"
                    onClick={() => markAsReadMutation.mutate(selected.id)}
                  >
                    Marcar como Lido
                  </button>
                )}
              </div>
              <div className="divider" />
              <div className="flex-1">
                <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{selected.conteudo}</p>
              </div>
            </div>
          ) : (
            <div className="card-padded h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container mx-auto flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-on-surface-variant/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm text-on-surface-variant">Selecione um comunicado para ler</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Comunicado" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Título *</label>
            <input className="input-field" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} required />
          </div>
          <div>
            <label className="field-label">Conteúdo *</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              value={form.conteudo}
              onChange={(e) => setForm((p) => ({ ...p, conteudo: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">Público-alvo *</label>
            <select className="input-field" value={form.publico_alvo} onChange={(e) => setForm((p) => ({ ...p, publico_alvo: e.target.value as TipoPublico }))}>
              {(Object.keys(PUBLICO_LABELS) as TipoPublico[]).map((t) => (
                <option key={t} value={t}>{PUBLICO_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {form.publico_alvo === 'TURMA_ESPECIFICA' && (
            <div>
              <label className="field-label">ID da Turma *</label>
              <input className="input-field" value={form.turma_id} onChange={(e) => setForm((p) => ({ ...p, turma_id: e.target.value }))} placeholder="UUID da turma" />
            </div>
          )}

          {form.publico_alvo === 'LISTA_MANUAL' && (
            <div>
              <label className="field-label">IDs dos Destinatários (separados por vírgula)</label>
              <textarea
                className="input-field"
                value={form.lista_ids}
                onChange={(e) => setForm((p) => ({ ...p, lista_ids: e.target.value }))}
                placeholder="uuid1, uuid2, uuid3…"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Enviando…' : 'Enviar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
