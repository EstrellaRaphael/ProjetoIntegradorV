# Guia de Testes — MS04 Avaliações e Notas
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Passo a passo completo para instalar, configurar e validar todas as funcionalidades do MS04, mesmo sem experiência prévia com APIs.

---

## Sumário

1. [O que é o MS04?](#1-o-que-é-o-ms04)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Como Obter o Token JWT](#6-como-obter-o-token-jwt)
7. [Configuração de Média Mínima](#7-configuração-de-média-mínima)
8. [Avaliações](#8-avaliações)
9. [Lançamento de Notas](#9-lançamento-de-notas)
10. [Boletim do Aluno](#10-boletim-do-aluno)
11. [Recuperação](#11-recuperação)
12. [Prova Final](#12-prova-final)
13. [Health Check](#13-health-check)
14. [Erros Comuns e Soluções](#14-erros-comuns-e-soluções)
15. [Referência Rápida](#15-referência-rápida)

---

## 1. O que é o MS04?

O MS04 é o microserviço de **Avaliações e Notas**. É o mais complexo do sistema e é responsável por:

- **Avaliações** — criação de provas, trabalhos, recuperações e prova final
- **Lançamento de notas** — registro de notas individuais por aluno
- **Cálculo automático de médias** — cada lançamento recalcula automaticamente a média bimestral
- **Recuperação** — nota de recuperação substitui a média bimestral se for maior
- **Prova final** — calculada a partir da média anual dos 4 bimestres
- **Boletim** — visão consolidada de todas as médias e resultados de um aluno
- **Configuração da média mínima** — o administrador pode alterar o valor mínimo para aprovação

O serviço roda na **porta 3004**.

### Como funciona o fluxo de notas?

```
Lançar nota → recalcular média bimestral → consultar boletim
```

1. O professor cria uma **avaliação** (prova, trabalho, etc.)
2. O professor lança a **nota** do aluno nessa avaliação
3. O sistema **recalcula automaticamente** a média bimestral para aquela disciplina/bimestre
4. Ao final do ano, o sistema calcula a **média anual** e, se necessário, cria um registro de **prova final**

---

## 2. Pré-requisitos

- **Node.js 22+** e **npm**
- **Auth Service rodando** na porta 3000
- IDs de disciplina (`ID_DISCIPLINA`), turma (`ID_TURMA`), professor (`ID_PROFESSOR`) e aluno (`ID_ALUNO`) criados nos outros MSs
- **curl** ou Postman

---

## 3. Configuração do Ambiente

```bash
cp .env.example .env
```

```env
PORT=3004
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_carlossoares"
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
{"msg":"Server listening at http://0.0.0.0:3004"}
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

## 7. Configuração de Média Mínima

A média mínima para aprovação é **6.0 por padrão**. O administrador pode alterá-la.

### 7.1 Consultar configuração atual

**Rota:** `GET /v1/grades/config` | **Role:** ADMIN

```bash
curl -s http://localhost:3004/v1/grades/config \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "media_min_aprovacao": 6.0
}
```

> Se ainda não existe configuração salva, retorna o padrão `{ "media_min_aprovacao": 6.0 }`.

### 7.2 Alterar a média mínima

**Rota:** `PUT /v1/grades/config` | **Role:** ADMIN

```bash
curl -s -X PUT http://localhost:3004/v1/grades/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"media_min_aprovacao":5.5}'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid",
  "media_min_aprovacao": "5.50",
  "vigente_desde": "2026-04-07T12:00:00.000Z",
  "alterado_por_admin_id": "uuid-do-admin",
  "ativa": true
}
```

**O que validar:**
- ✅ Nova configuração criada com `ativa: true`
- ✅ Consultar config novamente mostra o novo valor

> Retorne para 6.0 para os próximos testes:
```bash
curl -s -X PUT http://localhost:3004/v1/grades/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"media_min_aprovacao":6.0}'
```

---

## 8. Avaliações

### 8.1 Criar uma prova

**Rota:** `POST /v1/assessments` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Prova 1 — Álgebra",
    "tipo": "PROVA",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA",
    "turma_id": "ID_TURMA",
    "professor_id": "ID_PROFESSOR",
    "data_aplicacao": "2026-04-20",
    "peso_na_media": 1.0
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-avaliacao",
  "titulo": "Prova 1 — Álgebra",
  "tipo": "PROVA",
  "bimestre": 1,
  "ano_letivo": 2026,
  "disciplina_id": "...",
  "turma_id": "...",
  "professor_id": "...",
  "data_aplicacao": "2026-04-20T00:00:00.000Z",
  "peso_na_media": "1.00",
  "criada_em": "..."
}
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_PROVA1`.
>
> Valores válidos para `tipo`: `PROVA`, `TRABALHO`, `RECUPERACAO`, `PROVA_FINAL`
>
> `peso_na_media` mínimo: 0.01 (padrão 1.0)

### 8.2 Criar um trabalho no mesmo bimestre

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Trabalho em Grupo — Geometria",
    "tipo": "TRABALHO",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA",
    "turma_id": "ID_TURMA",
    "professor_id": "ID_PROFESSOR",
    "data_aplicacao": "2026-04-25",
    "peso_na_media": 1.0
  }'
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_TRABALHO1`.

### 8.3 Listar avaliações

**Rota:** `GET /v1/assessments` | **Role:** ADMIN (todas) ou PROFESSOR (próprias)

```bash
# Todas as avaliações
curl -s http://localhost:3004/v1/assessments \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Filtrar por bimestre e ano
curl -s "http://localhost:3004/v1/assessments?bimestre=1&ano_letivo=2026" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Filtrar por turma
curl -s "http://localhost:3004/v1/assessments?turma_id=ID_TURMA" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 8.4 Buscar avaliação por ID

**Rota:** `GET /v1/assessments/:id` | **Role:** Qualquer

```bash
curl -s http://localhost:3004/v1/assessments/ID_PROVA1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 8.5 Editar avaliação

**Rota:** `PUT /v1/assessments/:id` | **Role:** ADMIN ou PROFESSOR (própria)

```bash
curl -s -X PUT http://localhost:3004/v1/assessments/ID_PROVA1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"data_aplicacao":"2026-04-22"}'
```

---

## 9. Lançamento de Notas

> **Efeito automático:** Cada lançamento de nota (não sendo recuperação) recalcula automaticamente a média bimestral para aquele aluno/disciplina/bimestre.

### 9.1 Lançar nota na prova

**Rota:** `POST /v1/grades` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "avaliacao_id": "ID_PROVA1",
    "aluno_id": "ID_ALUNO",
    "valor": 7.5
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-da-nota",
  "avaliacao_id": "...",
  "aluno_id": "...",
  "professor_id": "...",
  "valor": "7.50",
  "substituida": false,
  "lancada_em": "...",
  "editada_em": null
}
```

**O que validar:** Consulte o boletim imediatamente após — a média bimestral deve aparecer:

```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 9.2 Lançar nota no trabalho

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "avaliacao_id": "ID_TRABALHO1",
    "aluno_id": "ID_ALUNO",
    "valor": 8.0
  }'
```

**Verificar média atualizada no boletim:**
```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

A média bimestral agora deve ser `(7.5 + 8.0) / 2 = 7.75`.

### 9.3 Feed de notas recentes

**Rota:** `GET /v1/grades/recent` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s http://localhost:3004/v1/grades/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):** Array com as 20 notas mais recentes, cada uma incluindo os dados da avaliação.

### 9.4 Editar nota já lançada

Primeiro, obtenha o `id` da nota via feed:

```bash
curl -s http://localhost:3004/v1/grades/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Com o `id` em mãos:

**Rota:** `PUT /v1/grades/:id` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X PUT http://localhost:3004/v1/grades/ID_DA_NOTA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"valor":9.0}'
```

**O que validar:** A média bimestral foi recalculada automaticamente após a edição.

### 9.5 Tentar lançar nota duplicada (deve retornar 409)

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"avaliacao_id":"ID_PROVA1","aluno_id":"ID_ALUNO","valor":5.0}'
```

**Resposta esperada (409):** `{ "error": "Registro já existe (chave única violada)" }`

---

## 10. Boletim do Aluno

**Rota:** `GET /v1/grades/:alunoId/boletim` | **Role:** ADMIN, PROFESSOR ou ALUNO (próprio)

```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "medias_bimestrais": [
    {
      "id": "uuid",
      "aluno_id": "...",
      "disciplina_id": "...",
      "bimestre": 1,
      "ano_letivo": 2026,
      "valor_calculado": "7.75",
      "recuperacao_aplicada": false,
      "calculada_em": "..."
    }
  ],
  "provas_final": []
}
```

**O que validar:**
- ✅ `medias_bimestrais` contém a média recalculada automaticamente
- ✅ `valor_calculado` reflete todas as notas lançadas
- ✅ `recuperacao_aplicada: false` enquanto não houver recuperação

---

## 11. Recuperação

> A recuperação funciona como uma avaliação do tipo `RECUPERACAO`. Ao lançar a nota, o sistema compara automaticamente com a média bimestral existente: se a nota de recuperação for **maior**, ela **substitui** a média.

### 11.1 Criar avaliação de recuperação

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Recuperação — 1º Bimestre",
    "tipo": "RECUPERACAO",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA",
    "turma_id": "ID_TURMA",
    "professor_id": "ID_PROFESSOR",
    "data_aplicacao": "2026-05-10",
    "peso_na_media": 1.0
  }'
```

> **Guarde o `id`!** Vamos chamá-lo de `ID_RECUPERACAO`.

### 11.2 Lançar nota de recuperação

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"avaliacao_id":"ID_RECUPERACAO","aluno_id":"ID_ALUNO","valor":8.5}'
```

### 11.3 Verificar efeito no boletim

```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:**
- ✅ Se a nota de recuperação (8.5) for maior que a média bimestral anterior, `valor_calculado` será substituído por 8.5
- ✅ `recuperacao_aplicada: true` quando houve substituição

> **Observação:** Notas de recuperação **não entram** no cálculo da média bimestral — elas apenas substituem a média se forem maiores.

---

## 12. Prova Final

> A prova final só pode ser lançada para alunos com **Média Anual < 6.0** (ou o valor configurado). Para testar, você precisa que o aluno tenha médias bimestrais registradas nos 4 bimestres com valores baixos.

### 12.1 Pré-requisito: criar notas baixas nos 4 bimestres

Repita o processo das seções 8 e 9 para os bimestres 2, 3 e 4, lançando notas abaixo de 6.0. O boletim precisa mostrar médias nos 4 bimestres.

### 12.2 Verificar elegibilidade no boletim

```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Confirme que a seção `provas_final` aparece com `"status": "EM_CURSO"` — isso indica que o sistema detectou a reprovação e criou automaticamente o registro de prova final.

### 12.3 Lançar nota da prova final

**Rota:** `POST /v1/grades/prova-final` | **Role:** ADMIN ou PROFESSOR

```bash
curl -s -X POST http://localhost:3004/v1/grades/prova-final \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "aluno_id": "ID_ALUNO",
    "disciplina_id": "ID_DISCIPLINA",
    "ano_letivo": 2026,
    "nota_prova_final": 7.0
  }'
```

**Resposta esperada (200/201):**
```json
{
  "id": "uuid",
  "aluno_id": "...",
  "disciplina_id": "...",
  "ano_letivo": 2026,
  "nota_prova_final": "7.00",
  "media_anual": "4.50",
  "media_final": "5.75",
  "status": "REPROVADO_NOTA",
  "lancada_em": "..."
}
```

**Cálculo automático:**
- `media_anual` = média dos 4 bimestres
- `media_final` = `(media_anual + nota_prova_final) / 2`
- Se `media_final ≥ 6.0` → `status = "APROVADO_PF"`
- Se `media_final < 6.0` → `status = "REPROVADO_NOTA"`

### 12.4 Tentar lançar prova final para aluno aprovado (deve retornar 400)

Se o aluno já tem média ≥ 6.0, o sistema rejeita o lançamento:

**Resposta esperada (400):** `{ "error": "..." }` indicando que o aluno não precisa de prova final.

---

## 13. Health Check

```bash
curl -s http://localhost:3004/health
```

**Resposta esperada (200):**
```json
{ "status": "ok", "service": "ms04-avaliacoes-e-notas" }
```

---

## 14. Erros Comuns e Soluções

| Código | Mensagem | Causa | Solução |
|--------|----------|-------|---------|
| `401` | `Unauthorized` | Token ausente ou expirado | Refaça o login |
| `403` | `Permissão insuficiente` | Role não autorizada | Use token de ADMIN ou PROFESSOR |
| `403` | `Acesso negado` | Aluno tentou ver boletim de outro | Use o ID do próprio aluno |
| `404` | `Registro não encontrado` | ID inválido | Verifique com GET |
| `409` | `Registro já existe` | Nota duplicada | Um aluno só pode ter uma nota por avaliação |
| `400` | — | Aluno já aprovado (prova final) | O aluno não precisa de prova final |
| `Connection refused` | — | Serviço não está rodando | Execute `npm run dev` |

---

## 15. Referência Rápida

### Avaliações

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/assessments` | ADMIN, PROFESSOR (próprias) | Lista avaliações com filtros |
| `GET` | `/v1/assessments/:id` | Qualquer | Busca avaliação por ID |
| `POST` | `/v1/assessments` | ADMIN, PROFESSOR | Cria avaliação |
| `PUT` | `/v1/assessments/:id` | ADMIN, PROFESSOR (própria) | Edita avaliação |

### Notas e Boletim

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/grades/recent` | ADMIN, PROFESSOR | Feed das 20 notas mais recentes |
| `POST` | `/v1/grades` | ADMIN, PROFESSOR | Lança nota (recalcula média automaticamente) |
| `PUT` | `/v1/grades/:id` | ADMIN, PROFESSOR | Edita nota (recalcula média) |
| `GET` | `/v1/grades/:alunoId/boletim` | ADMIN, PROFESSOR, ALUNO (próprio) | Boletim completo |
| `POST` | `/v1/grades/prova-final` | ADMIN, PROFESSOR | Lança nota da prova final |
| `GET` | `/v1/grades/config` | ADMIN | Consulta média mínima configurada |
| `PUT` | `/v1/grades/config` | ADMIN | Altera média mínima |
| `GET` | `/health` | Sem auth | Health check |
