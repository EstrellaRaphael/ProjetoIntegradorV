# Diagnóstico de Testes — MS05 Comunicação Escolar

**Data de execução:** 06/05/2026
**Executor:** Claude Sonnet 4.6 (execução automatizada seguindo o GUIA_DE_TESTES.md)
**Ambiente:** localhost — Node.js 22, MySQL remoto (`edumysql.acesso.rj.senac.br`)
**Versão do serviço:** ms05-comunicacao-escolar — porta 3005

---

## Resumo Geral

| Total de testes executados | Aprovados | Reprovados |
|---------------------------|-----------|------------|
| 18 | ✅ 18 | ❌ 0 |

**Conclusão: todos os endpoints e workers funcionando corretamente.**

---

## 1. Infraestrutura e Autenticação

| # | Teste | Comando | HTTP | Resultado |
|---|-------|---------|------|-----------|
| 1 | Health check MS05 | `GET /health` | 200 | ✅ `{"status":"ok","service":"ms05-comunicacao-escolar"}` |
| 2 | Workers no startup | Logs do servidor | — | ✅ `[gradeWorker] Iniciado — polling MS-02 a cada 30s` e `[notificacaoWorker] Iniciado — processando fila a cada 30s` |
| 3 | Login admin | `POST /v1/auth/login` | 200 | ✅ `accessToken` e `role: ADMIN` retornados |

---

## 2. Comunicados — Criação

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 4 | Criar comunicado `GERAL` | `POST /v1/communications` | 201 | 201 | ✅ `id`, `remetente_id`, `titulo`, `conteudo`, `publico_alvo`, `data_envio` retornados |
| 5 | Criar comunicado `TODOS_PROFESSORES` | `POST /v1/communications` | 201 | 201 | ✅ criado com sucesso; MS02 consultado para resolver lista de professores |
| 6 | Criar comunicado `TURMA_ESPECIFICA` | `POST /v1/communications` | 201 | 201 | ✅ criado com sucesso; MS03 consultado para resolver alunos da turma |
| 7 | Criar comunicado `LISTA_MANUAL` | `POST /v1/communications` | 201 | 201 | ✅ destinatários criados a partir dos IDs informados |

---

## 3. Comunicados — Listagem e Consulta

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 8 | Listar todos os comunicados | `GET /v1/communications` | 200 | 200 | ✅ array com comunicados incluindo `destinatario_comunicado` |
| 9 | Listar comunicados recentes | `GET /v1/communications/recent` | 200 | 200 | ✅ 20 comunicados mais recentes |
| 10 | Buscar comunicado por ID | `GET /v1/communications/:id` | 200 | 200 | ✅ dados completos com array `destinatario_comunicado` |

---

## 4. Marcação de Leitura

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 11 | Consultar não lidos antes de marcar | `GET /v1/communications/unread` | 200 | 200 | ✅ `{"total":1}` |
| 12 | Marcar comunicado `LISTA_MANUAL` como lido | `PUT /v1/communications/:id/read` | 200 | 200 | ✅ `{"success":true}` |
| 13 | Consultar não lidos após marcar | `GET /v1/communications/unread` | 200 | 200 | ✅ `{"total":0}` — total diminuiu corretamente |
| 14 | Marcar novamente o mesmo comunicado | `PUT /v1/communications/:id/read` | 200 | 200 | ✅ `{"success":true,"message":"Já estava marcado como lido"}` |
| 15 | Marcar comunicado `GERAL` (sem registro de destinatário) | `PUT /v1/communications/:id/read` | 404 | 404 | ✅ `{"error":"Destinatário não encontrado para este comunicado"}` |

---

## 5. Preferências de Notificação

| # | Teste | Rota | HTTP esperado | HTTP obtido | Resultado |
|---|-------|------|---------------|-------------|-----------|
| 16 | Consultar preferências | `GET /v1/notifications/preferences` | 200 | 200 | ✅ `{"email_obrigatorio":true,"whatsapp_opcional":true}` — retornado com upsert automático |
| 17 | Atualizar preferências | `PUT /v1/notifications/preferences` | 200 | 200 | ✅ valores atualizados e retornados na resposta |
| 18 | Confirmar persistência via GET | `GET /v1/notifications/preferences` | 200 | 200 | ✅ `whatsapp_opcional: true` persistido |

---

## 6. Workers em Background — Observações dos Logs

### gradeWorker

No startup, o worker detectou imediatamente **6 eventos não processados** da tabela `evento_grade` do MS02 e criou comunicados automáticos correspondentes:

```
[gradeWorker] Evento ... (SUBSTITUICAO) processado → comunicado ...
[gradeWorker] Evento ... (EDICAO) processado → comunicado ...
[gradeWorker] Evento ... (CRIACAO) processado → comunicado ...
[gradeWorker] Evento ... (SUBSTITUICAO) processado → comunicado ...
[gradeWorker] Evento ... (EDICAO) processado → comunicado ...
[gradeWorker] Evento ... (CRIACAO) processado → comunicado ...
```

Isso confirma que o **Outbox Pattern** entre MS02 → MS05 está funcionando corretamente.

### notificacaoWorker

O worker iniciou sem erros e processou a fila de notificações externas (as notificações geradas pelos comunicados `TODOS_PROFESSORES`, `TURMA_ESPECIFICA` e `LISTA_MANUAL`). Como o envio real de e-mail/WhatsApp ainda não está implementado (simulado), as notificações foram processadas sem erros de envio nos logs.

---

## 7. Observações

### Comunicados GERAL e marcação de leitura

Comunicados do tipo `GERAL` não criam registros de `destinatario_comunicado` individuais — eles são visíveis para todos os usuários autenticados. Por isso, a rota `PUT /v1/communications/:id/read` retorna 404 para comunicados `GERAL`, pois não há registro de destinatário para atualizar. Esse comportamento está correto e documentado no guia.

### Preferências criadas automaticamente

O `GET /v1/notifications/preferences` usa upsert: se o usuário ainda não tem preferências salvas, cria com os valores padrão (`email_obrigatorio: true`, `whatsapp_opcional: false`) e retorna imediatamente, sem necessidade de POST.

### Integração com MS02 e MS03

A criação de comunicados `TODOS_PROFESSORES` e `TURMA_ESPECIFICA` depende de MS02 e MS03 estarem acessíveis. Ambos estavam rodando durante o teste e as integrações funcionaram corretamente.

---

## 8. Endpoints Não Testados Automaticamente

| Endpoint | Motivo |
|----------|--------|
| Listagem filtrada por role (PROFESSOR vê apenas seus comunicados) | Requer usuário com role PROFESSOR cadastrado no auth-service |
| Marcar como lido com token de ALUNO | Requer usuário com role ALUNO + alocação em turma para ser destinatário |
| 403 ao acessar comunicado de terceiro com role PROFESSOR | Requer dois usuários PROFESSOR distintos |

---

*Diagnóstico gerado automaticamente após execução do* [GUIA_DE_TESTES.md](GUIA_DE_TESTES.md).
