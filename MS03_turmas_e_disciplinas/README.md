# MS-03 — Turmas e Disciplinas

> Responsável: **André Sousa** · Porta 3003

---

## Visão Geral

O MS-03 é o **núcleo organizacional** do sistema. Ele define as disciplinas oferecidas pela instituição, as turmas de cada ano letivo, as alocações de alunos e professores nessas turmas, e o calendário escolar com eventos gerais e de turma.

É o microserviço mais referenciado: `turma_id` e `disciplina_id` aparecem como referências externas em MS-01, MS-02 e MS-04.

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição |
|---|---|
| RF-15 | Criar, editar e encerrar turmas pelo Admin |
| RF-16 | Associar e desassociar alunos e professores às turmas |
| RF-17 | Listar disciplinas de cada turma com seus professores responsáveis |
| RF-18 | Manter calendário escolar com eventos gerais e eventos de turma |
| RF-19 | Admin gerencia eventos do calendário geral |
| RF-20 | Professores adicionam eventos acadêmicos nas turmas em que lecionam |
| RF-21 | Aluno visualiza calendário com eventos gerais e eventos da sua turma |
| RF-22 | Exibir ao aluno a grade de horários semanal da sua turma |

---

## Banco de Dados

**Schema:** `20261_prjint5_andrebezerra`

### Tabelas

#### `disciplina`

Catálogo de disciplinas oferecidas pela instituição.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID — chave primária |
| `nome` | VARCHAR(150) | Nome da disciplina (ex: "Matemática") |
| `carga_horaria` | SMALLINT | Carga horária anual em horas |
| `created_at` / `updated_at` | TIMESTAMP | Auditoria |

Constraint: `carga_horaria > 0`

#### `calendario_escolar`

Eventos do calendário da instituição. Cada evento tem uma data e um tipo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `data` | DATE | Data do evento |
| `descricao` | VARCHAR(255) | Descrição do evento |
| `tipo` | ENUM | `AULA`, `FERIADO`, `RECESSO`, `EVENTO` |

Unique key: `(data, tipo)` — garante que não existam dois eventos do mesmo tipo no mesmo dia.

#### `turma`

Turmas do ano letivo. Cada turma tem um turno e está associada a um calendário escolar.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `codigo` | VARCHAR(50) | Código da turma (ex: "3A-2026") |
| `ano_letivo` | YEAR | Ano letivo |
| `turno` | ENUM | `MANHA`, `TARDE`, `NOITE` |
| `calendario_id` | CHAR(36) | FK → calendario_escolar |

Unique key: `(codigo, ano_letivo)`

#### `alocacao_professor`

Vínculo entre professor, disciplina e turma. Registra quem leciona o quê e para quem.

| Campo | Tipo | Descrição |
|---|---|---|
| `professor_id` | CHAR(36) | Referência ao MS-02 (sem FK real) |
| `disciplina_id` | CHAR(36) | FK → disciplina |
| `turma_id` | CHAR(36) | FK → turma |
| `data_vinculacao` | DATE | Data em que o vínculo foi criado |

Unique key: `(professor_id, disciplina_id, turma_id)`

#### `alocacao_aluno`

Vínculo entre aluno e turma. Um aluno só pode ter um vínculo ativo por vez.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` | CHAR(36) | Referência ao MS-01 (sem FK real) |
| `turma_id` | CHAR(36) | FK → turma |
| `data_matricula` | DATE | Data da matrícula na turma |

Unique key: `(aluno_id, turma_id)`

#### View `vw_turma_completa`

Junta `turma` + `alocacao_professor` + `disciplina`, retornando para cada turma todas as disciplinas com nome e carga horária. Útil para a tela de detalhes da turma.

---

## Arquitetura do Serviço

```
MS03_turmas_e_disciplinas/
├── src/
│   ├── index.ts                    ← App Fastify + error handler global (Prisma P2002/P2025)
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: PrismaClient decorator
│   │   └── authenticate.ts         ← FastifyPluginAsync: authenticate / requireRole
│   └── routes/
│       ├── index.ts                ← Registra turmas, disciplinas, calendario
│       ├── turmas.ts               ← CRUD turmas + alocações de alunos (interfaces tipadas)
│       ├── disciplinas.ts          ← CRUD disciplinas
│       └── calendario.ts           ← CRUD eventos do calendário
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

### Turmas

#### `GET /v1/classes`

Lista todas as turmas com alocações de professores e alunos.

**Role:** Todos (autenticados)

**Query:** `page`, `limit`, `ano_letivo`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "codigo": "3A-2026",
      "ano_letivo": 2026,
      "turno": "NOITE",
      "calendario_id": "uuid",
      "alocacao_professor": [...],
      "alocacao_aluno": [...]
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /v1/classes/active/count`

Conta turmas do ano letivo atual. Usado no dashboard do Admin.

**Role:** ADMIN — Resposta: `{ "total": 8 }`

---

#### `GET /v1/classes/:id`

Retorna dados completos de uma turma.

**Role:** Todos (autenticados)

---

#### `POST /v1/classes`

Cria nova turma.

**Role:** ADMIN

**Body:**
```json
{
  "codigo": "1B-2026",
  "ano_letivo": 2026,
  "turno": "MANHA",
  "calendario_id": "uuid-do-calendario"
}
```

---

#### `PUT /v1/classes/:id` / `DELETE /v1/classes/:id`

Edita ou remove turma.

**Role:** ADMIN

> `DELETE` é exclusão física. Use apenas para turmas sem alunos ou professores alocados.

---

#### `POST /v1/classes/:id/students`

Associa um aluno a uma turma.

**Role:** ADMIN

**Body:**
```json
{
  "aluno_id": "uuid",
  "data_matricula": "2026-02-03"
}
```

**Regra:** Um aluno só pode ter um vínculo ativo por vez (unique key). Para trocar de turma, primeiro remova a alocação anterior.

---

#### `DELETE /v1/classes/:id/students/:alunoId`

Remove a alocação de um aluno em uma turma.

**Role:** ADMIN

---

### Disciplinas

#### `GET /v1/disciplines`

Lista todas as disciplinas em ordem alfabética.

**Role:** Todos (autenticados)

---

#### `GET /v1/disciplines/:id`

Dados de uma disciplina.

**Role:** Todos (autenticados)

---

#### `POST /v1/disciplines`

Cria disciplina.

**Role:** ADMIN

**Body:**
```json
{
  "nome": "Física",
  "carga_horaria": 80
}
```

---

#### `PUT /v1/disciplines/:id` / `DELETE /v1/disciplines/:id`

Edita ou remove disciplina.

**Role:** ADMIN

> `DELETE` falha se existirem alocações de professor vinculadas (FK constraint).

---

### Calendário

#### `GET /v1/calendar/events`

Lista eventos do calendário.

**Role:** Todos (autenticados)

**Query:**
- `tipo` — filtrar por `AULA`, `FERIADO`, `RECESSO`, `EVENTO`
- `data_inicio` — filtrar a partir de uma data
- `data_fim` — filtrar até uma data

**Resposta 200:**
```json
[
  {
    "id": "uuid",
    "data": "2026-04-21",
    "descricao": "Tiradentes — Feriado Nacional",
    "tipo": "FERIADO"
  }
]
```

---

#### `POST /v1/calendar/events`

Cria evento no calendário geral. Visível a todos.

**Role:** ADMIN

**Body:**
```json
{
  "data": "2026-06-15",
  "descricao": "Início do 2º Bimestre",
  "tipo": "EVENTO"
}
```

---

#### `PUT /v1/calendar/events/:id` / `DELETE /v1/calendar/events/:id`

Edita ou remove evento.

**Role:** ADMIN

---

## Regras de Negócio

### Uma Turma por Aluno (RF-16)

A unique key `(aluno_id, turma_id)` em `alocacao_aluno` impede a duplicação, mas não garante que um aluno esteja em apenas uma turma ativa simultaneamente. Essa validação deve ser feita na camada de aplicação antes de criar a alocação: verificar se já existe um `alocacao_aluno` ativo para o `aluno_id`.

### Professor em Múltiplas Turmas (RF-16)

Um professor pode lecionar disciplinas diferentes para turmas diferentes. Não há restrição de unicidade por professor — apenas a combinação `(professor_id, disciplina_id, turma_id)` é única.

### Visibilidade do Calendário por Perfil (RF-21)

O filtro de visibilidade é responsabilidade do frontend:
- **Todos** veem eventos do tipo `FERIADO`, `RECESSO` e eventos gerais
- **Alunos** também veem eventos de calendário da sua turma
- A filtragem por `turma_id` deve ser feita pelo frontend usando o `turmaId` presente no JWT

### Integração com MS-05 (RF-18)

Quando um evento acadêmico é criado (prova, trabalho), o MS-05 deve ser notificado para disparar notificações. A implementação atual retorna os eventos via API — o MS-05 pode implementar polling ou o frontend pode encadear a chamada.

---

## Comunicação com Outros Microserviços

| Direção | Serviço | Como |
|---|---|---|
| Referenciado por | MS-01 | `turma_atual_id` no aluno |
| Referenciado por | MS-02 | `turma_id` e `disciplina_id` na grade |
| Referenciado por | MS-04 | `turma_id` e `disciplina_id` nas avaliações |
| Referenciado por | MS-05 | `turma_id` para resolver destinatários de comunicados |

---

## Como Rodar

```bash
cd MS03_turmas_e_disciplinas
npm run dev          # tsx watch src/index.ts (hot-reload)
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

**Teste rápido:**
```bash
curl http://localhost:3003/health
# { "status": "ok", "service": "ms03-turmas-e-disciplinas" }
```

---

## Variáveis de Ambiente

```env
PORT=3003
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_andrebezerra"
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
