# MS-02 — Gestão de Professores

> Responsável: **Gabriel Christino** · Porta 3002

---

## Visão Geral

O MS-02 gerencia o **ciclo de vida dos professores** na instituição: cadastro, vínculos com disciplinas e turmas, grade de horários semanal por bimestre e registro de substituições. É também a origem dos **eventos assíncronos** consumidos pelo MS-05 (Comunicação), que gera comunicados automáticos sempre que um horário é alterado.

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição |
|---|---|
| RF-08 | Cadastro, edição e exclusão de professores pelo Admin |
| RF-09 | Vínculo de professor com uma ou mais disciplinas e turmas |
| RF-10 | Grade de horários semanal por professor, organizada por dia e turno |
| RF-11 | Grade configurável por bimestre (alteração em um bimestre não afeta os anteriores encerrados) |
| RF-12 | Registro de substituições de professor na grade |
| RF-13 | Publicação de evento de alteração de horário para consumo pelo MS-05 |
| RF-14 | Professor visualiza apenas sua própria grade e turmas vinculadas |

---

## Banco de Dados

**Schema:** `20261_prjint5_gabrielsantos`

### Tabelas

#### `professor`

Dados cadastrais do professor.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID — chave primária |
| `nome_completo` | VARCHAR(255) | Nome completo |
| `email` | VARCHAR(255) | E-mail único |
| `created_at` / `updated_at` | TIMESTAMP | Auditoria |

#### `professor_disciplina`

Vínculo N:N entre professor e disciplinas que ele leciona.

| Campo | Tipo | Descrição |
|---|---|---|
| `professor_id` | CHAR(36) | FK → professor |
| `disciplina_id` | CHAR(36) | Referência externa ao MS-03 (sem FK real) |

Unique key: `(professor_id, disciplina_id)`

#### `professor_turma`

Vínculo N:N entre professor, turma e disciplina — registra em qual turma o professor leciona qual disciplina.

| Campo | Tipo | Descrição |
|---|---|---|
| `professor_id` | CHAR(36) | FK → professor |
| `turma_id` | CHAR(36) | Referência ao MS-03 |
| `disciplina_id` | CHAR(36) | Referência ao MS-03 |

Unique key: `(professor_id, turma_id, disciplina_id)`

#### `grade_horaria`

Grade semanal de um professor para uma turma/disciplina, em um bimestre específico.

| Campo | Tipo | Descrição |
|---|---|---|
| `professor_id` | CHAR(36) | FK → professor |
| `turma_id` | CHAR(36) | Referência ao MS-03 |
| `disciplina_id` | CHAR(36) | Referência ao MS-03 |
| `bimestre` | SMALLINT | 1 a 4 |
| `ano_letivo` | YEAR | Ano letivo |
| `dia_semana` | ENUM | `SEGUNDA` a `SABADO` |
| `horario_inicio` | TIME | Ex: `08:00:00` |
| `horario_fim` | TIME | Ex: `09:40:00` |

Constraint: `horario_fim > horario_inicio`
Unique key: `(professor_id, turma_id, bimestre, ano_letivo, dia_semana, horario_inicio)`

#### `substituicao_professor`

Registro de substituições temporárias. `data_fim NULL` indica substituição ativa.

| Campo | Tipo | Descrição |
|---|---|---|
| `grade_horaria_id` | CHAR(36) | FK → grade_horaria |
| `professor_substituto_id` | CHAR(36) | FK → professor (o substituto) |
| `motivo` | TEXT | Motivo da substituição |
| `data_inicio` | DATE | Início da substituição |
| `data_fim` | DATE | Fim da substituição (NULL = em aberto) |

#### `evento_grade`

**Fila assíncrona** para comunicação com o MS-05. Toda alteração na grade (criação, edição ou substituição) gera um registro aqui. O MS-05 faz polling buscando `processado = FALSE`.

| Campo | Tipo | Descrição |
|---|---|---|
| `grade_horaria_id` | CHAR(36) | FK → grade_horaria |
| `tipo` | ENUM | `CRIACAO`, `EDICAO`, `SUBSTITUICAO` |
| `descricao` | TEXT | Descrição da alteração |
| `processado` | BOOLEAN | `false` = pendente de processamento pelo MS-05 |
| `publicado_em` | TIMESTAMP | Quando o evento foi criado |
| `processado_em` | TIMESTAMP | Quando o MS-05 processou (NULL até lá) |

#### View `vw_grade_professor`

View que junta `grade_horaria` + `professor` + `substituicao_professor` e retorna o status de cada aula (`TITULAR` ou `SUBSTITUIDO`) considerando apenas substituições ativas na data atual.

---

## Arquitetura do Serviço

```
MS02_gestao_de_professores/
├── src/
│   ├── index.ts                    ← App Fastify + error handler global (Prisma P2002/P2025)
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: PrismaClient decorator
│   │   └── authenticate.ts         ← FastifyPluginAsync: fastify.authenticate / fastify.requireRole
│   └── routes/
│       ├── index.ts                ← Registra professores e grade
│       ├── professores.ts          ← CRUD + /me + /count (interfaces tipadas por rota)
│       └── grade.ts                ← Grade horária + substituições + eventos recentes
├── prisma/
│   └── schema.prisma               ← Gerado via: npx prisma db pull
├── tsconfig.json                   ← target ES2022 · module CommonJS · strict: true
├── .env / .env.example
├── package.json
├── Dockerfile                      ← Multi-stage: builder (tsc) → production (dist/)
└── README.md
```

---

## Endpoints da API

### Professores

#### `GET /v1/teachers`

Lista todos os professores com disciplinas e turmas vinculadas.

**Role:** ADMIN

**Query:** `page`, `limit`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome_completo": "Maria Oliveira",
      "email": "maria@escola.com",
      "professor_disciplina": [ { "disciplina_id": "uuid" } ],
      "professor_turma": [ { "turma_id": "uuid", "disciplina_id": "uuid" } ]
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /v1/teachers/count`

Total de professores cadastrados. Usado no dashboard do Admin.

**Role:** ADMIN — Resposta: `{ "total": 12 }`

---

#### `GET /v1/teachers/me`

Perfil completo do professor autenticado.

**Role:** PROFESSOR (exclusivo)

---

#### `GET /v1/teachers/:id`

Dados de um professor específico.

**Role:** ADMIN (qualquer) · PROFESSOR (apenas o próprio)

---

#### `POST /v1/teachers`

Cadastra novo professor.

**Role:** ADMIN

**Body:**
```json
{
  "nome_completo": "Carlos Souza",
  "email": "carlos@escola.com"
}
```

---

#### `PUT /v1/teachers/:id` / `DELETE /v1/teachers/:id`

Edita ou remove professor.

**Role:** ADMIN

> `DELETE` realiza exclusão física. Verificar se não há grade ativa antes de deletar (restrição de FK em `grade_horaria`).

---

### Grade Horária

#### `GET /v1/teachers/:id/schedule`

Retorna a grade horária de um professor, incluindo substituições ativas.

**Role:** ADMIN · PROFESSOR (apenas o próprio)

**Query:** `bimestre`, `ano_letivo`

**Resposta 200:**
```json
[
  {
    "id": "uuid",
    "dia_semana": "SEGUNDA",
    "horario_inicio": "08:00:00",
    "horario_fim": "09:40:00",
    "turma_id": "uuid",
    "disciplina_id": "uuid",
    "bimestre": 1,
    "substituicao_professor": []
  }
]
```

---

#### `POST /v1/teachers/:id/schedule`

Cria uma entrada na grade horária do professor.

**Role:** ADMIN

**Body:**
```json
{
  "turma_id": "uuid",
  "disciplina_id": "uuid",
  "bimestre": 1,
  "ano_letivo": 2026,
  "dia_semana": "SEGUNDA",
  "horario_inicio": "08:00:00",
  "horario_fim": "09:40:00"
}
```

**Efeito colateral:** Cria automaticamente um `evento_grade` com `tipo = 'CRIACAO'` para o MS-05 processar.

---

#### `PUT /v1/teachers/:id/schedule/:gradeId`

Edita uma entrada da grade.

**Role:** ADMIN

**Efeito colateral:** Cria `evento_grade` com `tipo = 'EDICAO'`.

---

#### `POST /v1/teachers/:id/schedule/:gradeId/substitution`

Registra substituição de professor em um horário específico.

**Role:** ADMIN

**Body:**
```json
{
  "professor_substituto_id": "uuid",
  "motivo": "Atestado médico",
  "data_inicio": "2026-04-14",
  "data_fim": "2026-04-18"
}
```

**Efeito colateral:** Cria `evento_grade` com `tipo = 'SUBSTITUICAO'` contendo o motivo.

---

#### `GET /v1/teachers/schedule/changes/recent`

Lista eventos de grade **não processados** pelo MS-05. Usado no feed do dashboard.

**Role:** Todos

**Resposta 200:** Lista de `evento_grade` com `grade_horaria` incluída, ordenados por `publicado_em DESC`, limite 20.

---

## Regras de Negócio

### Grade por Bimestre (RF-11)

Cada entrada da grade é específica de um bimestre. Ao criar/editar a grade do bimestre 2, por exemplo, as entradas do bimestre 1 **não são afetadas** — a unique key garante independência entre bimestres.

### Comunicação Assíncrona com MS-05 (RF-13)

```
Toda alteração na grade gera um evento_grade:

  grade_horaria criada  → tipo = 'CRIACAO'
  grade_horaria editada → tipo = 'EDICAO'
  substituição criada   → tipo = 'SUBSTITUICAO'

O MS-05 faz polling em evento_grade WHERE processado = FALSE
e para cada evento:
  1. Cria comunicado interno para a turma afetada
  2. Dispara notificação externa (e-mail / WhatsApp)
  3. Atualiza evento_grade SET processado = TRUE, processado_em = NOW()
```

Esse padrão é chamado de **Outbox Pattern** simplificado — garante que a comunicação ocorra mesmo que o MS-05 esteja temporariamente indisponível.

### Substituição Ativa (RF-12)

Na view `vw_grade_professor`, uma substituição é considerada ativa quando:
```sql
data_inicio <= CURRENT_DATE AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
```

---

## Comunicação com Outros Microserviços

| Direção | Serviço | Como |
|---|---|---|
| Publica para | MS-05 | Tabela `evento_grade` (polling assíncrono) |
| Referencia | MS-03 | `turma_id` e `disciplina_id` (sem FK real) |
| Referenciado por | Auth Service | `professor.id` como `referencia_id` no JWT |
| Referenciado por | MS-04 | `professor_id` ao verificar vínculo professor-turma |

---

## Como Rodar

```bash
cd MS02_gestao_de_professores
npm run dev          # desenvolvimento — tsx watch src/index.ts (hot-reload)
npm run build        # compila TypeScript → dist/
npm start            # produção — node dist/index.js
npm run db:pull      # introspect schema do banco → schema.prisma
npm run db:generate  # regenera PrismaClient
```

---

## Variáveis de Ambiente

```env
PORT=3002
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_gabrielsantos"
JWT_SECRET="mesmo_secret_do_auth_service"
```

## Dependências

| Pacote | Uso |
|---|---|
| `fastify` ^5 | Framework HTTP |
| `@fastify/jwt` ^9 | Verificação de JWT (emitido pelo auth-service) |
| `@fastify/cors` ^10 | CORS para o frontend |
| `@prisma/client` ^6 | Acesso ao banco de dados |
| `dotenv` ^16 | Variáveis de ambiente |
| `fastify-plugin` ^5 | Encapsulamento de plugins Fastify |
| `typescript` *(dev)* ^5 | Compilador TypeScript |
| `tsx` *(dev)* ^4 | Execução de `.ts` em dev com hot-reload |
| `@types/node` *(dev)* ^22 | Tipos do Node.js |
| `prisma` *(dev)* ^6 | CLI do Prisma |
