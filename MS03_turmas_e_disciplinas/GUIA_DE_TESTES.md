# Guia de Testes — MS03 Turmas e Disciplinas
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Passo a passo completo para instalar, configurar e validar todas as funcionalidades do MS03, mesmo sem experiência prévia com APIs.

---

## Sumário

1. [O que é o MS03?](#1-o-que-é-o-ms03)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Como Obter o Token JWT](#6-como-obter-o-token-jwt)
7. [Disciplinas](#7-disciplinas)
8. [Calendário Escolar](#8-calendário-escolar)
9. [Turmas](#9-turmas)
10. [Alocação de Alunos em Turmas](#10-alocação-de-alunos-em-turmas)
11. [Health Check](#11-health-check)
12. [Erros Comuns e Soluções](#12-erros-comuns-e-soluções)
13. [Referência Rápida](#13-referência-rápida)

---

## 1. O que é o MS03?

O MS03 é o microserviço de **Turmas e Disciplinas**. Ele é a base do sistema — todos os outros MSs dependem das entidades criadas aqui. Ele é responsável por:

- **Disciplinas** — cadastro das matérias do currículo
- **Calendário Escolar** — feriados, recessos e eventos do ano letivo
- **Turmas** — criação e gestão de turmas vinculadas ao calendário
- **Alocação de Alunos** — associação de alunos às turmas

O serviço roda na **porta 3003**.

> **Por que começar pelo MS03?** Disciplinas e turmas são referenciadas por todos os outros microserviços. Crie-as aqui antes de usar os outros.

---

## 2. Pré-requisitos

- **Node.js 22+** e **npm**
- **Auth Service rodando** na porta 3000
- **curl** ou Postman

---

## 3. Configuração do Ambiente

```bash
cp .env.example .env
```

```env
PORT=3003
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_andrebezerra"
JWT_SECRET="change_this_secret_in_production_auth"
```

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
{"msg":"Server listening at http://0.0.0.0:3003"}
```

---

## 6. Como Obter o Token JWT

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}'
```

> Guarde o `accessToken`. Substitua `SEU_TOKEN_AQUI` por ele nas requisições abaixo.

---

## 7. Disciplinas

### 7.1 Criar disciplina

**Rota:** `POST /v1/disciplines` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3003/v1/disciplines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome":"Matemática","carga_horaria":80}'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-disciplina",
  "nome": "Matemática",
  "carga_horaria": 80,
  "created_at": "2026-04-07T12:00:00.000Z",
  "updated_at": "2026-04-07T12:00:00.000Z"
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_DISCIPLINA_MATEMATICA`. Campos obrigatórios: `nome`, `carga_horaria` (inteiro ≥ 1).

Crie uma segunda disciplina para testes:

```bash
curl -s -X POST http://localhost:3003/v1/disciplines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome":"Português","carga_horaria":60}'
```

### 7.2 Listar disciplinas

**Rota:** `GET /v1/disciplines` | **Role:** Qualquer

```bash
curl -s http://localhost:3003/v1/disciplines \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** Array com todas as disciplinas.

**O que validar:** As duas disciplinas criadas aparecem na lista.

### 7.3 Buscar disciplina por ID

**Rota:** `GET /v1/disciplines/:id` | **Role:** Qualquer

```bash
curl -s http://localhost:3003/v1/disciplines/ID_DISCIPLINA_MATEMATICA \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 7.4 Editar disciplina

**Rota:** `PUT /v1/disciplines/:id` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3003/v1/disciplines/ID_DISCIPLINA_MATEMATICA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"carga_horaria":100}'
```

**O que validar:** `carga_horaria` agora é 100.

### 7.5 Buscar ID inexistente (deve retornar 404)

```bash
curl -s http://localhost:3003/v1/disciplines/id-invalido \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (404):** `{ "error": "Disciplina não encontrada" }`

### 7.6 Remover disciplina

**Rota:** `DELETE /v1/disciplines/:id` | **Role:** ADMIN

```bash
curl -s -X DELETE http://localhost:3003/v1/disciplines/ID_DISCIPLINA_MATEMATICA \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204 (sem conteúdo)

---

## 8. Calendário Escolar

> O calendário precisa ser criado antes das turmas, pois cada turma exige um `calendario_id`.

### 8.1 Criar evento no calendário

**Rota:** `POST /v1/calendar/events` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3003/v1/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"data":"2026-04-21","descricao":"Tiradentes — Feriado Nacional","tipo":"FERIADO"}'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-evento",
  "data": "2026-04-21",
  "descricao": "Tiradentes — Feriado Nacional",
  "tipo": "FERIADO"
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_CALENDARIO`.
>
> Valores válidos para `tipo`: `AULA`, `FERIADO`, `RECESSO`, `EVENTO`

### 8.2 Listar eventos

**Rota:** `GET /v1/calendar/events` | **Role:** Qualquer

```bash
curl -s http://localhost:3003/v1/calendar/events \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por tipo

```bash
curl -s "http://localhost:3003/v1/calendar/events?tipo=FERIADO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por período

```bash
curl -s "http://localhost:3003/v1/calendar/events?data_inicio=2026-04-01&data_fim=2026-04-30" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 8.3 Editar evento

**Rota:** `PUT /v1/calendar/events/:id` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3003/v1/calendar/events/ID_CALENDARIO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"descricao":"Tiradentes (feriado nacional)"}'
```

### 8.4 Remover evento

**Rota:** `DELETE /v1/calendar/events/:id` | **Role:** ADMIN

```bash
curl -s -X DELETE http://localhost:3003/v1/calendar/events/ID_CALENDARIO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204

---

## 9. Turmas

### 9.1 Criar turma

**Rota:** `POST /v1/classes` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3003/v1/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "codigo":"3A-2026",
    "ano_letivo":2026,
    "turno":"NOITE",
    "calendario_id":"ID_CALENDARIO"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-turma",
  "codigo": "3A-2026",
  "ano_letivo": 2026,
  "turno": "NOITE",
  "calendario_id": "..."
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_TURMA_3A`.
>
> Valores válidos para `turno`: `MANHA`, `TARDE`, `NOITE`
>
> A combinação `codigo + ano_letivo` deve ser única.

### 9.2 Listar turmas

**Rota:** `GET /v1/classes` | **Role:** Qualquer

```bash
# Todas as turmas
curl -s http://localhost:3003/v1/classes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Filtrar por ano letivo
curl -s "http://localhost:3003/v1/classes?ano_letivo=2026" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Com paginação
curl -s "http://localhost:3003/v1/classes?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "data": [
    {
      "id": "...",
      "codigo": "3A-2026",
      "turno": "NOITE",
      "alocacao_professor": [],
      "alocacao_aluno": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 9.3 Contar turmas ativas do ano atual

**Rota:** `GET /v1/classes/active/count` | **Role:** ADMIN

```bash
curl -s http://localhost:3003/v1/classes/active/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** `{ "total": 1 }`

### 9.4 Buscar turma por ID

**Rota:** `GET /v1/classes/:id` | **Role:** Qualquer

```bash
curl -s http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 9.5 Editar turma

**Rota:** `PUT /v1/classes/:id` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"turno":"TARDE"}'
```

### 9.6 Turma com código duplicado (deve retornar 409)

```bash
curl -s -X POST http://localhost:3003/v1/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"codigo":"3A-2026","ano_letivo":2026,"turno":"MANHA","calendario_id":"ID_CALENDARIO"}'
```

**Resposta esperada (409):** `{ "error": "Registro já existe (chave única violada)" }`

### 9.7 Remover turma

**Rota:** `DELETE /v1/classes/:id` | **Role:** ADMIN

```bash
curl -s -X DELETE http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204

---

## 10. Alocação de Alunos em Turmas

> Você precisará do `ID_ALUNO` obtido no MS01.

### 10.1 Alocar aluno em turma

**Rota:** `POST /v1/classes/:id/students` | **Role:** ADMIN

```bash
curl -s -X POST http://localhost:3003/v1/classes/ID_TURMA_3A/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"aluno_id":"ID_ALUNO","data_matricula":"2026-02-03"}'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-alocacao",
  "aluno_id": "...",
  "turma_id": "...",
  "data_matricula": "2026-02-03"
}
```

### 10.2 Verificar a alocação

```bash
curl -s http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:** Campo `alocacao_aluno` contém o aluno recém-alocado.

### 10.3 Alocar aluno duplicado (deve retornar 409)

```bash
curl -s -X POST http://localhost:3003/v1/classes/ID_TURMA_3A/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"aluno_id":"ID_ALUNO","data_matricula":"2026-02-03"}'
```

**Resposta esperada (409):** `{ "error": "Registro já existe (chave única violada)" }`

### 10.4 Remover aluno da turma

**Rota:** `DELETE /v1/classes/:id/students/:alunoId` | **Role:** ADMIN

```bash
curl -s -X DELETE \
  http://localhost:3003/v1/classes/ID_TURMA_3A/students/ID_ALUNO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204

---

## 11. Health Check

```bash
curl -s http://localhost:3003/health
```

**Resposta esperada (200):**
```json
{ "status": "ok", "service": "ms03-turmas-e-disciplinas" }
```

---

## 12. Erros Comuns e Soluções

| Código | Mensagem | Causa | Solução |
|--------|----------|-------|---------|
| `401` | `Unauthorized` | Token ausente ou expirado | Refaça o login |
| `403` | `Permissão insuficiente` | Role não autorizada | Use token de ADMIN |
| `404` | `Turma não encontrada` | ID inválido | Verifique com GET |
| `404` | `Disciplina não encontrada` | ID inválido | Verifique com GET |
| `409` | `Registro já existe` | Chave duplicada | Use dados diferentes |
| `Connection refused` | — | Serviço não está rodando | Execute `npm run dev` |

---

## 13. Referência Rápida

### Disciplinas

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/disciplines` | Qualquer | Lista todas as disciplinas |
| `GET` | `/v1/disciplines/:id` | Qualquer | Busca disciplina por ID |
| `POST` | `/v1/disciplines` | ADMIN | Cria disciplina |
| `PUT` | `/v1/disciplines/:id` | ADMIN | Edita disciplina |
| `DELETE` | `/v1/disciplines/:id` | ADMIN | Remove disciplina |

### Calendário

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/calendar/events` | Qualquer | Lista eventos (filtros: tipo, data_inicio, data_fim) |
| `POST` | `/v1/calendar/events` | ADMIN | Cria evento |
| `PUT` | `/v1/calendar/events/:id` | ADMIN | Edita evento |
| `DELETE` | `/v1/calendar/events/:id` | ADMIN | Remove evento |

### Turmas

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/classes` | Qualquer | Lista turmas (filtros: ano_letivo, page, limit) |
| `GET` | `/v1/classes/active/count` | ADMIN | Conta turmas ativas do ano atual |
| `GET` | `/v1/classes/:id` | Qualquer | Busca turma por ID com alocações |
| `POST` | `/v1/classes` | ADMIN | Cria turma |
| `PUT` | `/v1/classes/:id` | ADMIN | Edita turma |
| `DELETE` | `/v1/classes/:id` | ADMIN | Remove turma |
| `POST` | `/v1/classes/:id/students` | ADMIN | Aloca aluno na turma |
| `DELETE` | `/v1/classes/:id/students/:alunoId` | ADMIN | Remove aluno da turma |
| `GET` | `/health` | Sem auth | Health check |
