import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { studentsService, classesService, disciplinesService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Aluno, Turma, Disciplina, FrequenciaConsolidada } from '../../types'

export default function FrequencyPage() {
  const { user } = useAuthStore()
  const isProfessor = user?.role === 'PROFESSOR'

  return isProfessor ? <ProfessorFrequency /> : <AlunoFrequency />
}

// ── Professor view ─────────────────────────────────────────────────────────────

function ProfessorFrequency() {
  const queryClient = useQueryClient()
  const [turmaId, setTurmaId] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [bimestre, setBimestre] = useState(1)
  const [presencas, setPresencas] = useState<Record<string, boolean>>({})

  const { data: turmasData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.list({ limit: 200 }).then((r) => r.data),
  })

  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'class', turmaId],
    queryFn: () => studentsService.list({ turma_id: turmaId, limit: 200 }).then((r) => r.data),
    enabled: !!turmaId,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const aluno of students) {
        await studentsService.addFrequency(aluno.id, {
          disciplina_id: disciplinaId,
          bimestre,
          data_aula: data,
          presente: presencas[aluno.id] ?? true,
        })
      }
    },
    onSuccess: () => {
      toast.success('Frequência registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['student-frequency'] })
    },
    onError: () => toast.error('Erro ao registrar frequência.'),
  })

  const turmas: Turma[] = turmasData?.data ?? []
  const disciplinas: Disciplina[] = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
  const students: Aluno[] = studentsData?.data ?? []

  // Initialize presencas to true when students load
  function togglePresenca(id: string) {
    setPresencas((p) => ({ ...p, [id]: !(p[id] ?? true) }))
  }

  const readyToRecord = turmaId && disciplinaId && data && students.length > 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro de Frequência</h1>
          <p className="page-subtitle">Registre a presença dos alunos na aula</p>
        </div>
      </div>

      {/* Form */}
      <div className="card-padded">
        <h3 className="section-title">Configurar Chamada</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Turma *</label>
            <select className="input-field" value={turmaId} onChange={(e) => { setTurmaId(e.target.value); setPresencas({}) }}>
              <option value="">Selecionar…</option>
              {turmas.map((t) => <option key={t.id} value={t.id}>{t.codigo} — {t.ano_letivo}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Disciplina *</label>
            <select className="input-field" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Selecionar…</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Data *</label>
            <input type="date" className="input-field" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Bimestre *</label>
            <select className="input-field" value={bimestre} onChange={(e) => setBimestre(+e.target.value)}>
              {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}º BIM</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Students attendance */}
      {turmaId && (
        <div className="table-wrap">
          <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">
              Chamada — {students.length} alunos
            </h3>
            {readyToRecord && (
              <button
                className="btn-primary btn-sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando…' : 'Salvar Frequência'}
              </button>
            )}
          </div>
          {studentsLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              Nenhum aluno encontrado nesta turma.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Aluno</th>
                    <th className="th">Matrícula</th>
                    <th className="th text-center">Presença</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const presente = presencas[s.id] ?? true
                    return (
                      <tr key={s.id} className="tr-row">
                        <td className="td font-medium">{s.nome_completo}</td>
                        <td className="td font-mono text-xs text-on-surface-variant">{s.matricula}</td>
                        <td className="td text-center">
                          <button
                            onClick={() => togglePresenca(s.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                              presente
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-error-container text-on-error-container hover:opacity-80'
                            }`}
                          >
                            {presente ? 'Presente' : 'Ausente'}
                          </button>
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

// ── Aluno view ─────────────────────────────────────────────────────────────────

function AlunoFrequency() {
  const { user } = useAuthStore()
  const alunoId = user?.referenciaId ?? ''

  const { data: frequenciaData, isLoading } = useQuery({
    queryKey: ['student-frequency', alunoId],
    queryFn: () => studentsService.frequency(alunoId).then((r) => r.data),
    enabled: !!alunoId,
  })

  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })

  const disciplineNames: Record<string, string> = useMemo(() => {
    const list = Array.isArray(disciplinasData) ? disciplinasData : disciplinasData?.data ?? []
    const map: Record<string, string> = {}
    list.forEach((d: { id: string; nome: string }) => { map[d.id] = d.nome })
    return map
  }, [disciplinasData])

  const frequencias: FrequenciaConsolidada[] = Array.isArray(frequenciaData) ? frequenciaData : frequenciaData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Minha Frequência</h1>
          <p className="page-subtitle">Acompanhe sua presença por disciplina e bimestre</p>
        </div>
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : frequencias.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">
            Nenhum registro de frequência disponível.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Disciplina</th>
                  <th className="th text-center">Bimestre</th>
                  <th className="th text-center">Total Aulas</th>
                  <th className="th text-center">Presenças</th>
                  <th className="th text-center">Faltas</th>
                  <th className="th text-center">%</th>
                  <th className="th text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                {frequencias.map((f) => (
                  <tr key={f.id} className="tr-row">
                    <td className="td font-medium">{disciplineNames[f.disciplina_id] ?? 'Disciplina'}</td>
                    <td className="td text-center">{f.bimestre}º BIM</td>
                    <td className="td text-center">{f.total_aulas}</td>
                    <td className="td text-center text-success font-medium">{f.total_presencas}</td>
                    <td className="td text-center text-error font-medium">{f.total_aulas - f.total_presencas}</td>
                    <td className="td text-center">
                      <span className={`badge ${Number(f.percentual) >= 75 ? 'badge-success' : 'badge-danger'}`}>
                        {Number(f.percentual).toFixed(1)}%
                      </span>
                    </td>
                    <td className="td text-center">
                      {f.reprovado_por_falta ? (
                        <span className="badge badge-danger">Rep. por falta</span>
                      ) : Number(f.percentual) < 75 ? (
                        <span className="badge badge-warning">Atenção</span>
                      ) : (
                        <span className="badge badge-success">Regular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
