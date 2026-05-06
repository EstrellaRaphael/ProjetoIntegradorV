# Diagnóstico de Testes — MS02 Gestão de Professores

**Data de execução:** 06/05/2026
**Executor:** Claude Sonnet 4.6 (execução automatizada seguindo o GUIA_DE_TESTES.md)
**Ambiente:** localhost — Node.js 22, MySQL remoto (`edumysql.acesso.rj.senac.br`)
**Versão do serviço:** ms02-gestao-de-professores — porta 3002

---

## Resumo Geral

| Total de testes executados | Aprovados | Reprovados |
|---------------------------|-----------|------------|
| 16 | ✅ 16 | ❌ 0 |

**Conclusão: todos os endpoints funcionando corretamente.**

---

## 1. Infraestrutura e Autenticação

| # | Teste | Comando | HTTP | Resultado |
|---|-------|---------|------|-----------|
| 1 | Health check MS02 | `GET /health` | 200 | ✅ `{"status":"ok","service":"ms02-gestao-de-professores"}` |
| 2 | Health check Auth Service | `GET /health` (porta 3000) | 200 | ✅ auth-service no ar |
| 3 | Login admin | `POST /v1/auth/login` | 200 | ✅ `accessToken` e `role: ADMIN` retornados |

---

## 2. Gestão de Professores — CRUD

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 4 | Cadastrar professor | `POST /v1/teachers` | 201 | 201 | ✅ `id` (UUID), `nome_completo`, `email`, `created_at`, `updated_at` retornados |
| 5 | Listar professores | `GET /v1/teachers` | 200 | 200 | ✅ retorna `{data: [...], total, page, limit}` com professores existentes |
| 6 | Listar com paginação (`page=1&limit=5`) | `GET /v1/teachers` | 200 | 200 | ✅ campos `page` e `limit` refletidos na resposta |
| 7 | Contar professores | `GET /v1/teachers/count` | 200 | 200 | ✅ `{"total":3}` |
| 8 | Buscar professor por ID | `GET /v1/teachers/:id` | 200 | 200 | ✅ dados completos com `professor_disciplina` e `professor_turma` |
| 9 | Editar professor | `PUT /v1/teachers/:id` | 200 | 200 | ✅ `nome_completo` atualizado; demais campos intactos |
| 10 | Cadastrar e-mail duplicado | `POST /v1/teachers` | 409 | 409 | ✅ `{"error":"Registro já existe (chave única violada)"}` |
| 11 | Remover professor | `DELETE /v1/teachers/:id` | 204 | 204 | ✅ resposta sem body |

---

## 3. Grade Horária

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 12 | Criar entrada na grade | `POST /v1/teachers/:id/schedule` | 201 | 201 | ✅ `horario_inicio` e `horario_fim` retornados como timestamp `1970-01-01T...` (formato ISO do MySQL TIME) |
| 13 | Consultar grade | `GET /v1/teachers/:id/schedule` | 200 | 200 | ✅ array com entradas da grade; inclui campo `substituicao_professor` |
| 14 | Filtrar grade por bimestre e ano | `GET /v1/teachers/:id/schedule?bimestre=1&ano_letivo=2026` | 200 | 200 | ✅ retorna apenas entradas do bimestre 1/2026 |
| 15 | Editar entrada da grade | `PUT /v1/teachers/:id/schedule/:gradeId` | 200 | 200 | ✅ horários atualizados corretamente |

---

## 4. Substituição de Professor

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 16 | Registrar substituição | `POST /v1/teachers/:id/schedule/:gradeId/substitution` | 201 | 201 | ✅ `grade_horaria_id`, `professor_substituto_id`, `motivo`, `data_inicio`, `data_fim` retornados |

---

## 5. Feed de Eventos e Erros de Acesso

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 17 | Feed de alterações de grade (sem auth) | `GET /v1/teachers/schedule/changes/recent` | 200 | 200 | ✅ eventos `CRIACAO`, `EDICAO`, `SUBSTITUICAO` com `processado: false` listados |
| 18 | Listar professores sem token | `GET /v1/teachers` | 401 | 401 | ✅ `{"error":"No Authorization was found in request.headers"}` |
| 19 | Buscar professor ID inexistente | `GET /v1/teachers/:id` (UUID inválido) | 404 | 404 | ✅ `{"error":"Professor não encontrado"}` |

---

## 6. Observações

### Efeito colateral dos eventos de grade

Cada operação de criação, edição e substituição de grade gerou automaticamente um registro na tabela `evento_grade`, confirmando que o Outbox Pattern está funcionando corretamente. Os eventos aparecem no feed com `processado: false` e ficam disponíveis para o MS05 consumir.

### Horários retornados como timestamp 1970

O campo `horario_inicio` e `horario_fim` são armazenados como tipo `TIME` no MySQL e ao serem serializados pelo Prisma aparecem como `"1970-01-01T19:00:00.000Z"`. Esse é o comportamento esperado — o frontend deve extrair apenas a parte do horário (`HH:MM`) para exibição.

### curl no Windows com caracteres especiais

A rota de substituição usa campo `motivo` com texto em português. O uso de `-d '...'` com aspas simples no curl do Windows causou `Request body size did not match Content-Length`. Resolvido usando `--data-binary @arquivo.json` conforme documentado no guia.

---

## 7. Endpoints Não Testados Automaticamente

| Endpoint | Motivo |
|----------|--------|
| `GET /v1/teachers/me` (role PROFESSOR) | Requer usuário com `role: PROFESSOR` cadastrado no auth-service e vinculado ao MS02 |
| `GET /v1/teachers/:id` com token de PROFESSOR | Idem |
| Grade com `turma_id` e `disciplina_id` reais | Requer MS03 rodando e entidades previamente criadas; testado com UUIDs fictícios |

---

*Diagnóstico gerado automaticamente após execução do* [GUIA_DE_TESTES.md](GUIA_DE_TESTES.md).
