# Guia de Testes — MS02 Gestão de Professores
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Passo a passo completo para instalar, configurar e validar todas as funcionalidades do MS02, mesmo sem experiência prévia com APIs.

---

## Sumário

1. [O que é o MS02?](#1-o-que-é-o-ms02)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Como Obter o Token JWT](#6-como-obter-o-token-jwt)
7. [Gestão de Professores — CRUD](#7-gestão-de-professores--crud)
8. [Grade Horária](#8-grade-horária)
9. [Substituição de Professor](#9-substituição-de-professor)
10. [Feed de Alterações de Grade](#10-feed-de-alterações-de-grade)
11. [Testando com Perfil de Professor](#11-testando-com-perfil-de-professor)
12. [Health Check](#12-health-check)
13. [Erros Comuns e Soluções](#13-erros-comuns-e-soluções)
14. [Referência Rápida](#14-referência-rápida)

---

## 1. O que é o MS02?

O MS02 é o microserviço de **Gestão de Professores**. Ele é responsável por:

- **Cadastro e manutenção** dos dados dos professores (nome, e-mail)
- **Grade horária** — alocação de professores em turmas/disciplinas por bimestre
- **Substituições** — registro de professor substituto com período e motivo
- **Feed de eventos** — publica alterações de grade que o MS05 consome para criar comunicados automáticos

O serviço roda na **porta 3002** e expõe todas as suas rotas sob o prefixo `/v1/teachers`.

---

## 2. Pré-requisitos

- **Node.js 22+** — `node --version`
- **npm** — `npm --version`
- **Auth Service rodando** na porta 3000 (necessário para obter o token JWT)
- **curl** ou Postman

---

## 3. Configuração do Ambiente

### 3.1 Criar o arquivo .env

```bash
cp .env.example .env
```

Preencha com:

```env
PORT=3002
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_gabrielsantos"
JWT_SECRET="change_this_secret_in_production_auth"
```

> O `JWT_SECRET` deve ser idêntico ao do auth-service.

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
{"msg":"Server listening at http://0.0.0.0:3002"}
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

## 7. Gestão de Professores — CRUD

### 7.1 Cadastrar professor

**Rota:** `POST /v1/teachers` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3002/v1/teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome_completo":"Maria Oliveira","email":"maria.oliveira@escola.com"}'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-professor",
  "nome_completo": "Maria Oliveira",
  "email": "maria.oliveira@escola.com",
  "created_at": "2026-04-07T12:00:00.000Z",
  "updated_at": "2026-04-07T12:00:00.000Z"
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_PROFESSOR`. Campos obrigatórios: `nome_completo`, `email` (único).

### 7.2 Listar professores

**Rota:** `GET /v1/teachers` | **Role:** ADMIN

```bash
curl -s "http://localhost:3002/v1/teachers" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "data": [{ "id": "...", "nome_completo": "Maria Oliveira", ... }],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Com paginação

```bash
curl -s "http://localhost:3002/v1/teachers?page=1&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 7.3 Contar professores

**Rota:** `GET /v1/teachers/count` | **Role:** ADMIN

```bash
curl -s http://localhost:3002/v1/teachers/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** `{ "total": 1 }`

### 7.4 Buscar professor por ID

**Rota:** `GET /v1/teachers/:id` | **Role:** ADMIN ou próprio PROFESSOR

```bash
curl -s http://localhost:3002/v1/teachers/ID_PROFESSOR \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "id": "...",
  "nome_completo": "Maria Oliveira",
  "email": "maria.oliveira@escola.com",
  "professor_disciplina": [],
  "professor_turma": []
}
```

### 7.5 Editar professor

**Rota:** `PUT /v1/teachers/:id` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3002/v1/teachers/ID_PROFESSOR \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome_completo":"Maria Oliveira Santos"}'
```

**O que validar:** Campo `nome_completo` atualizado, demais intactos.

### 7.6 Cadastrar e-mail duplicado (deve retornar 409)

```bash
curl -s -X POST http://localhost:3002/v1/teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome_completo":"Clone","email":"maria.oliveira@escola.com"}'
```

**Resposta esperada (409):** `{ "error": "Registro já existe (chave única violada)" }`

### 7.7 Remover professor

**Rota:** `DELETE /v1/teachers/:id` | **Role:** ADMIN

```bash
curl -s -X DELETE http://localhost:3002/v1/teachers/ID_PROFESSOR \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204 (sem conteúdo)

---

## 8. Grade Horária

> **Pré-requisito:** Você precisará de IDs de turma (`ID_TURMA`) e disciplina (`ID_DISCIPLINA`) que existam no MS03. Se quiser testar de forma isolada, use qualquer UUID válido.

### 8.1 Criar entrada na grade

**Rota:** `POST /v1/teachers/:id/schedule` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3002/v1/teachers/ID_PROFESSOR/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "turma_id": "ID_TURMA",
    "disciplina_id": "ID_DISCIPLINA",
    "bimestre": 1,
    "ano_letivo": 2026,
    "dia_semana": "SEGUNDA",
    "horario_inicio": "19:00:00",
    "horario_fim": "20:40:00"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-grade",
  "professor_id": "...",
  "turma_id": "...",
  "disciplina_id": "...",
  "bimestre": 1,
  "ano_letivo": 2026,
  "dia_semana": "SEGUNDA",
  "horario_inicio": "1970-01-01T19:00:00.000Z",
  "horario_fim": "1970-01-01T20:40:00.000Z"
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_GRADE`.
>
> **Efeito colateral:** Uma entrada em `evento_grade` é criada com `tipo: CRIACAO`. O MS05 vai detectar esse evento em até 30 segundos e criar um comunicado automático.
>
> Valores válidos para `dia_semana`: `SEGUNDA`, `TERCA`, `QUARTA`, `QUINTA`, `SEXTA`, `SABADO`

### 8.2 Consultar grade de um professor

**Rota:** `GET /v1/teachers/:id/schedule` | **Role:** ADMIN ou próprio PROFESSOR

```bash
# Todos os bimestres
curl -s http://localhost:3002/v1/teachers/ID_PROFESSOR/schedule \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Filtrar por bimestre e ano
curl -s "http://localhost:3002/v1/teachers/ID_PROFESSOR/schedule?bimestre=1&ano_letivo=2026" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** Array com entradas da grade, incluindo substituições ativas.

### 8.3 Editar entrada da grade

**Rota:** `PUT /v1/teachers/:id/schedule/:gradeId` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3002/v1/teachers/ID_PROFESSOR/schedule/ID_GRADE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"horario_inicio":"19:30:00","horario_fim":"21:10:00"}'
```

**Resposta esperada (200):** Grade atualizada.

> **Efeito colateral:** Cria `evento_grade` com `tipo: EDICAO`.

---

## 9. Substituição de Professor

> **Pré-requisito:** Crie um segundo professor antes de testar a substituição.

**Rota:** `POST /v1/teachers/:id/schedule/:gradeId/substitution` | **Role:** ADMIN

```bash
curl -s -X POST \
  http://localhost:3002/v1/teachers/ID_PROFESSOR/schedule/ID_GRADE/substitution \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "professor_substituto_id": "ID_DE_OUTRO_PROFESSOR",
    "motivo": "Atestado médico",
    "data_inicio": "2026-04-14",
    "data_fim": "2026-04-18"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-substituicao",
  "grade_horaria_id": "...",
  "professor_substituto_id": "...",
  "motivo": "Atestado médico",
  "data_inicio": "2026-04-14",
  "data_fim": "2026-04-18",
  "created_at": "..."
}
```

> **Efeito colateral:** Cria `evento_grade` com `tipo: SUBSTITUICAO`.
>
> `data_fim` é opcional — se omitido, a substituição é considerada em aberto.

---

## 10. Feed de Alterações de Grade

**Rota:** `GET /v1/teachers/schedule/changes/recent` | **Sem autenticação**

Esta rota é usada internamente pelo MS05 para detectar eventos de grade. Retorna os 20 eventos mais recentes ainda não processados.

```bash
curl -s http://localhost:3002/v1/teachers/schedule/changes/recent
```

**Resposta esperada (200):**
```json
[
  {
    "id": "uuid-do-evento",
    "grade_horaria_id": "...",
    "tipo": "CRIACAO",
    "descricao": "Grade criada: SEGUNDA 19:00:00-20:40:00",
    "processado": false,
    "publicado_em": "2026-04-07T12:00:00.000Z",
    "processado_em": null,
    "grade_horaria": { ... }
  }
]
```

**O que validar:**
- ✅ Eventos criados nas seções 8.1, 8.3 e 9 aparecem aqui
- ✅ `processado: false` para eventos novos

---

## 11. Testando com Perfil de Professor

Para testar rotas exclusivas de professor, você precisa de um usuário com `role: PROFESSOR` no banco do auth-service. Execute o SQL abaixo no schema `20261_prjint5_raphaelestrella`:

```sql
INSERT INTO usuario (id, email, senha_hash, role, referencia_id, ativo)
VALUES (
  UUID(),
  'maria.prof@escola.com',
  '$2b$10$HASH_GERADO',
  'PROFESSOR',
  'ID_PROFESSOR',
  TRUE
);
```

Para gerar o hash da senha:
```bash
cd auth-service && node -e "const b = require('bcryptjs'); console.log(b.hashSync('Senha@123', 10))"
```

### Login como professor

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.prof@escola.com","senha":"Senha@123"}'
```

### Professor vê o próprio perfil (/me)

```bash
curl -s http://localhost:3002/v1/teachers/me \
  -H "Authorization: Bearer TOKEN_PROFESSOR"
```

**Resposta esperada (200):** Dados do professor Maria Oliveira.

### Professor tenta listar todos (deve retornar 403)

```bash
curl -s http://localhost:3002/v1/teachers \
  -H "Authorization: Bearer TOKEN_PROFESSOR"
```

**Resposta esperada (403):** `{ "error": "Permissão insuficiente" }`

### Admin tenta acessar /me (deve retornar 403)

```bash
curl -s http://localhost:3002/v1/teachers/me \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Resposta esperada (403):** `{ "error": "Rota exclusiva para professores" }` ou similar.

---

## 12. Health Check

```bash
curl -s http://localhost:3002/health
```

**Resposta esperada (200):**
```json
{ "status": "ok", "service": "ms02-gestao-de-professores" }
```

---

## 13. Erros Comuns e Soluções

| Código | Mensagem | Causa | Solução |
|--------|----------|-------|---------|
| `401` | `Unauthorized` | Token ausente ou expirado | Refaça o login |
| `403` | `Permissão insuficiente` | Role não autorizada | Use token de ADMIN |
| `403` | `Acesso negado` | Professor tentou ver dados de outro | Um professor só vê os próprios dados |
| `404` | `Registro não encontrado` | ID inválido | Verifique o ID com um GET |
| `409` | `Registro já existe` | E-mail duplicado | Use e-mail diferente |
| `Connection refused` | — | Serviço não está rodando | Execute `npm run dev` |

---

## 14. Referência Rápida

### Professores

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/teachers` | ADMIN | Lista professores paginados |
| `GET` | `/v1/teachers/count` | ADMIN | Conta professores |
| `GET` | `/v1/teachers/me` | PROFESSOR | Perfil do professor autenticado |
| `GET` | `/v1/teachers/:id` | ADMIN, PROFESSOR (próprio) | Dados de um professor |
| `POST` | `/v1/teachers` | ADMIN | Cadastra professor |
| `PUT` | `/v1/teachers/:id` | ADMIN | Edita professor |
| `DELETE` | `/v1/teachers/:id` | ADMIN | Remove professor |

### Grade e Substituições

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/teachers/:id/schedule` | ADMIN, PROFESSOR (próprio) | Grade horária |
| `POST` | `/v1/teachers/:id/schedule` | ADMIN | Cria entrada na grade |
| `PUT` | `/v1/teachers/:id/schedule/:gradeId` | ADMIN | Edita entrada da grade |
| `POST` | `/v1/teachers/:id/schedule/:gradeId/substitution` | ADMIN | Registra substituição |
| `GET` | `/v1/teachers/schedule/changes/recent` | Sem auth | Feed de eventos de grade |
| `GET` | `/health` | Sem auth | Health check |
