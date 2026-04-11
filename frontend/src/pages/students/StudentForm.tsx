import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import axios from 'axios'
import { studentsService, classesService } from '../../services/api'
import type { Aluno, AlunoStatus, Turma } from '../../types'

interface FormData {
  nome_completo: string
  email: string
  cpf: string
  telefone: string
  data_nascimento: string
  end_cep: string
  end_logradouro: string
  end_numero: string
  end_complemento: string
  end_bairro: string
  end_cidade: string
  end_estado: string
  turma_atual_id: string
  status: AlunoStatus
}

const empty: FormData = {
  nome_completo: '',
  email: '',
  cpf: '',
  telefone: '',
  data_nascimento: '',
  end_cep: '',
  end_logradouro: '',
  end_numero: '',
  end_complemento: '',
  end_bairro: '',
  end_cidade: '',
  end_estado: '',
  turma_atual_id: '',
  status: 'ATIVO',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(empty)
  const [cepLoading, setCepLoading] = useState(false)

  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsService.getById(id!).then((r) => r.data as Aluno),
    enabled: isEdit,
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.list().then((r) => r.data),
  })

  const turmas: Turma[] = classesData?.data ?? []

  useEffect(() => {
    if (student) {
      setForm({
        nome_completo: student.nome_completo,
        email: student.email,
        cpf: student.cpf,
        telefone: student.telefone ?? '',
        data_nascimento: student.data_nascimento?.split('T')[0] ?? '',
        end_cep: student.end_cep,
        end_logradouro: student.end_logradouro,
        end_numero: student.end_numero,
        end_complemento: student.end_complemento ?? '',
        end_bairro: student.end_bairro,
        end_cidade: student.end_cidade,
        end_estado: student.end_estado,
        turma_atual_id: student.turma_atual_id ?? '',
        status: student.status,
      })
    }
  }, [student])

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => studentsService.create(data),
    onSuccess: () => {
      toast.success('Aluno cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/students')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao cadastrar aluno.'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => studentsService.update(id!, data),
    onSuccess: () => {
      toast.success('Aluno atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      navigate(`/students/${id}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao atualizar aluno.'
      toast.error(msg)
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleCepSearch() {
    const cep = form.end_cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos.')
      return
    }
    setCepLoading(true)
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)
      if (data.erro) {
        toast.error('CEP não encontrado.')
      } else {
        setForm((prev) => ({
          ...prev,
          end_logradouro: data.logradouro ?? prev.end_logradouro,
          end_bairro: data.bairro ?? prev.end_bairro,
          end_cidade: data.localidade ?? prev.end_cidade,
          end_estado: data.uf ?? prev.end_estado,
        }))
        toast.success('Endereço preenchido!')
      }
    } catch {
      toast.error('Erro ao buscar CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = { ...form }
    if (!payload.turma_atual_id) delete payload.turma_atual_id
    if (!payload.telefone) delete payload.telefone
    if (!payload.end_complemento) delete payload.end_complemento

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Editar Aluno' : 'Cadastrar Aluno'}</h1>
          <p className="page-subtitle">{isEdit ? 'Atualize os dados do aluno' : 'Preencha os dados para matricular um novo aluno'}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="card-padded">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Dados Pessoais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nome Completo *">
                <input name="nome_completo" className="input-field" value={form.nome_completo} onChange={handleChange} required />
              </Field>
            </div>
            <Field label="E-mail *">
              <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} required />
            </Field>
            <Field label="CPF *">
              <input name="cpf" className="input-field" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
            </Field>
            <Field label="Telefone">
              <input name="telefone" className="input-field" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Data de Nascimento *">
              <input name="data_nascimento" type="date" className="input-field" value={form.data_nascimento} onChange={handleChange} required />
            </Field>
          </div>
        </div>

        {/* Endereço */}
        <div className="card-padded">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Endereço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">CEP *</label>
              <div className="flex gap-2">
                <input
                  name="end_cep"
                  className="input-field"
                  value={form.end_cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  required
                />
                <button
                  type="button"
                  className="btn-secondary flex-shrink-0"
                  onClick={handleCepSearch}
                  disabled={cepLoading}
                >
                  {cepLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : 'Buscar'}
                </button>
              </div>
            </div>
            <Field label="Logradouro *">
              <input name="end_logradouro" className="input-field" value={form.end_logradouro} onChange={handleChange} required />
            </Field>
            <Field label="Número *">
              <input name="end_numero" className="input-field" value={form.end_numero} onChange={handleChange} required />
            </Field>
            <Field label="Complemento">
              <input name="end_complemento" className="input-field" value={form.end_complemento} onChange={handleChange} placeholder="Apto, bloco…" />
            </Field>
            <Field label="Bairro *">
              <input name="end_bairro" className="input-field" value={form.end_bairro} onChange={handleChange} required />
            </Field>
            <Field label="Cidade *">
              <input name="end_cidade" className="input-field" value={form.end_cidade} onChange={handleChange} required />
            </Field>
            <Field label="Estado *">
              <input name="end_estado" className="input-field" value={form.end_estado} onChange={handleChange} placeholder="SP" maxLength={2} required />
            </Field>
          </div>
        </div>

        {/* Vínculo escolar */}
        <div className="card-padded">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Vínculo Escolar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Turma">
              <select name="turma_atual_id" className="input-field" value={form.turma_atual_id} onChange={handleChange}>
                <option value="">Sem turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.codigo} — {t.ano_letivo}</option>
                ))}
              </select>
            </Field>
            <Field label="Status *">
              <select name="status" className="input-field" value={form.status} onChange={handleChange} required>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="TRANCADO">Trancado</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando…
              </>
            ) : isEdit ? 'Salvar Alterações' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  )
}
