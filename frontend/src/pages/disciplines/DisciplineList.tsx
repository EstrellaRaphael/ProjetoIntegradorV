import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { disciplinesService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Disciplina } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

export default function DisciplineListPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Disciplina | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', carga_horaria: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => disciplinesService.create(d),
    onSuccess: () => {
      toast.success('Disciplina criada!')
      queryClient.invalidateQueries({ queryKey: ['disciplines'] })
      closeModal()
    },
    onError: () => toast.error('Erro ao criar disciplina.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      disciplinesService.update(id, data),
    onSuccess: () => {
      toast.success('Disciplina atualizada!')
      queryClient.invalidateQueries({ queryKey: ['disciplines'] })
      closeModal()
    },
    onError: () => toast.error('Erro ao atualizar disciplina.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => disciplinesService.remove(id),
    onSuccess: () => {
      toast.success('Disciplina removida!')
      queryClient.invalidateQueries({ queryKey: ['disciplines'] })
    },
    onError: () => toast.error('Erro ao remover disciplina.'),
  })

  function openCreate() {
    setEditItem(null)
    setForm({ nome: '', carga_horaria: '' })
    setModalOpen(true)
  }

  function openEdit(d: Disciplina) {
    setEditItem(d)
    setForm({ nome: d.nome, carga_horaria: String(d.carga_horaria) })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditItem(null)
    setForm({ nome: '', carga_horaria: '' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { nome: form.nome, carga_horaria: Number(form.carga_horaria) }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const disciplines: Disciplina[] = Array.isArray(data) ? data : data?.data ?? []
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Disciplinas</h1>
          <p className="page-subtitle">{disciplines.length} disciplinas cadastradas</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Disciplina
          </button>
        )}
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : disciplines.length === 0 ? (
          <EmptyState
            title="Nenhuma disciplina cadastrada"
            description="Crie disciplinas para associá-las às turmas e avaliações."
            action={isAdmin ? { label: 'Nova Disciplina', onClick: openCreate } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Nome</th>
                  <th className="th text-center">Carga Horária (h)</th>
                  <th className="th-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {disciplines.map((d) => (
                  <tr key={d.id} className="tr-row">
                    <td className="td font-medium">{d.nome}</td>
                    <td className="td text-center">
                      <span className="badge badge-neutral">{d.carga_horaria}h</span>
                    </td>
                    <td className="td-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="icon-btn"
                            onClick={() => openEdit(d)}
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            onClick={() => setDeleteId(d.id)}
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Editar Disciplina' : 'Nova Disciplina'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Nome *</label>
            <input className="input-field" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Matemática, Português…" required />
          </div>
          <div>
            <label className="field-label">Carga Horária (horas) *</label>
            <input type="number" min={1} className="input-field" value={form.carga_horaria} onChange={(e) => setForm((p) => ({ ...p, carga_horaria: e.target.value }))} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Salvando…' : editItem ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Disciplina"
        message="Tem certeza que deseja excluir esta disciplina?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  )
}
