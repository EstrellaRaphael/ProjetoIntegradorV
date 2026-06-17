// ── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'PROFESSOR' | 'ALUNO'

export interface JWTPayload {
  sub: string
  role: Role
  referenciaId: string | null
  turmaId: string | null
  iat?: number
  exp?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  role: Role
}

// ── Aluno ───────────────────────────────────────────────────────────────────

export type AlunoStatus = 'ATIVO' | 'INATIVO' | 'TRANCADO'

export interface Aluno {
  id: string
  matricula: string
  nome_completo: string
  email: string
  cpf: string
  telefone?: string
  data_nascimento: string
  end_logradouro: string
  end_numero: string
  end_complemento?: string
  end_bairro: string
  end_cidade: string
  end_estado: string
  end_cep: string
  turma_atual_id?: string
  status: AlunoStatus
  created_at: string
  updated_at: string
}

export interface AlunoListResponse {
  data: Aluno[]
  total: number
  page: number
  limit: number
}

// ── Professor ───────────────────────────────────────────────────────────────

export interface Professor {
  id: string
  nome_completo: string
  email: string
  created_at: string
  updated_at: string
  professor_disciplina?: { disciplina_id: string }[]
  professor_turma?: { turma_id: string }[]
}

export interface ProfessorListResponse {
  data: Professor[]
  total: number
  page: number
  limit: number
}

// ── Turma ───────────────────────────────────────────────────────────────────

export type TurmaStatus = 'MANHA' | 'TARDE' | 'NOITE'

export interface AlocacaoAluno {
  id: string
  aluno_id: string
  turma_id: string
  data_matricula: string
}

export interface Turma {
  id: string
  codigo: string
  ano_letivo: number
  turno: TurmaStatus
  calendario_id?: string
  alocacao_aluno?: AlocacaoAluno[]
  created_at: string
  updated_at: string
}

export interface TurmaListResponse {
  data: Turma[]
  total: number
  page: number
  limit: number
}

// ── Disciplina ──────────────────────────────────────────────────────────────

export interface Disciplina {
  id: string
  nome: string
  carga_horaria: number
  created_at: string
  updated_at: string
}

// ── Calendário ──────────────────────────────────────────────────────────────

export type CalendarioTipo = 'AULA' | 'FERIADO' | 'RECESSO' | 'EVENTO'

export interface CalendarioEvento {
  id: string
  data: string
  descricao: string
  tipo: CalendarioTipo
}

// ── Grade Horária ───────────────────────────────────────────────────────────

export type DiaSemana = 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'

export interface GradeHoraria {
  id: string
  professor_id: string
  turma_id: string
  disciplina_id: string
  bimestre: number
  ano_letivo: number
  dia_semana: DiaSemana
  horario_inicio: string
  horario_fim: string
}

export interface EventoGrade {
  id: string
  grade_horaria_id: string
  tipo: 'CRIACAO' | 'EDICAO' | 'SUBSTITUICAO'
  descricao: string
  processado: boolean
  publicado_em: string
  grade_horaria?: GradeHoraria
}

// ── Avaliação ───────────────────────────────────────────────────────────────

export type AvaliacaoTipo = 'PROVA' | 'TRABALHO' | 'RECUPERACAO' | 'PROVA_FINAL'

export interface Avaliacao {
  id: string
  titulo: string
  tipo: AvaliacaoTipo
  bimestre: number
  ano_letivo: number
  disciplina_id: string
  turma_id: string
  professor_id: string
  data_aplicacao: string
  peso_na_media: number
}

// ── Nota ────────────────────────────────────────────────────────────────────

export interface Nota {
  id: string
  avaliacao_id: string
  aluno_id: string
  professor_id: string
  valor: number
  substituida: boolean
  lancada_em: string
  editada_em?: string
  avaliacao?: Avaliacao
}

export interface MediaBimestral {
  id: string
  aluno_id: string
  disciplina_id: string
  bimestre: number
  ano_letivo: number
  valor_calculado: string | number
  recuperacao_aplicada: boolean
}

export interface ProvaFinal {
  id: string
  aluno_id: string
  disciplina_id: string
  ano_letivo: number
  media_anual: string | number
  nota_prova_final?: string | number
  media_final?: string | number
  status: 'EM_CURSO' | 'APROVADO_PF' | 'REPROVADO_NOTA'
}

export interface Boletim {
  aluno: Aluno
  medias_bimestrais: MediaBimestral[]
  provas_final: ProvaFinal[]
}

// ── Frequência ──────────────────────────────────────────────────────────────

export interface FrequenciaConsolidada {
  id: string
  aluno_id: string
  disciplina_id: string
  bimestre: number
  total_aulas: number
  total_presencas: number
  percentual: string | number
  reprovado_por_falta: boolean
}

// ── Comunicado ──────────────────────────────────────────────────────────────

export type TipoPublico = 'GERAL' | 'TURMA_ESPECIFICA' | 'TODOS_PROFESSORES' | 'LISTA_MANUAL'

export interface DestinatarioComunicado {
  id: string
  comunicado_id: string
  usuario_id: string
  lido: boolean
  data_leitura?: string
}

export interface Comunicado {
  id: string
  remetente_id: string
  titulo: string
  conteudo: string
  publico_alvo: TipoPublico
  data_envio: string
  destinatario_comunicado: DestinatarioComunicado[]
}

// ── Preferências ────────────────────────────────────────────────────────────

export interface PreferenciaUsuario {
  usuario_id: string
  email_obrigatorio: boolean
  whatsapp_opcional: boolean
}

// ── Config ──────────────────────────────────────────────────────────────────

export interface GradeConfig {
  id?: string
  media_min_aprovacao: number
  vigente_desde?: string
  ativa?: boolean
}

// ── Paginação ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ── Histórico ────────────────────────────────────────────────────────────────

export interface ResultadoDisciplina {
  disciplina_id: string
  media_final: number
  status: string
  reprovado_por_falta: boolean
}

export interface HistoricoEscolar {
  id: string
  aluno_id: string
  ano_letivo: number
  turma_id: string
  resultado_disciplina: ResultadoDisciplina[]
}
