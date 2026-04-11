import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { teachersService } from '../../services/api'
import type { Professor } from '../../types'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function TeacherListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const limit = 15
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome_completo: '', email: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', { search, page, limit }],
    queryFn: () =>
      teachersService.list({ search: search || undefined, page, limit }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => teachersService.create(d),
    onSuccess: () => {
      toast.success('Professor cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setModalOpen(false)
      setForm({ nome_completo: '', email: '' })
    },
    onError: () => toast.error('Erro ao cadastrar professor.'),
  })

  const teachers: Professor[] = data?.data ?? []
  const total: number = data?.total ?? 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome_completo || !form.email) return
    createMutation.mutate({ nome_completo: form.nome_completo, email: form.email })
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Professores</h1>
          <p className="page-subtitle">
            {total > 0 && <span className="badge badge-neutral ml-1">{total} cadastrados</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Cadastrar Professor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          className="input-field pl-9"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-surface-container animate-pulse rounded-lg" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <EmptyState
            title="Nenhum professor encontrado"
            description="Cadastre um novo professor para começar."
            action={{ label: 'Cadastrar Professor', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Nome</th>
                    <th className="th">E-mail</th>
                    <th className="th-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="tr-row">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                            <span className="text-secondary text-xs font-bold">{getInitials(t.nome_completo)}</span>
                          </div>
                          <span className="font-medium">{t.nome_completo}</span>
                        </div>
                      </td>
                      <td className="td text-on-surface-variant">{t.email}</td>
                      <td className="td-right">
                        <button
                          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
                          title="Ver detalhes"
                          onClick={() => navigate(`/teachers/${t.id}`)}
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

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar Professor" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Nome Completo *</label>
            <input
              className="input-field"
              value={form.nome_completo}
              onChange={(e) => setForm((p) => ({ ...p, nome_completo: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">E-mail *</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
