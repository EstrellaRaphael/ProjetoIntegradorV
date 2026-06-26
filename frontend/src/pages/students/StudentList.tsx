import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { studentsService } from '../../services/api'
import type { Aluno } from '../../types'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { getInitials } from '../../utils/formatters'

export default function StudentListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 15

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students', { search, status, page, limit }],
    queryFn: () =>
      studentsService
        .list({ search: search || undefined, status: status || undefined, page, limit })
        .then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsService.remove(id),
    onSuccess: () => {
      toast.success('Aluno removido com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: () => toast.error('Erro ao remover aluno.'),
  })

  const students: Aluno[] = data?.data ?? []
  const total: number = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">
            {total > 0 && (
              <span className="badge badge-neutral ml-1">{total} cadastrados</span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/students/new')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Cadastrar Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="search-wrap flex-1">
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome, matrícula ou e-mail…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
          <option value="TRANCADO">Trancado</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="Nenhum aluno encontrado"
            description="Tente ajustar os filtros ou cadastre um novo aluno."
            action={{ label: 'Cadastrar Aluno', onClick: () => navigate('/students/new') }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Matrícula</th>
                    <th className="th">Nome</th>
                    <th className="th">E-mail</th>
                    <th className="th">Turma</th>
                    <th className="th">Status</th>
                    <th className="th-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="tr-row">
                      <td className="td font-mono text-xs text-on-surface-variant">{s.matricula}</td>
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <div className="avatar-sm avatar-primary-fixed">
                            <span className="avatar-initials-sm">{getInitials(s.nome_completo)}</span>
                          </div>
                          <span className="font-medium">{s.nome_completo}</span>
                        </div>
                      </td>
                      <td className="td text-on-surface-variant">{s.email}</td>
                      <td className="td text-on-surface-variant">
                        {s.turma_atual_id ? <span className="badge badge-primary">Vinculado</span> : <span className="text-on-surface-variant">—</span>}
                      </td>
                      <td className="td"><StatusBadge status={s.status} /></td>
                      <td className="td-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="icon-btn"
                            title="Ver detalhes"
                            onClick={() => navigate(`/students/${s.id}`)}
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn"
                            title="Editar"
                            onClick={() => navigate(`/students/${s.id}/edit`)}
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Excluir"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
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

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Aluno"
        message="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  )
}
