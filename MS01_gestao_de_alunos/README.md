# MS-01 — Gestão de Alunos

> Responsável: **Raphael Estrella** · Porta 3001

---

## Visão Geral

O MS-01 é responsável pelo **ciclo de vida completo dos alunos** na instituição: cadastro, dados pessoais, controle de frequência por disciplina e bimestre, registro de overrides administrativos e histórico escolar anual.

É o microserviço mais consultado pelos outros, pois `aluno.id` é uma referência central em MS-03 (alocações), MS-04 (notas) e Auth Service (tabela `usuario`).

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição |
|---|---|
| RF-01 | Cadastro, edição e exclusão (soft) de alunos pelo Admin |
| RF-02 | Histórico acadêmico com notas, médias e turmas de anos anteriores |
| RF-03 | Registro e exibição de frequência em percentual por disciplina e bimestre |
| RF-04 | Sinalização automática de reprovação por frequência quando percentual < 75% |
| RF-05 | Override manual de reprovação por falta pelo Admin (com justificativa obrigatória) |
| RF-06 | Exibição do status final do aluno por disciplina (consumido do MS-04) |
| RF-07 | Aluno visualiza próprio perfil com notas, frequência e histórico |

---

## Banco de Dados

**Schema:** `20261_prjint5_raphaelestrella`

Este schema é compartilhado com o Auth Service (que possui a tabela `usuario`). O MS-01 usa exclusivamente as tabelas abaixo.

### Tabelas

#### `aluno`

Dados cadastrais completos do aluno.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID — chave primária |
| `matricula` | VARCHAR(30) | Número de matrícula único |
| `nome_completo` | VARCHAR(255) | Nome completo |
| `data_nascimento` | DATE | Data de nascimento |
| `email` | VARCHAR(255) | E-mail único |
| `cpf` | VARCHAR(14) | CPF único (formato: 000.000.000-00) |
| `telefone` | VARCHAR(20) | Telefone opcional |
| `end_*` | VARCHAR | Endereço completo (logradouro, número, bairro, cidade, estado, CEP) |
| `turma_atual_id` | CHAR(36) | Referência externa ao MS-03 (sem FK real) |
| `status` | ENUM | `ATIVO`, `INATIVO`, `TRANSFERIDO` |
| `created_at` / `updated_at` | TIMESTAMP | Controle de auditoria |

#### `registro_frequencia`

Lançamento individual de presença ou falta por aula.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `aluno_id` | CHAR(36) | FK → aluno |
| `disciplina_id` | CHAR(36) | Referência ao MS-03 |
| `turma_id` | CHAR(36) | Referência ao MS-03 |
| `data` | DATE | Data da aula |
| `presente` | BOOLEAN | `true` = presente, `false` = falta |
| `bimestre` | SMALLINT | 1 a 4 |
| `professor_id` | CHAR(36) | Referência ao MS-02 |
| `observacao` | TEXT | Observação opcional |

#### `frequencia_consolidada`

Totalizador recalculado automaticamente a cada lançamento de frequência.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` + `disciplina_id` + `bimestre` | — | Unique key (uma linha por combinação) |
| `total_aulas` | INT | Total de aulas registradas |
| `total_presencas` | INT | Total de presenças |
| `percentual` | DECIMAL(5,2) | `(presencas / total_aulas) * 100` |
| `reprovado_por_falta` | BOOLEAN | `true` se percentual < 75% |

#### `override_frequencia`

Registro auditável de cada override de reprovação por falta realizado pelo Admin.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` | CHAR(36) | Aluno beneficiado |
| `disciplina_id` | CHAR(36) | Disciplina em questão |
| `admin_id` | CHAR(36) | Usuário Admin que realizou o override |
| `justificativa` | TEXT | Justificativa obrigatória (mínimo 10 caracteres) |
| `data_decisao` | TIMESTAMP | Momento da decisão |
| `status_anterior` | BOOLEAN | Valor de `reprovado_por_falta` antes do override |

#### `historico_escolar`

Registro anual de situação do aluno. Torna-se somente leitura após encerramento do ano letivo.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` + `ano_letivo` | — | Unique key |
| `turma_id` | CHAR(36) | Turma do ano |
| `turma_descricao` | VARCHAR(100) | Cópia do nome da turma (denormalizado para leitura histórica) |
| `situacao` | ENUM | `APROVADO`, `REPROVADO_NOTA`, `REPROVADO_FALTA` |
| `bloqueado_edicao` | BOOLEAN | `true` após encerramento do ano |

#### `resultado_disciplina`

Detalhe por disciplina dentro do histórico escolar. Populado pelo MS-04.

| Campo | Tipo | Descrição |
|---|---|---|
| `historico_escolar_id` | CHAR(36) | FK → historico_escolar |
| `disciplina_id` | CHAR(36) | Referência ao MS-03 |
| `disciplina_nome` | VARCHAR(150) | Cópia do nome (denormalizado) |
| `media_anual` | DECIMAL(4,2) | Média anual calculada pelo MS-04 |
| `frequencia_percentual` | DECIMAL(5,2) | Frequência final |
| `status_final` | ENUM | `APROVADO`, `APROVADO_PF`, `REPROVADO_NOTA`, `REPROVADO_FALTA` |
| `fonte` | VARCHAR(50) | Sempre `'MS-4'` |

#### View `vw_frequencia_aluno`

View de leitura que junta `aluno` + `frequencia_consolidada` com o campo calculado `abaixo_minimo` (TRUE quando percentual < 75%).

---

## Arquitetura do Serviço

```
MS01_gestao_de_alunos/
├── src/
│   ├── index.ts                    ← App Fastify: CORS, JWT, plugins, rotas, error handler global
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── constants.ts                ← FREQUENCIA_MINIMA_PERCENTUAL = 75
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: instancia PrismaClient, decora fastify.prisma
│   │   └── authenticate.ts         ← FastifyPluginAsync: fastify.authenticate / fastify.requireRole
│   ├── services/
│   │   └── frequencia.service.ts   ← recalcularFrequencia() — lógica de negócio isolada (Clean Architecture)
│   └── routes/
│       ├── index.ts                ← Registra alunos, frequencias, historico
│       ├── alunos.ts               ← CRUD de alunos + /me + /count (interfaces tipadas por rota)
│       ├── frequencias.ts          ← GET/POST frequência + override (delega ao service)
│       └── historico.ts            ← GET histórico escolar
├── prisma/
│   └── schema.prisma               ← Gerado via: npx prisma db pull
├── tsconfig.json                   ← target ES2022 · module CommonJS · strict: true
├── .env                            ← Variáveis locais (não versionar)
├── .env.example                    ← Template
├── package.json
├── Dockerfile                      ← Multi-stage: builder (tsc) → production (dist/)
└── README.md
```

---

## Plugins do Fastify

### `plugins/prisma.ts`

Cria o `PrismaClient`, conecta ao banco e decora a instância Fastify com `fastify.prisma`. Ao fechar o servidor, desconecta automaticamente via hook `onClose`. Registrado com `fastify-plugin` para que o decorator fique visível em todos os escopos.

```typescript
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async () => { await prisma.$disconnect() })
}
export default fp(prismaPlugin)
```

### `plugins/authenticate.ts`

Expõe dois decorators usados como `preHandler` nas rotas:

- **`fastify.authenticate`** — verifica o JWT e injeta `request.user` (tipado como `JWTPayload`). Retorna 401 se inválido.
- **`fastify.requireRole(roles[])`** — verifica o JWT e valida se `request.user.role` está na lista. Retorna 403 se não autorizado.

Exemplo de uso:
```typescript
fastify.get<{ Querystring: AlunoQuery }>('/students', {
  preHandler: fastify.requireRole(['ADMIN'])
}, handler)

fastify.get('/students/me', {
  preHandler: fastify.authenticate  // qualquer role autenticada
}, handler)
```

### `services/frequencia.service.ts`

Isola a lógica de negócio de frequência fora das rotas (**Clean Architecture / SRP**):

```typescript
export async function recalcularFrequencia(
  prisma: PrismaClient,
  alunoId: string,
  disciplinaId: string,
  bimestre: number
): Promise<void>
```

Utiliza `FREQUENCIA_MINIMA_PERCENTUAL` de `constants.ts` em vez do magic number `75`.

---

## Endpoints da API

Base path: `/v1/students`

### `GET /v1/students`

Lista todos os alunos com paginação.

**Role:** ADMIN

**Query params:**
- `page` (padrão: 1)
- `limit` (padrão: 20)
- `status` — filtrar por `ATIVO`, `INATIVO` ou `TRANSFERIDO`

**Resposta 200:**
```json
{
  "data": [ { ...aluno } ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

### `GET /v1/students/count`

Retorna total de alunos. Usado pelo dashboard do Admin.

**Role:** ADMIN

**Resposta 200:** `{ "total": 45 }`

---

### `GET /v1/students/me`

Retorna perfil completo do aluno autenticado.

**Role:** ALUNO (exclusivo)

**Resposta 200:** `{ ...aluno }`

---

### `GET /v1/students/:id`

Retorna dados de um aluno específico.

**Role:** ADMIN (qualquer aluno) · ALUNO (apenas o próprio)

**Erros:**
- `403` — Aluno tentando acessar dados de outro aluno
- `404` — Aluno não encontrado

---

### `POST /v1/students`

Cadastra novo aluno.

**Role:** ADMIN

**Body obrigatório:**
```json
{
  "nome_completo": "João da Silva",
  "data_nascimento": "2005-03-15",
  "email": "joao@email.com",
  "cpf": "123.456.789-00",
  "end_logradouro": "Rua das Flores",
  "end_numero": "42",
  "end_bairro": "Centro",
  "end_cidade": "Rio de Janeiro",
  "end_estado": "RJ",
  "end_cep": "20000-000"
}
```

**Campos opcionais:** `matricula` (gerado automaticamente se não informado), `telefone`, `end_complemento`, `turma_atual_id`

**Resposta 201:** `{ ...aluno_criado }`

---

### `PUT /v1/students/:id`

Edita dados de um aluno. Aceita qualquer subconjunto dos campos do body do POST.

**Role:** ADMIN

---

### `DELETE /v1/students/:id`

Desativa o aluno (soft delete — muda `status` para `INATIVO`). O registro é preservado para auditoria.

**Role:** ADMIN

**Resposta:** 204 No Content

---

### `GET /v1/students/:id/frequency`

Retorna frequência consolidada por disciplina e bimestre.

**Role:** ADMIN · PROFESSOR · ALUNO (apenas o próprio)

**Query params:**
- `bimestre` — filtrar por bimestre (1–4)
- `disciplina_id` — filtrar por disciplina

**Resposta 200:**
```json
[
  {
    "id": "uuid",
    "aluno_id": "uuid",
    "disciplina_id": "uuid",
    "bimestre": 1,
    "total_aulas": 20,
    "total_presencas": 18,
    "percentual": 90.00,
    "reprovado_por_falta": false
  }
]
```

---

### `POST /v1/students/:id/frequency`

Lança presença ou falta de uma aula. Recalcula automaticamente a `frequencia_consolidada` após o registro.

**Role:** PROFESSOR · ADMIN

**Body:**
```json
{
  "disciplina_id": "uuid",
  "turma_id": "uuid",
  "data": "2026-04-10",
  "presente": true,
  "bimestre": 1,
  "observacao": "opcional"
}
```

**Lógica de recálculo** (delegada ao `frequencia.service.ts`):
1. Busca todos os `registro_frequencia` do aluno × disciplina × bimestre
2. Calcula `percentual = (presencas / total) * 100`
3. Define `reprovado_por_falta = percentual < FREQUENCIA_MINIMA_PERCENTUAL` (constante = 75)
4. Atualiza ou cria registro em `frequencia_consolidada`

---

### `POST /v1/students/:id/frequency/override`

Reverte a reprovação por falta de um aluno após decisão de conselho de professores.

**Role:** ADMIN

**Body:**
```json
{
  "disciplina_id": "uuid",
  "justificativa": "Aprovado em conselho de professores realizado em 10/04/2026 por..."
}
```

**O que acontece:**
1. Cria registro em `override_frequencia` com o status anterior
2. Atualiza `frequencia_consolidada.reprovado_por_falta = false`

**Erros:**
- `404` — Frequência não encontrada para o aluno × disciplina

---

### `GET /v1/students/:id/history`

Retorna o histórico escolar completo com resultados por disciplina.

**Role:** ADMIN · ALUNO (apenas o próprio)

**Resposta 200:**
```json
[
  {
    "id": "uuid",
    "aluno_id": "uuid",
    "ano_letivo": 2025,
    "turma_descricao": "3º Ano A",
    "situacao": "APROVADO",
    "bloqueado_edicao": true,
    "resultado_disciplina": [
      {
        "disciplina_nome": "Matemática",
        "media_anual": 7.5,
        "frequencia_percentual": 85.00,
        "status_final": "APROVADO"
      }
    ]
  }
]
```

---

## Regras de Negócio

### Frequência (RF-03, RF-04, RF-05)

```
Frequência mínima exigida: 75%

percentual = (total_presencas / total_aulas) * 100

Se percentual < 75%:
  → frequencia_consolidada.reprovado_por_falta = true (automático)
  → Alerta visual visível para Admin e Professor

Override (RF-05):
  → Apenas Admin pode reverter
  → Justificativa obrigatória (mínimo 10 caracteres)
  → Ação registrada em override_frequencia com status anterior
  → frequencia_consolidada.reprovado_por_falta = false
```

### Soft Delete (RF-01)

O `DELETE /v1/students/:id` não exclui o registro do banco — apenas muda `status` para `INATIVO`. Isso preserva o histórico e as referências em outros MSs.

### Histórico Somente Leitura (RF-02)

Após o encerramento do ano letivo, `historico_escolar.bloqueado_edicao` é definido como `true`. A partir daí, o histórico não pode ser alterado — garantindo integridade do registro acadêmico.

---

## Comunicação com Outros Microserviços

| Direção | Serviço | Como |
|---|---|---|
| Recebe de | MS-04 (Avaliações) | MS-04 escreve em `resultado_disciplina` ao calcular status final |
| Referenciado por | Auth Service | Auth usa `aluno.turma_atual_id` para incluir no JWT |
| Referenciado por | MS-03 (Turmas) | MS-03 usa `aluno_id` em `alocacao_aluno` |

---

## Como Rodar

### Desenvolvimento

```bash
cd MS01_gestao_de_alunos
npm run dev
```

### Regenerar Prisma Client

```bash
npm run db:pull     # introspect schema do banco → schema.prisma
npm run db:generate # gera o PrismaClient a partir do schema
```

### Docker

```bash
docker build -t ms01-alunos .
docker run -p 3001:3001 --env-file .env ms01-alunos
```

---

## Variáveis de Ambiente

```env
PORT=3001
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_raphaelestrella"
JWT_SECRET="mesmo_secret_configurado_no_auth_service"
```

---

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
| `tsx` *(dev)* ^4 | Execução de `.ts` em dev com hot-reload (`tsx watch`) |
| `@types/node` *(dev)* ^22 | Tipos do Node.js |
| `prisma` *(dev)* ^6 | CLI do Prisma |
