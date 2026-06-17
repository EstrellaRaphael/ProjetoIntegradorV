import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { gradesService } from '../../services/api'
import type { GradeConfig } from '../../types'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [newValue, setNewValue] = useState('')

  const { data: configData, isLoading } = useQuery({
    queryKey: ['grades-config'],
    queryFn: () => gradesService.config().then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (value: number) => gradesService.updateConfig({ media_min_aprovacao: value }),
    onSuccess: () => {
      toast.success('Configuração atualizada!')
      queryClient.invalidateQueries({ queryKey: ['grades-config'] })
      setEditing(false)
    },
    onError: () => toast.error('Erro ao atualizar configuração.'),
  })

  const config: GradeConfig | null = Array.isArray(configData) ? configData[0] ?? null : configData ?? null

  // History if it's an array
  const history: GradeConfig[] = Array.isArray(configData) ? configData : []

  function handleSave() {
    const v = parseFloat(newValue.replace(',', '.'))
    if (isNaN(v) || v < 0 || v > 10) {
      toast.error('Informe um valor válido entre 0 e 10.')
      return
    }
    updateMutation.mutate(v)
  }

  function startEditing() {
    setNewValue(String(config?.media_min_aprovacao ?? ''))
    setEditing(true)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Parâmetros do sistema escolar</p>
        </div>
      </div>

      {/* Grade config section */}
      <div className="card-padded space-y-4">
        <h3 className="text-sm font-semibold text-on-surface">Configuração de Notas</h3>
        <div className="divider" />

        {isLoading ? (
          <div className="h-12 bg-surface-container animate-pulse rounded-lg" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="field-label">Média Mínima para Aprovação</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    className="input-field w-24"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Ex: 7,0"
                    autoFocus
                  />
                  <button
                    className="btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(false)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
                  {config?.media_min_aprovacao != null ? Number(config.media_min_aprovacao).toFixed(1).replace('.', ',') : '—'}
                </p>
              )}
              {config?.vigente_desde && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Vigente desde {new Date(config.vigente_desde).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            {!editing && (
              <button className="btn-secondary btn-sm" onClick={startEditing}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Alterar
              </button>
            )}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="table-wrap">
          <div className="px-4 py-3 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Histórico de Alterações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Média Mínima</th>
                  <th className="th">Vigente desde</th>
                  <th className="th text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id ?? i} className="tr-row">
                    <td className="td font-bold tabular-nums">
                      {Number(h.media_min_aprovacao).toFixed(1).replace('.', ',')}
                    </td>
                    <td className="td text-on-surface-variant">
                      {h.vigente_desde ? new Date(h.vigente_desde).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="td text-center">
                      {h.ativa ? (
                        <span className="badge badge-success">Ativa</span>
                      ) : (
                        <span className="badge badge-neutral">Histórico</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
