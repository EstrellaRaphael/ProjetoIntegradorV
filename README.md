# Sistema de Gestão Escolar — Projeto Integrador V

> Arquitetura de Microserviços · Node.js + Fastify · Prisma ORM · MySQL · React

---

## Grupo 1 — SENAC RJ · 2026/1 · Noite

| Integrante | Microserviço |
|---|---|
| Raphael Estrella | MS-01 Gestão de Alunos |
| Gabriel Christino | MS-02 Gestão de Professores |
| André Sousa | MS-03 Turmas e Disciplinas |
| Carlos Eduardo Gonçalves | MS-04 Avaliações e Notas + API Gateway (bônus) |
| Otávio Brito | MS-05 Comunicação Escolar |

---

## Visão Geral

O Sistema de Gestão Escolar é uma aplicação web desenvolvida sob arquitetura de **microserviços**, voltada ao gerenciamento completo de uma instituição de ensino. O sistema contempla cadastro de alunos e professores, organização de turmas e disciplinas, lançamento de notas e frequência, além de comunicação interna com notificações externas.

A autenticação é centralizada em um **Auth Service** compartilhado que emite tokens JWT consumidos por todos os microserviços. Um **API Gateway** (entrega bônus) atua como ponto único de entrada, roteando requisições e aplicando rate limiting.

---

## Arquitetura

```
                        ┌─────────────────────┐
                        │     React Frontend   │
                        │     (porta 5173)     │
                        └──────────┬──────────┘
                                   │ HTTPS
                        ┌──────────▼──────────┐
                        │     API Gateway      │  ← bônus (porta 3010)
                        │  rate limit · logs   │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │          ┌─────────▼──────┐             │
              │          │  Auth Service  │             │
              │          │   porta 3000   │             │
              │          └────────────────┘             │
              │                                         │
   ┌──────────▼──┐  ┌───────────┐  ┌───────────┐  ┌───▼───────┐  ┌───────────┐
   │    MS-01    │  │   MS-02   │  │   MS-03   │  │   MS-04   │  │   MS-05   │
   │   Alunos    │  │Professores│  │  Turmas/  │  │ Avaliações│  │Comunicação│
   │  porta 3001 │  │porta 3002 │  │Disciplinas│  │ porta 3004│  │ porta 3005│
   └──────────┬──┘  └─────┬─────┘  │porta 3003 │  └─────┬─────┘  └─────┬─────┘
              │            │        └─────┬─────┘        │              │
   ┌──────────▼──┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
   │  raphaele   │  │  gabriel  │  │  andrebbe │  │  carloss  │  │  otavios  │
   │  estrella   │  │  santos   │  │  zerra    │  │  oares    │  │  ilva     │
   │   (MySQL)   │  │  (MySQL)  │  │  (MySQL)  │  │  (MySQL)  │  │  (MySQL)  │
   └─────────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

### Comunicação entre Microserviços

**Síncrona (REST):**
- API Gateway → Auth Service: validação de JWT em cada requisição
- MS-04 → MS-01: verifica vínculo aluno-turma antes de lançar nota
- MS-04 → MS-03: verifica vínculo professor-turma-disciplina
- MS-05 → MS-01 / MS-03: resolve destinatários ao criar comunicado

**Assíncrona (polling via tabela de eventos no banco):**
- MS-02 registra `evento_grade` → MS-05 consome e gera comunicado automático
- MS-03 registra evento de calendário → MS-05 dispara notificação

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js v22 |
| Framework HTTP | Fastify v5 |
| ORM | Prisma v6 |
| Banco de dados | MySQL 8 (MariaDB) |
| Autenticação | JWT (access 15min + refresh 7d) · bcryptjs |
| Frontend | React + Vite · TanStack Query · React Router v7 · Tailwind CSS · Zustand |
| Containerização | Docker · Docker Compose |

---

## Estrutura do Projeto

```
ProjetoIntegradorV/
├── README.md                        ← este arquivo
├── script_auth.sql                  ← RODAR ANTES de usar o auth-service
├── docker-compose.yml               ← sobe todos os serviços
├── gestao_escolar_requisitos.docx   ← documento de requisitos v3.0
├── database.txt                     ← credenciais do banco remoto
│
├── auth-service/                    ← Auth compartilhado (porta 3000)
│   ├── src/
│   │   ├── index.js
│   │   ├── plugins/
│   │   │   └── prisma.js
│   │   └── routes/
│   │       └── auth.js
│   ├── prisma/schema.prisma
│   ├── .env / .env.example
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── MS01_gestao_de_alunos/           ← porta 3001
│   ├── src/
│   │   ├── index.js
│   │   ├── plugins/
│   │   │   ├── prisma.js
│   │   │   └── authenticate.js
│   │   └── routes/
│   │       ├── alunos.js
│   │       ├── frequencias.js
│   │       └── historico.js
│   ├── prisma/schema.prisma
│   ├── .env / .env.example
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── MS02_gestao_de_professores/      ← porta 3002
├── MS03_turmas_e_disciplinas/       ← porta 3003
├── MS04_avaliacoes_e_notas/         ← porta 3004
├── MS05_comunicacao_escolar/        ← porta 3005 (aguardando schema)
└── frontend/                        ← React SPA (porta 5173)
```

---

## Banco de Dados

O banco é hospedado remotamente no servidor da instituição. Cada microserviço possui seu próprio schema (padrão *database-per-service*), todos acessíveis com as mesmas credenciais.

| Serviço | Schema MySQL |
|---|---|
| Auth + MS-01 | `20261_prjint5_raphaelestrella` |
| MS-02 | `20261_prjint5_gabrielsantos` |
| MS-03 | `20261_prjint5_andrebezerra` |
| MS-04 | `20261_prjint5_carlossoares` |
| MS-05 | `20261_prjint5_otaviosilva` |

**Servidor:** `edumysql.acesso.rj.senac.br:3306`

> As credenciais completas estão em `database.txt`. Não versionar este arquivo em repositório público.

### Permissões

O usuário de banco possui `SELECT`, `INSERT`, `UPDATE`, `DELETE` — **sem DDL** (`CREATE TABLE` bloqueado). As tabelas foram criadas pelo professor/administrador da instituição a partir dos scripts SQL de cada microserviço. O Prisma é utilizado em modo **read/write apenas**, com schemas gerados via `prisma db pull`.

---

## Setup Inicial

### Pré-requisitos

- Node.js v22+
- npm v10+
- Acesso à rede da instituição (ou VPN) para conectar ao banco remoto

### 1. Criar tabela de usuários (auth)

A tabela `usuario` não estava no schema original — execute o script uma única vez via HeidiSQL ou qualquer cliente MySQL conectado ao schema `20261_prjint5_raphaelestrella`:

```sql
-- arquivo: script_auth.sql
-- Execute via HeidiSQL conectado em raphaelestrella
```

O script cria a tabela `usuario` e insere um admin padrão:
- **Email:** `admin@escola.com`
- **Senha:** `Admin@123`

> Altere a senha do admin após o primeiro login.

### 2. Instalar dependências de cada serviço

```bash
# Executar em cada pasta de microserviço
cd auth-service && npm install
cd ../MS01_gestao_de_alunos && npm install
cd ../MS02_gestao_de_professores && npm install
cd ../MS03_turmas_e_disciplinas && npm install
cd ../MS04_avaliacoes_e_notas && npm install
cd ../MS05_comunicacao_escolar && npm install
cd ../frontend && npm install
```

### 3. Regenerar cliente Prisma (se necessário)

```bash
cd MS01_gestao_de_alunos && npm run db:generate
# repetir para cada MS
```

---

## Como Rodar

### Desenvolvimento (cada serviço individualmente)

```bash
cd auth-service           && npm run dev   # porta 3000
cd MS01_gestao_de_alunos  && npm run dev   # porta 3001
cd MS02_gestao_de_professores && npm run dev # porta 3002
cd MS03_turmas_e_disciplinas  && npm run dev # porta 3003
cd MS04_avaliacoes_e_notas    && npm run dev # porta 3004
cd MS05_comunicacao_escolar   && npm run dev # porta 3005
cd frontend                   && npm run dev # porta 5173
```

### Docker Compose

```bash
# Na raiz do projeto
docker-compose up

# Apenas um serviço específico
docker-compose up ms01-alunos
```

### Health check de cada serviço

```bash
curl http://localhost:3000/health  # auth
curl http://localhost:3001/health  # MS-01
curl http://localhost:3002/health  # MS-02
curl http://localhost:3003/health  # MS-03
curl http://localhost:3004/health  # MS-04
curl http://localhost:3005/health  # MS-05
```

---

## Autenticação e Autorização

### Fluxo de Login

```
1. POST /v1/auth/login  { email, senha }
2. Auth Service valida credenciais na tabela usuario
3. Retorna { accessToken, refreshToken, role }
4. Frontend armazena tokens (Zustand + localStorage)
5. Todas as requisições seguintes: Authorization: Bearer <accessToken>
6. Access token expira em 15 min → usar POST /v1/auth/refresh
```

### Payload do JWT

```json
{
  "sub": "uuid-do-usuario",
  "role": "ADMIN | PROFESSOR | ALUNO",
  "referenciaId": "uuid-do-aluno-ou-professor",
  "turmaId": "uuid-da-turma-atual (apenas para ALUNO)",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Perfis e Permissões

| Perfil | Pode escrever | Pode ler |
|---|---|---|
| **ADMIN** | CRUD completo em todos os módulos | Tudo |
| **PROFESSOR** | Notas e faltas das próprias turmas; eventos no calendário; comunicados para suas turmas | Dados de alunos de suas turmas; horário próprio; calendário; comunicados enviados/recebidos |
| **ALUNO** | Nada (somente leitura) | Próprias notas e faltas; horário da turma; calendário; comunicados da turma ou gerais |

---

## Endpoints por Serviço

### Auth Service (porta 3000)

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/v1/auth/login` | — | Login com email e senha |
| POST | `/v1/auth/refresh` | — | Renova access token com refresh token |
| GET | `/v1/auth/validate` | Bearer token | Valida token (usado pelos MSs e Gateway) |
| GET | `/health` | — | Health check |

### MS-01 Gestão de Alunos (porta 3001)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/students` | ADMIN | Lista todos os alunos (paginado) |
| GET | `/v1/students/count` | ADMIN | Total de alunos (dashboard) |
| GET | `/v1/students/me` | ALUNO | Perfil do próprio aluno |
| GET | `/v1/students/:id` | ADMIN, ALUNO* | Dados de um aluno |
| POST | `/v1/students` | ADMIN | Cadastra novo aluno |
| PUT | `/v1/students/:id` | ADMIN | Edita aluno |
| DELETE | `/v1/students/:id` | ADMIN | Desativa aluno (soft delete) |
| GET | `/v1/students/:id/frequency` | ADMIN, PROFESSOR, ALUNO* | Frequência por disciplina/bimestre |
| POST | `/v1/students/:id/frequency` | PROFESSOR, ADMIN | Lança presença/falta |
| POST | `/v1/students/:id/frequency/override` | ADMIN | Override de reprovação por falta |
| GET | `/v1/students/:id/history` | ADMIN, ALUNO* | Histórico escolar |

*Aluno acessa apenas os próprios dados.

### MS-02 Gestão de Professores (porta 3002)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/teachers` | ADMIN | Lista todos os professores |
| GET | `/v1/teachers/count` | ADMIN | Total de professores (dashboard) |
| GET | `/v1/teachers/me` | PROFESSOR | Perfil do próprio professor |
| GET | `/v1/teachers/:id` | ADMIN, PROFESSOR* | Dados de um professor |
| POST | `/v1/teachers` | ADMIN | Cadastra professor |
| PUT | `/v1/teachers/:id` | ADMIN | Edita professor |
| DELETE | `/v1/teachers/:id` | ADMIN | Remove professor |
| GET | `/v1/teachers/:id/schedule` | ADMIN, PROFESSOR* | Grade horária |
| POST | `/v1/teachers/:id/schedule` | ADMIN | Cria entrada na grade |
| PUT | `/v1/teachers/:id/schedule/:gradeId` | ADMIN | Edita entrada na grade |
| POST | `/v1/teachers/:id/schedule/:gradeId/substitution` | ADMIN | Registra substituição |
| GET | `/v1/teachers/schedule/changes/recent` | ADMIN, PROFESSOR, ALUNO | Alterações recentes de horário |

### MS-03 Turmas e Disciplinas (porta 3003)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/classes` | Todos | Lista turmas |
| GET | `/v1/classes/active/count` | ADMIN | Total de turmas ativas (dashboard) |
| GET | `/v1/classes/:id` | Todos | Dados de uma turma |
| POST | `/v1/classes` | ADMIN | Cria turma |
| PUT | `/v1/classes/:id` | ADMIN | Edita turma |
| DELETE | `/v1/classes/:id` | ADMIN | Remove turma |
| POST | `/v1/classes/:id/students` | ADMIN | Associa aluno à turma |
| DELETE | `/v1/classes/:id/students/:alunoId` | ADMIN | Remove aluno da turma |
| GET | `/v1/disciplines` | Todos | Lista disciplinas |
| GET | `/v1/disciplines/:id` | Todos | Dados de uma disciplina |
| POST | `/v1/disciplines` | ADMIN | Cria disciplina |
| PUT | `/v1/disciplines/:id` | ADMIN | Edita disciplina |
| DELETE | `/v1/disciplines/:id` | ADMIN | Remove disciplina |
| GET | `/v1/calendar/events` | Todos | Lista eventos do calendário |
| POST | `/v1/calendar/events` | ADMIN | Cria evento geral |
| PUT | `/v1/calendar/events/:id` | ADMIN | Edita evento |
| DELETE | `/v1/calendar/events/:id` | ADMIN | Remove evento |

### MS-04 Avaliações e Notas (porta 3004)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/assessments` | ADMIN, PROFESSOR | Lista avaliações |
| GET | `/v1/assessments/:id` | Todos | Dados de uma avaliação |
| POST | `/v1/assessments` | PROFESSOR, ADMIN | Cria avaliação |
| PUT | `/v1/assessments/:id` | PROFESSOR, ADMIN | Edita avaliação |
| GET | `/v1/grades/recent` | ADMIN, PROFESSOR | Notas recentes (dashboard) |
| GET | `/v1/grades/config` | ADMIN | Configuração de média mínima |
| PUT | `/v1/grades/config` | ADMIN | Altera média mínima de aprovação |
| POST | `/v1/grades` | PROFESSOR, ADMIN | Lança nota |
| PUT | `/v1/grades/:id` | PROFESSOR, ADMIN | Edita nota |
| GET | `/v1/grades/:alunoId/boletim` | ADMIN, PROFESSOR, ALUNO* | Boletim do aluno |
| POST | `/v1/grades/prova-final` | PROFESSOR, ADMIN | Lança nota de prova final |

### MS-05 Comunicação Escolar (porta 3005)

> Em desenvolvimento — aguardando script SQL e diagrama de classes (Otávio Brito).

---

## Regras de Negócio

### Ciclo de Notas (MS-04)

```
Ano letivo = 4 bimestres
Cada bimestre: N avaliações (provas + trabalhos)

Média Bimestral = média aritmética das notas do bimestre

Recuperação: substitui o bimestre de MENOR valor — apenas se a nota da
             recuperação for SUPERIOR. Caso contrário é descartada.

Média Anual = média das 4 Médias Bimestrais (após recuperações)

Se Média Anual >= 6.0  →  APROVADO
Se Média Anual <  6.0  →  direito à Prova Final
  Média Final = (Média Anual + Nota Prova Final) / 2
  Se Média Final >= 6.0  →  APROVADO_PF
  Se Média Final <  6.0  →  REPROVADO_NOTA

A média mínima (padrão 6.0) é configurável pelo Admin e afeta
apenas períodos futuros.
```

### Frequência (MS-01)

```
Frequência mínima exigida: 75%

Se percentual < 75%  →  sinalizado como REPROVADO_FALTA (automático)

Admin pode realizar override após conselho de professores,
com justificativa obrigatória registrada em override_frequencia.
```

### Grade de Horários e Comunicados Automáticos (MS-02 → MS-05)

```
Toda alteração na grade (criação, edição, substituição) gera um
registro na tabela evento_grade com processado = FALSE.

O MS-05 faz polling dessa tabela e para cada evento não processado:
  1. Cria comunicado interno informando a alteração
  2. Dispara notificação por e-mail (e opcionalmente WhatsApp)
  3. Marca o evento como processado = TRUE
```

### Calendário e Notificações (MS-03 → MS-05)

```
Eventos gerais (feriados, início/fim de bimestre): criados pelo Admin,
visíveis a todos.

Eventos de turma (provas, trabalhos): criados pelo Professor,
visíveis apenas aos alunos da turma e ao Admin.

Adição de evento relevante → MS-05 envia notificação ao público afetado.
```

---

## Variáveis de Ambiente

Cada serviço possui um `.env` (ignorado pelo git) e um `.env.example` como referência.

| Variável | Descrição | Onde usar |
|---|---|---|
| `PORT` | Porta do serviço | Todos |
| `DATABASE_URL` | Connection string MySQL | Todos |
| `JWT_SECRET` | Segredo do access token (deve ser igual em todos os MSs) | Todos |
| `JWT_REFRESH_SECRET` | Segredo do refresh token | Apenas auth-service |
| `JWT_EXPIRES_IN` | Expiração do access token (padrão: `15m`) | Apenas auth-service |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token (padrão: `7d`) | Apenas auth-service |
| `MS01_URL` | URL do MS-01 | MS-05 |
| `MS03_URL` | URL do MS-03 | MS-05 |

> O `JWT_SECRET` deve ser **idêntico** em todos os serviços, pois cada um verifica independentemente os tokens emitidos pelo auth-service.

---

## Requisitos Não Funcionais Atendidos

| ID | Categoria | Status |
|---|---|---|
| RNF-02 | Senhas com bcrypt (custo 10) | Implementado no auth-service |
| RNF-04 | JWT com access 15min + refresh 7d | Implementado |
| RNF-10 | Deploy independente por serviço | Dockerfile por serviço |
| RNF-12 | Serviços stateless (sessão via JWT) | Implementado |
| RNF-14 | Erros em português sem detalhes técnicos | Implementado nas rotas |
| RNF-16 | Cálculos de nota auditáveis | Campos lancada_em / editada_em / valores de entrada gravados |
| RNF-17 | Containerizável com Docker | Dockerfile + docker-compose.yml |

---

## Versão do Documento

**Sistema de Gestão Escolar v3.0** · Projeto Integrador V · SENAC RJ 2026/1 · Noite
