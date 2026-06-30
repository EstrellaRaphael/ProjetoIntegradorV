# MS-04 — Avaliações e Notas

> Responsável: **Carlos Eduardo Gonçalves** · Porta 3004

---

## Visão Geral

O MS-04 é o **motor de avaliação acadêmica** do sistema. Gerencia o ciclo completo de notas: criação de avaliações (provas e trabalhos), lançamento de notas pelos professores, cálculo automático de médias bimestrais, aplicação de recuperações, cálculo de média anual e, quando necessário, lançamento e cálculo da nota de prova final.

Também é responsável pelo **status final** de cada aluno por disciplina (Aprovado, Aprovado com Prova Final, Reprovado por nota, Reprovado por falta), que é consumido pelo MS-01 para exibição no perfil e no histórico escolar.

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição |
|---|---|
| RF-23 | Avaliações organizadas em 4 bimestres por ano letivo |
| RF-24 | Professor lança e edita notas das próprias turmas/disciplinas |
| RF-25 | Cálculo automático da Média Bimestral |
| RF-26 | Suporte a recuperação: substitui o bimestre de menor valor se superior |
| RF-27 | Cálculo automático da Média Anual |
| RF-28 | Lançamento de Prova Final para alunos com Média Anual < 6.0 |
| RF-29 | Cálculo e exibição do status final por disciplina |
| RF-30 | Média mínima de aprovação configurável pelo Admin (padrão 6.0) |
| RF-31 | Registro dos valores de entrada de cada cálculo para auditoria |

---

## Banco de Dados

**Schema:** `20261_prjint5_carlossoares`

### Tabelas

#### `configuracao_avaliacao`

Registra o histórico de configurações de média mínima. Apenas um registro pode estar `ativa = true` por vez.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `media_min_aprovacao` | DECIMAL(4,2) | Média mínima (padrão: 6.00) |
| `vigente_desde` | TIMESTAMP | Quando esta configuração passou a valer |
| `alterado_por_admin_id` | CHAR(36) | UUID do Admin que fez a alteração |
| `ativa` | BOOLEAN | Apenas um registro `true` por vez |

**Regra:** Ao alterar a média mínima, a configuração anterior é marcada `ativa = false` e uma nova é criada. Isso garante rastreabilidade histórica (RF-31).

#### `avaliacao`

Define uma avaliação (prova ou trabalho) para uma turma/disciplina em um bimestre.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `titulo` | VARCHAR(120) | Nome da avaliação (ex: "Prova 1 — Álgebra") |
| `tipo` | ENUM | `PROVA`, `TRABALHO`, `RECUPERACAO`, `PROVA_FINAL` |
| `bimestre` | SMALLINT | 1 a 4 |
| `ano_letivo` | YEAR | Ano letivo |
| `disciplina_id` | CHAR(36) | Referência ao MS-03 |
| `turma_id` | CHAR(36) | Referência ao MS-03 |
| `professor_id` | CHAR(36) | Referência ao MS-02 |
| `data_aplicacao` | DATE | Data da aplicação |
| `peso_na_media` | DECIMAL(4,2) | Peso na média (padrão: 1.00) |

Constraints: `bimestre BETWEEN 1 AND 4`, `peso_na_media > 0`

#### `nota`

Nota de um aluno em uma avaliação específica.

| Campo | Tipo | Descrição |
|---|---|---|
| `avaliacao_id` + `aluno_id` | — | Unique key — uma nota por aluno por avaliação |
| `professor_id` | CHAR(36) | Professor que lançou |
| `valor` | DECIMAL(4,2) | Valor de 0.00 a 10.00 |
| `substituida` | BOOLEAN | `true` quando a recuperação substituiu esta nota |
| `lancada_em` | TIMESTAMP | Quando foi lançada |
| `editada_em` | TIMESTAMP | Última edição (NULL se nunca editada) |

#### `media_bimestral`

Armazena a média calculada automaticamente após cada lançamento de nota.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` + `disciplina_id` + `bimestre` + `ano_letivo` | — | Unique key |
| `valor_calculado` | DECIMAL(4,2) | Média do bimestre |
| `recuperacao_aplicada` | BOOLEAN | `true` se a recuperação foi aplicada |
| `calculada_em` | TIMESTAMP | Momento do último recálculo |

#### `prova_final`

Registro de alunos elegíveis e resultado da prova final.

| Campo | Tipo | Descrição |
|---|---|---|
| `aluno_id` + `disciplina_id` + `ano_letivo` | — | Unique key |
| `nota_prova_final` | DECIMAL(4,2) | NULL até a nota ser lançada |
| `media_anual` | DECIMAL(4,2) | Média anual que motivou a PF |
| `media_final` | DECIMAL(4,2) | `(media_anual + nota_pf) / 2` — NULL até ser calculada |
| `status` | ENUM | `EM_CURSO`, `APROVADO`, `APROVADO_PF`, `REPROVADO_NOTA`, `REPROVADO_FALTA` |

#### View `vw_boletim_aluno`

Junta `media_bimestral` + `prova_final`, exibindo para cada aluno × disciplina × bimestre o quadro completo de médias, nota de prova final, média final e status.

---

## Arquitetura do Serviço

```
MS04_avaliacoes_e_notas/
├── src/
│   ├── index.ts                    ← App Fastify + error handler global (Prisma P2002/P2025)
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── constants.ts                ← MEDIA_MINIMA_APROVACAO_PADRAO = 6.0
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: PrismaClient decorator
│   │   └── authenticate.ts         ← FastifyPluginAsync: authenticate / requireRole
│   ├── services/
│   │   └── nota.service.ts         ← recalcularMedia() — lógica de negócio isolada (Clean Architecture)
│   └── routes/
│       ├── index.ts                ← Registra assessments e grades
│       ├── avaliacoes.ts           ← CRUD avaliações (interfaces tipadas)
│       └── notas.ts                ← Lançamento de notas, boletim, PF, config (delega ao service)
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

### Avaliações

#### `GET /v1/assessments`

Lista avaliações com filtros opcionais.

**Role:** ADMIN (todas) · PROFESSOR (apenas as próprias)

**Query:** `turma_id`, `disciplina_id`, `bimestre`, `ano_letivo`

---

#### `POST /v1/assessments`

Cria uma avaliação.

**Role:** PROFESSOR · ADMIN

**Body:**
```json
{
  "titulo": "Prova 1 — Geometria",
  "tipo": "PROVA",
  "bimestre": 1,
  "ano_letivo": 2026,
  "disciplina_id": "uuid",
  "turma_id": "uuid",
  "data_aplicacao": "2026-03-20",
  "peso_na_media": 1.0
}
```

> O `professor_id` é extraído automaticamente do JWT quando o solicitante é PROFESSOR.

---

#### `PUT /v1/assessments/:id`

Edita uma avaliação existente.

**Role:** PROFESSOR (próprias) · ADMIN

---

### Notas e Médias

#### `GET /v1/grades/recent`

Retorna as 20 notas lançadas mais recentemente. Usado no feed do dashboard.

**Role:** ADMIN · PROFESSOR (apenas as próprias)

---

#### `POST /v1/grades`

Lança a nota de um aluno em uma avaliação.

**Role:** PROFESSOR · ADMIN

**Body:**
```json
{
  "avaliacao_id": "uuid",
  "aluno_id": "uuid",
  "valor": 8.5
}
```

**Efeito colateral — Recálculo automático da Média Bimestral** (delegado ao `nota.service.ts`):
1. Busca notas não substituídas via filtro Prisma (`where.avaliacao`) — query eficiente, sem filtragem em memória
2. Exclui avaliações do tipo `RECUPERACAO` diretamente no `where`
3. Calcula a média aritmética
4. Atualiza ou cria o registro em `media_bimestral`

---

#### `PUT /v1/grades/:id`

Edita o valor de uma nota já lançada. Recalcula a média bimestral automaticamente.

**Role:** PROFESSOR · ADMIN

**Body:** `{ "valor": 9.0 }`

---

#### `GET /v1/grades/:alunoId/boletim`

Retorna o boletim completo do aluno: médias bimestrais por disciplina e status de prova final.

**Role:** ADMIN · PROFESSOR · ALUNO (apenas o próprio)

**Resposta 200:**
```json
{
  "medias_bimestrais": [
    {
      "disciplina_id": "uuid",
      "bimestre": 1,
      "ano_letivo": 2026,
      "valor_calculado": 7.50,
      "recuperacao_aplicada": false
    }
  ],
  "provas_final": [
    {
      "disciplina_id": "uuid",
      "media_anual": 5.75,
      "nota_prova_final": 8.00,
      "media_final": 6.88,
      "status": "APROVADO_PF"
    }
  ]
}
```

---

#### `POST /v1/grades/prova-final`

Lança a nota de prova final de um aluno.

**Role:** PROFESSOR · ADMIN

**Body:**
```json
{
  "aluno_id": "uuid",
  "disciplina_id": "uuid",
  "ano_letivo": 2026,
  "nota_prova_final": 7.0
}
```

**Cálculo:**
```
Média Final = (Média Anual + Nota Prova Final) / 2
Se Média Final >= media_min_aprovacao → status = 'APROVADO_PF'
Se Média Final <  media_min_aprovacao → status = 'REPROVADO_NOTA'
```

**Erros:**
- `400` — Registro de prova final não encontrado (aluno precisa ter Média Anual < 6.0 registrada primeiro)

---

#### `GET /v1/grades/config`

Retorna a configuração de média mínima ativa.

**Role:** ADMIN

**Resposta:** `{ "media_min_aprovacao": 6.00, "vigente_desde": "..." }`

---

#### `PUT /v1/grades/config`

Altera a média mínima de aprovação.

**Role:** ADMIN

**Body:** `{ "media_min_aprovacao": 5.5 }`

**Lógica:**
1. Desativa a configuração anterior (`ativa = false`)
2. Cria nova configuração (`ativa = true`, `vigente_desde = NOW()`)

> A alteração afeta apenas períodos **futuros**. Médias já calculadas não são recalculadas.

---

## Regras de Negócio

### Ciclo Completo de Notas (RF-23 a RF-29)

```
Ano letivo = 4 bimestres
↓
Cada bimestre: N avaliações (PROVA + TRABALHO)
↓
Média Bimestral = média aritmética das notas (tipo != RECUPERACAO)
↓
Recuperação (RF-26):
  - Cria avaliação com tipo = 'RECUPERACAO'
  - Lança nota de recuperação
  - Compara com a MENOR média bimestral do ano
  - Se nota_rec > menor_media → substitui (menor_media = nota_rec)
  - Caso contrário → descartada (nota original preservada)
↓
Média Anual = (MB1 + MB2 + MB3 + MB4) / 4
↓
Se Média Anual >= media_min:
  → prova_final.status = 'APROVADO'

Se Média Anual < media_min:
  → Elegível para Prova Final
  → Criar registro em prova_final com media_anual
  → Aguardar lançamento da nota
  → Média Final = (Média Anual + Nota PF) / 2
  → Se Média Final >= media_min → 'APROVADO_PF'
  → Se Média Final <  media_min → 'REPROVADO_NOTA'
```

### Rastreabilidade dos Cálculos (RF-31)

Cada `media_bimestral` registra:
- `valor_calculado` — resultado
- `calculada_em` — momento do cálculo
- `recuperacao_aplicada` — se houve recuperação

Cada `nota` registra:
- `lancada_em` — momento do lançamento
- `editada_em` — último momento de edição
- `substituida` — se foi substituída pela recuperação

Cada `prova_final` registra:
- `media_anual` — valor de entrada
- `nota_prova_final` — valor de entrada
- `media_final` — resultado calculado

Isso garante auditoria completa e reprodutibilidade de qualquer cálculo.

### Restrição de Acesso do Professor (RF-24)

O professor só pode lançar notas em avaliações onde ele é o `professor_id`. A validação local compara `professor_id` da avaliação com o `referenciaId` do JWT; o cruzamento adicional com o vínculo professor-turma-disciplina do MS-03 está previsto como evolução futura.

---

## Comunicação com Outros Microserviços

| Direção | Serviço | Finalidade |
|---|---|---|
| Consome de (futuro) | MS-01 | Verificar vínculo aluno-turma antes de lançar nota |
| Consome de (futuro) | MS-03 | Verificar vínculo professor-turma-disciplina |
| Escreve em | MS-01 | Popula `resultado_disciplina` ao encerrar o período |

---

## Como Rodar

```bash
cd MS04_avaliacoes_e_notas
npm run dev          # tsx watch src/index.ts (hot-reload)
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

**Teste rápido:**
```bash
curl http://localhost:3004/health
# { "status": "ok", "service": "ms04-avaliacoes-e-notas" }
```

---

## Variáveis de Ambiente

```env
PORT=3004
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_carlossoares"
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
