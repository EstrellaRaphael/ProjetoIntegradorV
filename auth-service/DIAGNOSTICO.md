# Diagnóstico de Testes — Auth Service

**Data de execução:** 06/05/2026
**Executor:** Claude Sonnet 4.6 (execução automatizada seguindo o GUIA_DE_TESTES.md)
**Ambiente:** localhost — Node.js 22, MySQL remoto (`edumysql.acesso.rj.senac.br`)
**Versão do serviço:** auth-service — porta 3000

---

## Resumo Geral

| Total de testes executados | Aprovados | Reprovados |
|---------------------------|-----------|------------|
| 9 | ✅ 9 | ❌ 0 |

**Conclusão: todos os endpoints funcionando corretamente.**

---

## 1. Infraestrutura

| # | Teste | Comando | HTTP | Resultado |
|---|-------|---------|------|-----------|
| 1 | Health check | `GET /health` | 200 | ✅ `{"status":"ok","service":"auth-service"}` |

---

## 2. Login

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 2 | Login com admin | `POST /v1/auth/login` | 200 | 200 | ✅ `accessToken`, `refreshToken` e `role: "ADMIN"` retornados |

---

## 3. Refresh Token

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 3 | Renovar accessToken com refreshToken válido | `POST /v1/auth/refresh` | 200 | 200 | ✅ novo `accessToken` retornado; `refreshToken` original não é alterado |

---

## 4. Validar Token

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 4 | Validar accessToken de admin | `GET /v1/auth/validate` | 200 | 200 | ✅ `{"valid":true,"user":{"role":"ADMIN","referenciaId":null,"turmaId":null,...}}` |

---

## 5. Casos de Erro

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 5 | Senha incorreta | `POST /v1/auth/login` | 401 | 401 | ✅ `{"error":"Credenciais inválidas"}` |
| 6 | Usuário inexistente | `POST /v1/auth/login` | 401 | 401 | ✅ `{"error":"Credenciais inválidas"}` — mesmo erro para não revelar quais e-mails existem |
| 7 | Refresh token inválido | `POST /v1/auth/refresh` | 401 | 401 | ✅ `{"error":"Refresh token inválido ou expirado"}` |
| 8 | Validate com token malformado | `GET /v1/auth/validate` | 401 | 401 | ✅ erro JWT com descrição técnica detalhada |
| 9 | Refresh sem campo `refreshToken` no body | `POST /v1/auth/refresh` | 400 | 400 | ✅ `{"error":"refreshToken obrigatório"}` |

---

## 6. Observação sobre o teste 8

O guia indica apenas "Erro de JWT" como resposta esperada para o validate com token inválido. A resposta real da API é mais detalhada:

```json
{ "error": "Authorization token is invalid: The token header is not a valid base64url serialized JSON." }
```

Isso é comportamento correto — a mensagem varia conforme o tipo de malformação do token. O guia foi deixado genérico propositalmente para cobrir qualquer variação.

---

## 7. Endpoints Não Testados Automaticamente

| Endpoint | Motivo |
|----------|--------|
| Login como `PROFESSOR` ou `ALUNO` | Requer criação prévia desses usuários no banco do auth-service, que depende dos MSs de alunos e professores estarem configurados |

---

*Diagnóstico gerado automaticamente após execução do* [GUIA_DE_TESTES.md](GUIA_DE_TESTES.md).
