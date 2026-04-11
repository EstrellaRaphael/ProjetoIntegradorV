# MS-05 — Comunicação Escolar

> Responsável: **Otávio Brito** · Porta 3005

---

## Status

> **EM DESENVOLVIMENTO** — Aguardando entrega do script SQL e diagrama de classes.
>
> O scaffolding (package.json, .env, Dockerfile, Prisma schema introspectado, estrutura de pastas) já está criado. As rotas serão implementadas após a definição final do schema.

---

## Visão Geral

O MS-05 é responsável pela **comunicação interna da instituição** e pelas **notificações externas** enviadas aos usuários. Engloba o que originalmente seria um Notification Service separado — absorvido por decisão da equipe.

Atua como **consumidor assíncrono** dos eventos publicados pelo MS-02 (alterações de grade) e MS-03 (eventos de calendário), gerando comunicados automáticos e disparando notificações por e-mail e opcionalmente WhatsApp.

---

## Responsabilidades (Requisitos Funcionais)

| ID | Descrição |
|---|---|
| RF-32 | Admin e Professores criam e enviam comunicados internos |
| RF-33 | Seleção de público-alvo: Geral, Turma, Professores, Manual |
| RF-34 | Alunos só visualizam comunicados da sua turma ou gerais |
| RF-35 | Registro de status de leitura (lido/não lido) por destinatário |
| RF-36 | Admin vê todos os comunicados; Professor vê os que enviou ou recebeu |
| RF-37 | Notificações externas (e-mail obrigatório, WhatsApp opcional) ao receber comunicado |
| RF-38 | Notificação ao adicionar evento no calendário relevante ao usuário |
| RF-39 | Comunicado automático ao detectar alteração de horário (evento do MS-02) |
| RF-40 | Notificações externas assíncronas com retry (máx. 3 tentativas, backoff exponencial) |

---

## Banco de Dados

**Schema:** `20261_prjint5_otaviosilva`

O schema foi introspectado via `prisma db pull` e contém as seguintes tabelas:

### Tabelas (schema introspectado)

| Tabela | Descrição |
|---|---|
| `comunicado` | Comunicados criados pelos remetentes |
| `destinatario_comunicado` | Controle de entrega e leitura por destinatário |
| `notificacao_externa` | Fila de notificações externas (e-mail / WhatsApp) |
| `preferencia_usuario` | Preferências de canal por usuário |

> A estrutura detalhada de cada tabela (campos, tipos, constraints) será documentada após recebimento do script SQL definitivo do Otávio.

### Campos principais identificados

**`comunicado`:** `id`, `remetente_id`, `titulo`, `conteudo`, `publico_alvo`, `data_envio`

**`destinatario_comunicado`:** `id`, `comunicado_id`, `usuario_id`, `lido`, `data_leitura`

**`notificacao_externa`:** `id`, `usuario_id`, `mensagem`, `canal`, `status`, `tentativas`, `data_criacao`

**`preferencia_usuario`:** `usuario_id`, `email_obrigatorio`, `whatsapp_opcional`

---

## Arquitetura do Serviço

```
MS05_comunicacao_escolar/
├── src/
│   ├── index.ts                    ← App Fastify + error handler global
│   ├── types.ts                    ← JWTPayload, Role, module augmentation Fastify + @fastify/jwt
│   ├── plugins/
│   │   ├── prisma.ts               ← FastifyPluginAsync: PrismaClient decorator
│   │   └── authenticate.ts         ← FastifyPluginAsync: authenticate / requireRole
│   └── routes/
│       ├── index.ts
│       └── comunicados.ts          ← Stub — aguardando schema definitivo (Otávio)
├── prisma/
│   └── schema.prisma               ← Gerado via: npx prisma db pull
├── tsconfig.json                   ← target ES2022 · module CommonJS · strict: true
├── .env / .env.example
├── package.json
├── Dockerfile                      ← Multi-stage: builder (tsc) → production (dist/)
└── README.md
```

---

## Endpoints Planejados

Os endpoints abaixo são planejados com base nos requisitos funcionais. A implementação ocorrerá após a definição do schema.

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/communications` | Todos | Lista comunicados (filtrado por role) |
| GET | `/v1/communications/recent` | Todos | Feed de comunicados recentes |
| GET | `/v1/communications/unread` | Todos | Contagem de não lidos (dashboard) |
| GET | `/v1/communications/:id` | Todos | Detalhes de um comunicado |
| POST | `/v1/communications` | ADMIN, PROFESSOR | Cria e envia comunicado |
| PUT | `/v1/communications/:id/read` | Todos | Marca como lido |
| GET | `/v1/notifications/preferences` | Todos | Preferências de notificação |
| PUT | `/v1/notifications/preferences` | Todos | Atualiza preferências |

---

## Comunicação com Outros Microserviços

### Consome (assíncrono — polling)

| Origem | Tabela | Evento | Ação |
|---|---|---|---|
| MS-02 | `evento_grade` | `processado = false` | Cria comunicado de alteração de horário + notifica alunos da turma |
| MS-03 | *(a definir)* | Evento de calendário | Notifica usuários afetados |

### Consome (síncrono — REST)

| Serviço | Endpoint | Finalidade |
|---|---|---|
| MS-01 | `GET /v1/students?turma_id=X` | Resolver destinatários de uma turma |
| MS-03 | `GET /v1/classes/:id/students` | Resolver alunos de uma turma |

---

## Fluxo de Notificação Assíncrona (RF-40)

```
1. Evento gerado (alteração de grade, novo comunicado, evento de calendário)
2. Registro criado em notificacao_externa com status = 'PENDENTE'
3. Worker/polling processa notificações pendentes:
   a. Envia por e-mail (obrigatório) e/ou WhatsApp (se preferencia_usuario.whatsapp_opcional = true)
   b. Sucesso → status = 'ENVIADO'
   c. Falha  → tentativas += 1
              Se tentativas < 3  → status = 'PENDENTE' (retry com backoff exponencial)
              Se tentativas >= 3 → status = 'FALHA' (registrado para análise)
4. Backoff: 1ª retry: 1min · 2ª retry: 5min · 3ª retry: 15min (a implementar)
```

---

## Pendências

- [ ] Receber `script_db_ms05.sql` do Otávio Brito
- [ ] Receber `diagrama_de_classes_ms05` do Otávio Brito
- [ ] Confirmar estrutura das tabelas (especialmente `comunicado` e `destinatario_comunicado`)
- [ ] Implementar rotas CRUD de comunicados
- [ ] Implementar worker de polling para `evento_grade` do MS-02
- [ ] Implementar envio de e-mail (Nodemailer ou similar)
- [ ] Implementar envio WhatsApp (Twilio ou API não-oficial — a definir com o grupo)
- [ ] Implementar retry com backoff exponencial

---

## Como Rodar (scaffolding atual)

```bash
cd MS05_comunicacao_escolar
npm run dev      # tsx watch src/index.ts (hot-reload)
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

O serviço sobe na porta 3005 com apenas o endpoint `/health` e uma rota stub em `/v1/communications`.

---

## Variáveis de Ambiente

```env
PORT=3005
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_otaviosilva"
JWT_SECRET="mesmo_secret_do_auth_service"
MS01_URL="http://localhost:3001"
MS03_URL="http://localhost:3003"
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
