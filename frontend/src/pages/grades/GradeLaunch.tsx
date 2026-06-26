import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { assessmentsService, gradesService, studentsService } from '../../services/api'
import type { Avaliacao, Aluno } from '../../types'

export default function GradeLaunchPage() {
  const queryClient = useQueryClient()
  const [selectedAssessment, setSelectedAssessment] = useState<Avaliacao | null>(null)
  const [grades, setGrades] = useState<Record<string, string>>({})

  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['assessments', 'all'],
    queryFn: () => assessmentsService.list().then((r) => r.data),
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'class', selectedAssessment?.turma_id],
    queryFn: () =>
      studentsService.list({ turma_id: selectedAssessment!.turma_id, limit: 200 }).then((r) => r.data),
    enabled: !!selectedAssessment?.turma_id,
  })

  const saveMutation = useMutation({
    mutationFn: async (entries: { aluno_id: string; valor: number }[]) => {
      for (const entry of entries) {
        await gradesService.create({
          avaliacao_id: selectedAssessment!.id,
          aluno_id: entry.aluno_id,
          valor: entry.valor,
          professor_id: selectedAssessment!.professor_id,
        })
      }
    },
    onSuccess: () => {
      toast.success('Notas salvas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['grades'] })
    },
    onError: () => toast.error('Erro ao salvar notas.'),
  })

  const assessments: Avaliacao[] = Array.isArray(assessmentsData) ? assessmentsData : assessmentsData?.data ?? []
  const students: Aluno[] = studentsData?.data ?? []

  function getGradeValue(studentId: string): number | null {
    const v = grades[studentId]
    if (v === undefined || v === '') return null
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? null : n
  }

  function gradeInputClass(value: string) {
    if (!value) return 'input-field'
    const n = parseFloat(value.replace(',', '.'))
    if (isNaN(n)) return 'input-field input-error'
    if (n >= 7) return 'input-field !border-success !ring-success/20'
    return 'input-field !border-error !ring-error/20'
  }

  function handleSave() {
    const entries = students
      .map((s) => ({ aluno_id: s.id, valor: getGradeValue(s.id) ?? 0 }))
      .filter((e) => {
        const raw = grades[e.aluno_id]
        return raw !== undefined && raw !== ''
      })
    if (entries.length === 0) {
      toast.error('Preencha pelo menos uma nota.')
      return
    }
    saveMutation.mutate(entries)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lançamento de Notas</h1>
          <p className="page-subtitle">Selecione uma avaliação e insira as notas dos alunos</p>
        </div>
      </div>

      {/* Step 1: Assessment selector */}
      <div className="card-padded">
        <h3 className="section-title">
          <span className="step-number">1</span>
          Selecionar Avaliação
        </h3>
        {assessmentsLoading ? (
          <div className="skeleton-row" />
        ) : (
          <select
            className="input-field max-w-lg"
            value={selectedAssessment?.id ?? ''}
            onChange={(e) => {
              const found = assessments.find((a) => a.id === e.target.value) ?? null
              setSelectedAssessment(found)
              setGrades({})
            }}
          >
            <option value="">Selecione uma avaliação…</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.titulo} — {a.tipo} — {a.bimestre}º BIM — {new Date(a.data_aplicacao).toLocaleDateString('pt-BR')}
              </option>
            ))}
          </select>
        )}

        {selectedAssessment && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge badge-primary">{selectedAssessment.tipo}</span>
            <span className="badge badge-neutral">{selectedAssessment.bimestre}º Bimestre</span>
            <span className="badge badge-neutral">{selectedAssessment.ano_letivo}</span>
            <span className="badge badge-neutral">Peso: {selectedAssessment.peso_na_media}</span>
          </div>
        )}
      </div>

      {/* Step 2: Grade entry table */}
      {selectedAssessment && (
        <div className="card-padded space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">
              <span className="step-number">2</span>
              Lançar Notas
            </h3>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando…
                </>
              ) : 'Salvar Tudo'}
            </button>
          </div>

          {studentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-surface-container animate-pulse rounded-lg" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">
              Nenhum aluno encontrado nesta turma.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Aluno</th>
                    <th className="th">Matrícula</th>
                    <th className="th w-36">Nota (0–10)</th>
                    <th className="th text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const val = grades[s.id] ?? ''
                    const numVal = parseFloat(val.replace(',', '.'))
                    const hasValue = val !== '' && !isNaN(numVal)
                    return (
                      <tr key={s.id} className="tr-row">
                        <td className="td font-medium">{s.nome_completo}</td>
                        <td className="td font-mono text-xs text-on-surface-variant">{s.matricula}</td>
                        <td className="td">
                          <input
                            type="text"
                            className={gradeInputClass(val)}
                            value={val}
                            onChange={(e) => setGrades((prev) => ({ ...prev, [s.id]: e.target.value }))}
                            placeholder="0,0"
                          />
                        </td>
                        <td className="td text-center">
                          {!hasValue ? (
                            <span className="badge badge-neutral">Pendente</span>
                          ) : numVal >= 7 ? (
                            <span className="badge badge-success">Aprovado</span>
                          ) : numVal >= 5 ? (
                            <span className="badge badge-warning">Recuperação</span>
                          ) : (
                            <span className="badge badge-danger">Reprovado</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
