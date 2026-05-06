# Guia de Testes — MS05 Comunicação Escolar
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Passo a passo completo para instalar, configurar e validar todas as funcionalidades do MS05, mesmo sem experiência prévia com APIs.

---

## Sumário

1. [O que é o MS05?](#1-o-que-é-o-ms05)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Como Obter o Token JWT](#6-como-obter-o-token-jwt)
7. [Comunicados — Criação e Listagem](#7-comunicados--criação-e-listagem)
8. [Marcar Comunicado como Lido](#8-marcar-comunicado-como-lido)
9. [Comunicados Não Lidos](#9-comunicados-não-lidos)
10. [Preferências de Notificação](#10-preferências-de-notificação)
11. [Workers em Background](#11-workers-em-background)
12. [Testando com Perfis Diferentes](#12-testando-com-perfis-diferentes)
13. [Health Check](#13-health-check)
14. [Erros Comuns e Soluções](#14-erros-comuns-e-soluções)
15. [Referência Rápida](#15-referência-rápida)

---

## 1. O que é o MS05?

O MS05 é o microserviço de **Comunicação Escolar**. Ele é responsável por:

- **Comunicados** — criação e distribuição de avisos para públicos distintos (geral, turma específica, todos os professores, lista manual)
- **Marcação de leitura** — registra quando cada destinatário leu um comunicado
- **Preferências de notificação** — cada usuário pode configurar se quer receber notificações por e-mail e/ou WhatsApp
- **Workers automáticos** — dois processos em background que rodam enquanto o serviço está de pé:
  - **gradeWorker**: a cada 30 segundos, busca eventos de alteração de grade do MS02 e cria comunicados automáticos para os alunos afetados
  - **notificacaoWorker**: a cada 30 segundos, processa a fila de notificações externas (e-mail, WhatsApp) com até 3 tentativas e backoff exponencial

O serviço roda na **porta 3005** e expõe suas rotas sob os prefixos `/v1/communications` e `/v1/notifications`.

---

## 2. Pré-requisitos

- **Node.js 22+** — `node --version`
- **npm** — `npm --version`
- **Auth Service rodando** na porta 3000 (necessário para obter o token JWT)
- **curl** ou Postman
- *Opcional para os workers:* MS02 na porta 3002 e MS03 na porta 3003

---

## 3. Configuração do Ambiente

### 3.1 Criar o arquivo .env

```bash
cp .env.example .env
```

Preencha com:

```env
PORT=3005
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_otaviosilva"
JWT_SECRET="change_this_secret_in_production_auth"
MS01_URL="http://localhost:3001"
MS02_URL="http://localhost:3002"
MS03_URL="http://localhost:3003"
```

> O `JWT_SECRET` deve ser idêntico ao do auth-service.
>
> As variáveis `MS02_URL` e `MS03_URL` são usadas pelos workers. Se os outros serviços não estiverem rodando, o MS05 ainda funciona para criar e listar comunicados — apenas os workers registrarão erros de conexão nos logs.

---

## 4. Instalação e Preparação

```bash
npm install
npx prisma generate
```

---

## 5. Iniciando o Serviço

```bash
npm run dev
```

**Saída esperada:**
```
{"msg":"Server listening at http://0.0.0.0:3005"}
```

Você também verá mensagens dos workers iniciando:
```
[gradeWorker] Iniciado — verificando eventos a cada 30s
[notificacaoWorker] Iniciado — processando fila a cada 30s
```

---

## 6. Como Obter o Token JWT

Faça login no auth-service (porta 3000) e guarde o token:

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}'
```

> Guarde o `accessToken` retornado. Nas requisições abaixo, substitua `SEU_TOKEN_AQUI` por ele.

---

## 7. Comunicados — Criação e Listagem

### 7.1 Criar comunicado para todos (GERAL)

**Rota:** `POST /v1/communications` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Reunião de pais e mestres",
    "conteudo": "Informamos que a reunião será realizada no dia 20/05 às 19h.",
    "publico_alvo": "GERAL"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-comunicado",
  "remetente_id": "uuid-do-admin",
  "titulo": "Reunião de pais e mestres",
  "conteudo": "Informamos que a reunião será realizada no dia 20/05 às 19h.",
  "publico_alvo": "GERAL",
  "data_envio": "2026-05-06T12:00:00.000Z"
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_COMUNICADO`.
>
> Comunicados do tipo `GERAL` não criam destinatários individuais — todos os usuários autenticados podem vê-los ao listar comunicados.

---

### 7.2 Criar comunicado para todos os professores

**Rota:** `POST /v1/communications` | **Role:** ADMIN

> **Pré-requisito:** MS02 deve estar rodando para que o serviço resolva a lista de professores.

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Entrega de diários",
    "conteudo": "Lembramos que o prazo para entrega dos diários de classe é dia 30/05.",
    "publico_alvo": "TODOS_PROFESSORES"
  }'
```

**Resposta esperada (201):** Mesmo formato acima, com `"publico_alvo": "TODOS_PROFESSORES"`.

> **Efeito colateral:** O serviço consulta o MS02 para obter a lista de todos os professores e cria registros de `destinatario_comunicado` e `notificacao_externa` (canal EMAIL, status PENDENTE) para cada um. O `notificacaoWorker` irá processar esses registros.

---

### 7.3 Criar comunicado para uma turma específica

**Rota:** `POST /v1/communications` | **Role:** ADMIN ou PROFESSOR

> **Pré-requisito:** MS03 deve estar rodando e o `ID_TURMA` precisa existir.

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Aviso de prova",
    "conteudo": "Haverá prova de Matemática na próxima segunda-feira.",
    "publico_alvo": "TURMA_ESPECIFICA",
    "turma_id": "ID_TURMA"
  }'
```

**Resposta esperada (201):** Mesmo formato, com `"publico_alvo": "TURMA_ESPECIFICA"`.

> **Efeito colateral:** O serviço consulta o MS03 para obter os alunos da turma e cria registros de destinatário para cada um.

---

### 7.4 Criar comunicado para lista manual de usuários

**Rota:** `POST /v1/communications` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Convocação especial",
    "conteudo": "Você foi selecionado para participar do conselho de classe.",
    "publico_alvo": "LISTA_MANUAL",
    "destinatarios": ["ID_USUARIO_1", "ID_USUARIO_2"]
  }'
```

> O campo `destinatarios` deve conter **IDs de usuário** (do auth-service), não IDs de alunos ou professores.

---

### 7.5 Listar comunicados

**Rota:** `GET /v1/communications` | **Role:** qualquer autenticado

```bash
curl -s http://localhost:3005/v1/communications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
[
  {
    "id": "uuid-do-comunicado",
    "remetente_id": "uuid-do-admin",
    "titulo": "Reunião de pais e mestres",
    "conteudo": "Informamos que a reunião será realizada no dia 20/05 às 19h.",
    "publico_alvo": "GERAL",
    "data_envio": "2026-05-06T12:00:00.000Z",
    "destinatario_comunicado": []
  }
]
```

> **Filtragem por role:**
> - **ADMIN** vê todos os comunicados
> - **PROFESSOR** vê os que enviou + os em que é destinatário
> - **ALUNO** vê os do tipo GERAL + os em que é destinatário explícito

---

### 7.6 Listar comunicados recentes

**Rota:** `GET /v1/communications/recent` | **Role:** qualquer autenticado

```bash
curl -s http://localhost:3005/v1/communications/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** Os 20 comunicados mais recentes visíveis para o usuário autenticado (mesmas regras de filtragem por role).

---

### 7.7 Buscar comunicado por ID

**Rota:** `GET /v1/communications/:id` | **Role:** qualquer autenticado

```bash
curl -s http://localhost:3005/v1/communications/ID_COMUNICADO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** Objeto do comunicado com array `destinatario_comunicado`.

**O que testar:**
- ✅ ADMIN consegue acessar qualquer comunicado
- ✅ PROFESSOR só acessa comunicados que enviou ou que é destinatário (403 para os demais)
- ✅ ALUNO só acessa GERAL ou em que é destinatário (403 para os demais)

---

## 8. Marcar Comunicado como Lido

**Rota:** `PUT /v1/communications/:id/read` | **Role:** qualquer autenticado

> Para marcar como lido, o usuário autenticado precisa ser um **destinatário** do comunicado. Comunicados do tipo GERAL não criam registros de destinatário individuais, portanto esta rota retornará 404 para eles.
>
> Use o ID de um comunicado para turma específica ou lista manual, e use o token do usuário que é destinatário.

```bash
curl -s -X PUT http://localhost:3005/v1/communications/ID_COMUNICADO/read \
  -H "Authorization: Bearer TOKEN_DO_DESTINATARIO"
```

**Resposta esperada (200):**
```json
{ "success": true }
```

**Se já estava lido:**
```json
{ "success": true, "message": "Já estava marcado como lido" }
```

**Se o usuário não é destinatário (404):**
```json
{ "error": "Registro não encontrado" }
```

---

## 9. Comunicados Não Lidos

**Rota:** `GET /v1/communications/unread` | **Role:** qualquer autenticado

Retorna a contagem de comunicados que ainda não foram marcados como lidos pelo usuário atual.

```bash
curl -s http://localhost:3005/v1/communications/unread \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{ "total": 3 }
```

**O que validar:**
- ✅ Após marcar um comunicado como lido (seção 8), o `total` deve diminuir

---

## 10. Preferências de Notificação

### 10.1 Consultar preferências

**Rota:** `GET /v1/notifications/preferences` | **Role:** qualquer autenticado

```bash
curl -s http://localhost:3005/v1/notifications/preferences \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "usuario_id": "uuid-do-usuario",
  "email_obrigatorio": true,
  "whatsapp_opcional": false
}
```

> Se as preferências ainda não existem no banco, elas são criadas automaticamente com os valores padrão (`email_obrigatorio: true`, `whatsapp_opcional: false`).

---

### 10.2 Atualizar preferências

**Rota:** `PUT /v1/notifications/preferences` | **Role:** qualquer autenticado

```bash
curl -s -X PUT http://localhost:3005/v1/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"email_obrigatorio": true, "whatsapp_opcional": true}'
```

**Resposta esperada (200):**
```json
{
  "usuario_id": "uuid-do-usuario",
  "email_obrigatorio": true,
  "whatsapp_opcional": true
}
```

**O que testar:**
- ✅ Consultar preferências (GET) → valores padrão aparecem
- ✅ Atualizar (PUT) → valores refletidos na resposta
- ✅ Consultar novamente → valores persistidos

---

## 11. Workers em Background

Os workers rodam automaticamente quando o serviço está de pé. Você não precisa chamá-los diretamente — basta observar os logs.

### 11.1 gradeWorker — comunicados automáticos de grade

O `gradeWorker` consulta o MS02 a cada **30 segundos** buscando eventos de alteração de grade ainda não processados.

**Para testar:**

1. Certifique-se de que o MS02 e o MS03 estão rodando
2. No MS02, crie uma entrada na grade horária de um professor (seção 8.1 do GUIA_DE_TESTES do MS02)
3. Aguarde até 30 segundos
4. Observe os logs do MS05:
   ```
   [gradeWorker] Processando evento: CRIACAO — grade_horaria_id: uuid...
   [gradeWorker] Comunicado automático criado: uuid...
   ```
5. Liste os comunicados no MS05 — deve aparecer um comunicado automático do tipo `TURMA_ESPECIFICA` com remetente `sistema`

**Tipos de evento processados:**

| Tipo no MS02 | Título do comunicado criado |
|---|---|
| `CRIACAO` | Novo Horário Adicionado |
| `EDICAO` | Horário Alterado |
| `SUBSTITUICAO` | Substituição de Professor |

---

### 11.2 notificacaoWorker — fila de notificações externas

O `notificacaoWorker` processa registros da tabela `notificacao_externa` a cada **30 segundos**.

**Comportamento:**
- Busca até 50 registros com `status: PENDENTE`
- Tenta enviar por e-mail ou WhatsApp (atualmente simulado)
- Em caso de sucesso: `status → ENVIADO`
- Em caso de falha: incrementa `tentativas`; após 3 tentativas, `status → FALHA`
- **Backoff exponencial:** 1ª retentativa após 1 min, 2ª após 5 min, 3ª após 15 min

**Para observar:**

Após criar um comunicado para `TODOS_PROFESSORES` ou `TURMA_ESPECIFICA`, veja os logs:
```
[notificacaoWorker] Processando 5 notificação(ões) pendente(s)
[notificacaoWorker] Notificação uuid... enviada (EMAIL)
```

> Como o envio real (Nodemailer/Twilio) ainda não está implementado, as notificações serão marcadas como `ENVIADO` com base na simulação — sem e-mails reais sendo disparados.

---

## 12. Testando com Perfis Diferentes

Para testar o comportamento específico por role, você precisará de tokens de ADMIN, PROFESSOR e ALUNO.

### Login como ADMIN

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}'
```

### Login como PROFESSOR (se cadastrado)

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.prof@escola.com","senha":"Senha@123"}'
```

### Login como ALUNO (se cadastrado)

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao.aluno@escola.com","senha":"Senha@123"}'
```

### Cenários de validação por role

| Ação | ADMIN | PROFESSOR | ALUNO |
|---|---|---|---|
| Criar comunicado `GERAL` | ✅ | ✅ | ❌ 403 |
| Criar comunicado `TODOS_PROFESSORES` | ✅ | ✅ | ❌ 403 |
| Criar comunicado `TURMA_ESPECIFICA` | ✅ | ✅ | ❌ 403 |
| Listar todos os comunicados | ✅ todos | ✅ próprios | ✅ GERAL + seus |
| Buscar comunicado de outro usuário | ✅ | ❌ 403 | ❌ 403 |
| Marcar como lido | ✅ (se destinatário) | ✅ (se destinatário) | ✅ (se destinatário) |
| Ver contagem de não lidos | ✅ | ✅ | ✅ |
| Gerenciar preferências | ✅ próprias | ✅ próprias | ✅ próprias |

---

## 13. Health Check

```bash
curl -s http://localhost:3005/health
```

**Resposta esperada (200):**
```json
{ "status": "ok", "service": "ms05-comunicacao-escolar" }
```

---

## 14. Erros Comuns e Soluções

| Código | Mensagem | Causa | Solução |
|--------|----------|-------|---------|
| `401` | `Unauthorized` | Token ausente ou expirado | Refaça o login |
| `403` | `Permissão insuficiente` | Role não autorizada | Use token de ADMIN ou PROFESSOR |
| `403` | `Acesso negado` | Comunicado não visível para sua role | Verifique se você é destinatário |
| `404` | `Registro não encontrado` | ID inválido ou não é destinatário | Verifique o ID; para marcar lido, você precisa ser destinatário |
| `Connection refused` | — | Serviço não está rodando | Execute `npm run dev` |
| Workers com erros de conexão | `ECONNREFUSED` | MS02 ou MS03 offline | Inicie os outros serviços; os workers tentarão novamente |

---

## 15. Referência Rápida

### Comunicados

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/communications` | Autenticado | Lista comunicados visíveis para o usuário |
| `GET` | `/v1/communications/recent` | Autenticado | 20 comunicados mais recentes |
| `GET` | `/v1/communications/unread` | Autenticado | Contagem de não lidos |
| `GET` | `/v1/communications/:id` | Autenticado | Detalhes de um comunicado |
| `POST` | `/v1/communications` | ADMIN, PROFESSOR | Cria e envia comunicado |
| `PUT` | `/v1/communications/:id/read` | Autenticado | Marca comunicado como lido |

### Notificações

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/notifications/preferences` | Autenticado | Consulta preferências de notificação |
| `PUT` | `/v1/notifications/preferences` | Autenticado | Atualiza preferências de notificação |
| `GET` | `/health` | Sem auth | Health check |

### Tipos de público-alvo

| Valor | Destinatários |
|-------|--------------|
| `GERAL` | Todos os usuários autenticados (sem destinatários individuais) |
| `TODOS_PROFESSORES` | Todos os professores cadastrados no MS02 |
| `TURMA_ESPECIFICA` | Alunos alocados na turma (via MS03), requer `turma_id` |
| `LISTA_MANUAL` | IDs de usuários informados no campo `destinatarios` |
