import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studentsService, gradesService, classesService, disciplinesService } from '../../services/api'
import type { Aluno, FrequenciaConsolidada, MediaBimestral } from '../../types'
import { formatDate, getInitials } from '../../utils/formatters'
import Field from '../../components/ui/Field'
import StatusBadge from '../../components/ui/StatusBadge'
import GradeBadge from '../../components/ui/GradeBadge'
import TabNav from '../../components/ui/TabNav'

type Tab = 'dados' | 'frequencia' | 'boletim' | 'historico'

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('dados')

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsService.getById(id!).then((r) => r.data as Aluno),
    enabled: !!id,
  })

  const { data: frequenciaData } = useQuery({
    queryKey: ['student-frequency', id],
    queryFn: () => studentsService.frequency(id!).then((r) => r.data),
    enabled: !!id && tab === 'frequencia',
  })

  const { data: boletimData } = useQuery({
    queryKey: ['boletim', id],
    queryFn: () => gradesService.boletim(id!).then((r) => r.data),
    enabled: !!id && tab === 'boletim',
  })

  const { data: historicoData } = useQuery({
    queryKey: ['student-history', id],
    queryFn: () => studentsService.history(id!).then((r) => r.data),
    enabled: !!id && tab === 'historico',
  })

  const { data: disciplinesData } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => disciplinesService.list().then((r) => r.data),
  })
  const disciplineNames: Record<string, string> = {}
  const discList = Array.isArray(disciplinesData) ? disciplinesData : disciplinesData?.data ?? []
  discList.forEach((d: { id: string; nome: string }) => { disciplineNames[d.id] = d.nome })

  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesService.list({ limit: 200 }).then((r) => r.data),
  })
  const classNames: Record<string, string> = {}
  const classList = classesData?.data ?? []
  classList.forEach((c: { id: string; codigo: string }) => { classNames[c.id] = c.codigo })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-card" />
        <div className="skeleton-block" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="card-padded text-center">
        <p className="text-on-surface-variant">Aluno não encontrado.</p>
      </div>
    )
  }

  const frequencia: FrequenciaConsolidada[] = Array.isArray(frequenciaData) ? frequenciaData : frequenciaData?.data ?? []
  const medias: MediaBimestral[] = boletimData?.medias_bimestrais ?? []
  const historico = Array.isArray(historicoData) ? historicoData : []

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados Pessoais' },
    { key: 'frequencia', label: 'Frequência' },
    { key: 'boletim', label: 'Boletim' },
    { key: 'historico', label: 'Histórico Acadêmico' },
  ]

  // Group medias by disciplina for boletim
  const byDisciplina: Record<string, MediaBimestral[]> = {}
  medias.forEach((m) => {
    if (!byDisciplina[m.disciplina_id]) byDisciplina[m.disciplina_id] = []
    byDisciplina[m.disciplina_id].push(m)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-inner">
          <div className="detail-header-info">
            <div className="avatar-lg avatar-primary">
              <span className="avatar-initials-lg">
                {getInitials(student.nome_completo)}
              </span>
            </div>
            <div>
              <h1 className="page-title">{student.nome_completo}</h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="badge badge-neutral font-mono">{student.matricula}</span>
                <StatusBadge status={student.status} />
                {student.turma_atual_id && (
                  <span className="badge badge-primary">{classNames[student.turma_atual_id] ?? 'Vinculado'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="btn-secondary btn-sm" onClick={() => navigate(`/students/${id}/edit`)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Editar Cadastro
            </button>
            <button className="btn-secondary btn-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Emitir Declaração
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabNav tabs={tabs} active={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === 'dados' && (
        <div className="card-padded space-y-6">
          <div>
            <h3 className="section-title">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Nome Completo" value={student.nome_completo} />
              <Field label="E-mail" value={student.email} />
              <Field label="CPF" value={student.cpf} />
              <Field label="Telefone" value={student.telefone} />
              <Field label="Data de Nascimento" value={formatDate(student.data_nascimento)} />
              <Field label="Status" value={student.status} />
            </div>
          </div>
          <div className="divider" />
          <div>
            <h3 className="section-title">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="CEP" value={student.end_cep} />
              <Field label="Logradouro" value={student.end_logradouro} />
              <Field label="Número" value={student.end_numero} />
              <Field label="Complemento" value={student.end_complemento} />
              <Field label="Bairro" value={student.end_bairro} />
              <Field label="Cidade" value={student.end_cidade} />
              <Field label="Estado" value={student.end_estado} />
            </div>
          </div>
          <div className="divider" />
          <div>
            <h3 className="section-title">Vínculo Escolar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Matrícula" value={student.matricula} />
              <Field label="Turma Atual" value={student.turma_atual_id ? (classNames[student.turma_atual_id] ?? 'Vinculado') : 'Sem turma'} />
              <Field label="Cadastrado em" value={formatDate(student.created_at)} />
              <Field label="Atualizado em" value={formatDate(student.updated_at)} />
            </div>
          </div>
        </div>
      )}

      {tab === 'frequencia' && (
        <div className="table-wrap">
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
                  <th className="th text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {frequencia.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="td text-center text-on-surface-variant py-6">
                      Sem registros de frequência.
                    </td>
                  </tr>
                ) : (
                  frequencia.map((f) => (
                    <tr key={f.id} className="tr-row">
                      <td className="td font-medium">{disciplineNames[f.disciplina_id] ?? 'Disciplina'}</td>
                      <td className="td text-center">{f.bimestre}º BIM</td>
                      <td className="td text-center">{f.total_aulas}</td>
                      <td className="td text-center text-success">{f.total_presencas}</td>
                      <td className="td text-center text-error">{f.total_aulas - f.total_presencas}</td>
                      <td className="td text-center">
                        <span className={`badge ${Number(f.percentual) >= 75 ? 'badge-success' : 'badge-danger'}`}>
                          {Number(f.percentual).toFixed(1)}%
                        </span>
                      </td>
                      <td className="td text-center">
                        {f.reprovado_por_falta ? (
                          <span className="badge badge-danger">Reprovado</span>
                        ) : (
                          <span className="badge badge-success">Regular</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'boletim' && (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="th">Disciplina</th>
                  <th className="th text-center">1º BIM</th>
                  <th className="th text-center">2º BIM</th>
                  <th className="th text-center">3º BIM</th>
                  <th className="th text-center">4º BIM</th>
                  <th className="th text-center">Média</th>
                  <th className="th text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(byDisciplina).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="td text-center text-on-surface-variant py-6">
                      Sem notas lançadas.
                    </td>
                  </tr>
                ) : (
                  Object.entries(byDisciplina).map(([discId, bims]) => {
                    const getB = (b: number) => bims.find((m) => m.bimestre === b)
                    const validBims = bims.filter((m) => Number(m.valor_calculado) > 0)
                    const avg = validBims.length > 0
                      ? validBims.reduce((s, m) => s + Number(m.valor_calculado), 0) / validBims.length
                      : 0
                    return (
                      <tr key={discId} className="tr-row">
                        <td className="td font-medium">{disciplineNames[discId] ?? 'Disciplina'}</td>
                        <td className="td text-center">
                          <GradeBadge value={getB(1)?.valor_calculado} />
                        </td>
                        <td className="td text-center">
                          <GradeBadge value={getB(2)?.valor_calculado} />
                        </td>
                        <td className="td text-center">
                          <GradeBadge value={getB(3)?.valor_calculado} />
                        </td>
                        <td className="td text-center">
                          <GradeBadge value={getB(4)?.valor_calculado} />
                        </td>
                        <td className="td text-center">
                          {validBims.length > 0 ? <GradeBadge value={avg} /> : <span className="text-on-surface-variant">—</span>}
                        </td>
                        <td className="td text-center">
                          {validBims.length > 0 ? (
                            avg >= 7 ? (
                              <span className="badge badge-success">Aprovado</span>
                            ) : avg >= 5 ? (
                              <span className="badge badge-warning">Rec.</span>
                            ) : (
                              <span className="badge badge-danger">Reprovado</span>
                            )
                          ) : (
                            <span className="badge badge-neutral">Em curso</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'historico' && (
        <div className="space-y-4">
          {historico.length === 0 ? (
            <div className="card-padded text-center">
              <p className="text-on-surface-variant text-sm">Sem histórico acadêmico registrado.</p>
            </div>
          ) : (
            historico.map((h: { id: string; ano_letivo: number; turma_id: string; resultado_disciplina: { disciplina_id: string; media_final: number; status: string; reprovado_por_falta: boolean }[] }) => (
              <div key={h.id} className="card-padded">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-on-surface">Ano Letivo {h.ano_letivo}</h3>
                  <span className="badge badge-neutral">{classNames[h.turma_id] ?? 'Turma'}</span>
                </div>
                <div className="space-y-2">
                  {h.resultado_disciplina.map((rd) => (
                    <div key={rd.disciplina_id} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                      <span className="text-sm text-on-surface">{disciplineNames[rd.disciplina_id] ?? 'Disciplina'}</span>
                      <div className="flex items-center gap-2">
                        <GradeBadge value={rd.media_final} />
                        <span className={`badge ${rd.status === 'APROVADO' ? 'badge-success' : 'badge-danger'}`}>
                          {rd.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
