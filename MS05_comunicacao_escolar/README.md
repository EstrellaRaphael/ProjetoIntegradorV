# MS-05 — Comunicação Escolar

> Responsável: **Otávio Brito** · Porta 3005

---

## Visão Geral

O MS-05 é responsável pela **comunicação interna da instituição** e pelas **notificações externas** enviadas aos usuários. Engloba o que originalmente seria um Notification Service separado — absorvido por decisão da equipe.

Atua como **consumidor assíncrono** dos eventos publicados pelo MS-02 (alterações de grade) via polling, gerando comunicados automáticos e disparando notificações por e-mail e opcionalmente WhatsApp.

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição | Status |
|---|---|---|
| RF-32 | Admin e Professores criam e enviam comunicados internos | ✅ |
| RF-33 | Seleção de público-alvo: Geral, Turma, Professores, Manual | ✅ |
| RF-34 | Alunos só visualizam comunicados da sua turma ou gerais | ✅ |
| RF-35 | Registro de status de leitura (lido/não lido) por destinatário | ✅ |
| RF-36 | Admin vê todos os comunicados; Professor vê os que enviou ou recebeu | ✅ |
| RF-37 | Notificações externas (e-mail obrigatório, WhatsApp opcional) ao receber comunicado | ✅ (worker implementado — envio mock; substituir por Nodemailer/Twilio) |
| RF-38 | Notificação ao adicionar evento no calendário relevante ao usuário | 🔄 (via polling de eventos MS-02; eventos de calendário MS-03 a implementar) |
| RF-39 | Comunicado automático ao detectar alteração de horário (evento do MS-02) | ✅ |
| RF-40 | Notificações externas assíncronas com retry (máx. 3 tentativas, backoff exponencial) | ✅ |

---

## Banco de Dados

**Schema:** `20261_prjint5_otaviosilva`

### Tabelas

#### `comunicado`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `remetente_id` | CHAR(36) | UUID do usuário que enviou (ou `'sistema'` para comunicados automáticos) |
| `titulo` | VARCHAR(255) | Título do comunicado |
| `conteudo` | TEXT | Corpo do comunicado |
| `publico_alvo` | VARCHAR(50) | `GERAL` \| `TURMA_ESPECIFICA` \| `TODOS_PROFESSORES` \| `LISTA_MANUAL` |
| `data_envio` | TIMESTAMP | Data/hora de criação (default: now) |

#### `destinatario_comunicado`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `comunicado_id` | CHAR(36) | FK → comunicado (CASCADE DELETE) |
| `usuario_id` | CHAR(36) | UUID do destinatário |
| `lido` | BOOLEAN | Status de leitura (default: false) |
| `data_leitura` | TIMESTAMP | Quando foi marcado como lido |

#### `notificacao_externa`

Fila de notificações externas processada pelo worker assíncrono.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID |
| `usuario_id` | CHAR(36) | UUID do destinatário |
| `mensagem` | TEXT | Conteúdo da notificação |
| `canal` | VARCHAR(20) | `EMAIL` \| `WHATSAPP` |
| `status` | VARCHAR(20) | `PENDENTE` \| `ENVIADO` \| `FALHA` |
| `tentativas` | INT | Contador de tentativas (máx. 3) |
| `data_criacao` | TIMESTAMP | Quando foi criada (default: now) |

#### `preferencia_usuario`

| Campo | Tipo | Descrição |
|---|---|---|
| `usuario_id` | CHAR(36) | PK — UUID do usuário |
| `email_obrigatorio` | BOOLEAN | Se notificação por e-mail está ativa (default: true) |
| `whatsapp_opcional` | BOOLEAN | Se notificação por WhatsApp está ativa (default: false) |

---

## Arquitetura do Serviço

```
MS05_comunicacao_escolar/
├── src/
│   ├── index.ts                    ← App Fastify + error handler global + bootstrap workers
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: PrismaClient decorator
│   │   └── authenticate.ts         ← FastifyPluginAsync: authenticate / requireRole
│   ├── routes/
│   │   ├── index.ts                ← Registra /communications e /notifications
│   │   ├── comunicados.ts          ← CRUD completo de comunicados
│   │   └── notificacoes.ts         ← Preferências de notificação
│   └── workers/
│       ├── gradeWorker.ts          ← Polling MS-02: processa evento_grade não processados
│       └── notificacaoWorker.ts    ← Processa fila notificacao_externa com retry + backoff
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

### Comunicados

#### `GET /v1/communications`

Lista comunicados filtrados por role.

**Role:** Todos (autenticados)

| Role | Retorna |
|---|---|
| ADMIN | Todos os comunicados + todos os destinatários |
| PROFESSOR | Os que enviou + os que está como destinatário |
| ALUNO | `publico_alvo = GERAL` + os que está como destinatário |

---

#### `GET /v1/communications/recent`

Feed dos 20 comunicados mais recentes visíveis ao usuário.

**Role:** Todos (autenticados)

---

#### `GET /v1/communications/unread`

Contagem de comunicados não lidos. Usado no dashboard.

**Role:** Todos (autenticados)

**Resposta:** `{ "total": 3 }`

---

#### `GET /v1/communications/:id`

Detalhes de um comunicado. Para ALUNO, valida se tem acesso.

**Role:** Todos (autenticados)

**Erros:**
- `404` — Comunicado não encontrado
- `403` — ALUNO sem acesso a este comunicado

---

#### `POST /v1/communications`

Cria e envia comunicado. Resolve destinatários conforme `publico_alvo`.

**Role:** ADMIN · PROFESSOR

**Body:**
```json
{
  "titulo": "Reunião de Pais — 2º Bimestre",
  "conteudo": "A reunião acontecerá no dia 15/05 às 19h no auditório.",
  "publico_alvo": "GERAL"
}
```

```json
{
  "titulo": "Alteração de Horário",
  "conteudo": "A aula de Física da turma 3A será às 14h na segunda-feira.",
  "publico_alvo": "TURMA_ESPECIFICA",
  "turma_id": "uuid-da-turma"
}
```

```json
{
  "titulo": "Reunião Pedagógica",
  "conteudo": "Todos os professores devem comparecer.",
  "publico_alvo": "TODOS_PROFESSORES"
}
```

```json
{
  "titulo": "Convocação Individual",
  "conteudo": "Comparecer à secretaria.",
  "publico_alvo": "LISTA_MANUAL",
  "destinatarios": ["uuid-1", "uuid-2"]
}
```

**Valores de `publico_alvo`:**

| Valor | Comportamento |
|---|---|
| `GERAL` | Visível a todos; sem destinatários explícitos |
| `TURMA_ESPECIFICA` | Resolve alunos da turma via MS-03 (`GET /v1/classes/:turma_id`) |
| `TODOS_PROFESSORES` | Resolve todos os professores via MS-02 (`GET /v1/teachers`) |
| `LISTA_MANUAL` | Usa a lista `destinatarios` fornecida no body |

**Efeitos colaterais:**
1. Cria registros em `destinatario_comunicado` para cada destinatário
2. Cria registros em `notificacao_externa` com `status = 'PENDENTE'` (processados pelo worker)

---

#### `PUT /v1/communications/:id/read`

Marca comunicado como lido para o usuário autenticado.

**Role:** Todos (autenticados)

**Erros:** `404` — Usuário não é destinatário deste comunicado

---

### Notificações

#### `GET /v1/notifications/preferences`

Retorna as preferências do usuário autenticado. Se não existir, cria com os valores padrão (`email_obrigatorio: true`, `whatsapp_opcional: false`).

**Role:** Todos (autenticados)

**Resposta:**
```json
{
  "usuario_id": "uuid",
  "email_obrigatorio": true,
  "whatsapp_opcional": false
}
```

---

#### `PUT /v1/notifications/preferences`

Atualiza as preferências do usuário.

**Role:** Todos (autenticados)

**Body:**
```json
{
  "email_obrigatorio": true,
  "whatsapp_opcional": true
}
```

---

## Workers Assíncronos

### Grade Worker (`gradeWorker.ts`)

Faz polling no MS-02 a cada **30 segundos** buscando eventos de grade não processados.

```
Poll: GET http://MS02_URL/v1/teachers/schedule/changes/recent
↓
Para cada evento não processado:
  1. Cria comunicado automático (remetente_id = 'sistema')
  2. Resolve alunos da turma via MS-03
  3. Cria destinatario_comunicado para cada aluno
  4. Cria notificacao_externa (status = 'PENDENTE')
  5. Marca evento como processado (rastreamento local em memória)
```

> O rastreamento local reseta ao reiniciar o serviço. Para rastreamento persistente, a tabela `evento_grade` do MS-02 precisaria de um endpoint `PATCH /:id/processed`.

### Notificação Worker (`notificacaoWorker.ts`)

Processa a fila `notificacao_externa` a cada **30 segundos** com retry e backoff exponencial (RF-40).

```
Poll: SELECT * FROM notificacao_externa WHERE status = 'PENDENTE' LIMIT 50
↓
Para cada notificação:
  Se tentativas > 0 → verificar backoff:
    1ª retry: aguarda 1 min
    2ª retry: aguarda 5 min
    3ª retry: aguarda 15 min
  ↓
  Enviar (EMAIL ou WHATSAPP)
  ↓
  Sucesso → status = 'ENVIADO'
  Falha   → tentativas += 1
             Se tentativas >= 3 → status = 'FALHA'
             Senão              → status = 'PENDENTE' (retry com backoff)
```

---

## Comunicação com Outros Microserviços

### Consome (assíncrono — polling)

| Origem | Endpoint | Evento | Ação |
|---|---|---|---|
| MS-02 | `GET /v1/teachers/schedule/changes/recent` | Evento de grade não processado | Cria comunicado de alteração de horário + notifica alunos da turma |

### Consome (síncrono — REST)

| Serviço | Endpoint | Finalidade |
|---|---|---|
| MS-02 | `GET /v1/teachers?limit=1000` | Resolver IDs de todos os professores para `TODOS_PROFESSORES` |
| MS-03 | `GET /v1/classes/:turma_id` | Resolver alunos de uma turma para `TURMA_ESPECIFICA` |

---

## Como Rodar

```bash
cd MS05_comunicacao_escolar
npm run dev      # tsx watch src/index.ts (hot-reload)
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

**Teste rápido:**
```bash
curl http://localhost:3005/health
# { "status": "ok", "service": "ms05-comunicacao-escolar" }
```

---

## Variáveis de Ambiente

```env
PORT=3005
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_otaviosilva"
JWT_SECRET="mesmo_secret_do_auth_service"

# URLs dos outros microserviços
MS01_URL="http://localhost:3001"
MS02_URL="http://localhost:3002"
MS03_URL="http://localhost:3003"

# E-mail (descomentado e configurado quando disponível)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="seu@email.com"
# SMTP_PASS="senha_de_app"

# WhatsApp / Twilio (opcional)
# TWILIO_ACCOUNT_SID=""
# TWILIO_AUTH_TOKEN=""
# TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
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
| `tsx` *(dev)* ^4 | Execução de `.ts` em dev com hot-reload |
| `@types/node` *(dev)* ^22 | Tipos do Node.js |
| `prisma` *(dev)* ^6 | CLI do Prisma |
