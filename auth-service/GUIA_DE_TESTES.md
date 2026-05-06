# Guia de Testes — Auth Service
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Passo a passo completo para instalar, configurar e validar todas as funcionalidades do Auth Service, mesmo sem experiência prévia com APIs.

---

## Sumário

1. [O que é o Auth Service?](#1-o-que-é-o-auth-service)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Endpoints — Login](#6-endpoints--login)
7. [Endpoints — Refresh Token](#7-endpoints--refresh-token)
8. [Endpoints — Validar Token](#8-endpoints--validar-token)
9. [Testando Erros Comuns](#9-testando-erros-comuns)
10. [Health Check](#10-health-check)
11. [Referência Rápida](#11-referência-rápida)

---

## 1. O que é o Auth Service?

O Auth Service é o **portão de entrada** de todo o sistema. Ele é responsável por:

- **Login** — verificar e-mail e senha, retornar tokens JWT
- **Refresh** — renovar o accessToken sem precisar fazer login novamente
- **Validação** — confirmar que um token é válido e retornar os dados do usuário

Todos os outros microserviços dependem do token gerado aqui para validar requisições. O serviço roda na **porta 3000**.

### Como funciona o JWT?

Ao fazer login, você recebe dois tokens:

| Token | Validade | Para que serve |
|-------|----------|----------------|
| `accessToken` | 15 minutos | Autenticar requisições nos outros MSs |
| `refreshToken` | 7 dias | Obter um novo accessToken sem logar novamente |

---

## 2. Pré-requisitos

- **Node.js 22+** — `node --version`
- **npm** — `npm --version`
- **curl** (já vem no Windows 10/11, macOS e Linux) ou Postman

---

## 3. Configuração do Ambiente

### 3.1 Criar o arquivo .env

Copie o `.env.example` e crie o `.env`:

```bash
cp .env.example .env
```

Preencha com:

```env
PORT=3000
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_raphaelestrella"
JWT_SECRET="change_this_secret_in_production_auth"
JWT_REFRESH_SECRET="change_this_refresh_secret_in_production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

> **Atenção:** `JWT_SECRET` e `JWT_REFRESH_SECRET` precisam ser iguais em todos os microserviços.

### 3.2 Executar o script do banco

Execute o arquivo `script_auth.sql` no HeidiSQL ou DBeaver conectado ao servidor MySQL. Ele cria a tabela `usuario` e insere o administrador padrão:

- **E-mail:** `admin@escola.com`
- **Senha:** `Admin@123`

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
{"msg":"Server listening at http://0.0.0.0:3000"}
```

---

## 6. Endpoints — Login

**Rota:** `POST /v1/auth/login`
**Autenticação:** Não necessária

### 6.1 Login com admin

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}'
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN"
}
```

**O que validar:**
- ✅ Status 200
- ✅ `accessToken` presente (string longa começando com `eyJ`)
- ✅ `refreshToken` presente
- ✅ `role` é `"ADMIN"`

> **Guarde os dois tokens!** Você vai precisar deles nas próximas etapas.

### 6.2 Salvar o token como variável (opcional)

**Linux/macOS:**
```bash
RESP=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}')
TOKEN=$(echo $RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH=$(echo $RESP | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
```

**Windows PowerShell:**
```powershell
$resp = curl -s -X POST http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@escola.com","senha":"Admin@123"}' | ConvertFrom-Json
$TOKEN = $resp.accessToken
$REFRESH = $resp.refreshToken
```

---

## 7. Endpoints — Refresh Token

**Rota:** `POST /v1/auth/refresh`
**Autenticação:** Não necessária

Quando o `accessToken` expirar (após 15 minutos), use o `refreshToken` para obter um novo sem precisar logar novamente:

```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"SEU_REFRESH_TOKEN_AQUI"}'
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**O que validar:**
- ✅ Novo `accessToken` retornado
- ✅ O `refreshToken` original continua válido (não muda)

---

## 8. Endpoints — Validar Token

**Rota:** `GET /v1/auth/validate`
**Autenticação:** Necessária (accessToken)

Confirma que o token é válido e retorna os dados do usuário embutidos nele:

```bash
curl -s http://localhost:3000/v1/auth/validate \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "valid": true,
  "user": {
    "sub": "uuid-do-admin",
    "role": "ADMIN",
    "referenciaId": null,
    "turmaId": null,
    "iat": 1714000000,
    "exp": 1714000900
  }
}
```

**O que validar:**
- ✅ `valid: true`
- ✅ `role` corresponde ao usuário logado
- ✅ `sub` contém o UUID do usuário

---

## 9. Testando Erros Comuns

### 9.1 Senha incorreta (deve retornar 401)

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"senha_errada"}'
```

**Resposta esperada (401):**
```json
{ "error": "Credenciais inválidas" }
```

### 9.2 Usuário inexistente (deve retornar 401)

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"naoexiste@escola.com","senha":"qualquer"}'
```

**Resposta esperada (401):**
```json
{ "error": "Credenciais inválidas" }
```

### 9.3 Refresh token inválido (deve retornar 401)

```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"token.invalido.aqui"}'
```

**Resposta esperada (401):**
```json
{ "error": "Refresh token inválido ou expirado" }
```

### 9.4 Validar token inválido (deve retornar 401)

```bash
curl -s http://localhost:3000/v1/auth/validate \
  -H "Authorization: Bearer token.invalido.aqui"
```

**Resposta esperada (401):** Erro de JWT

### 9.5 Refresh sem body (deve retornar 400)

```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta esperada (400):**
```json
{ "error": "refreshToken obrigatório" }
```

---

## 10. Health Check

**Rota:** `GET /health`
**Autenticação:** Não necessária

```bash
curl -s http://localhost:3000/health
```

**Resposta esperada (200):**
```json
{ "status": "ok", "service": "auth-service" }
```

---

## 11. Referência Rápida

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/v1/auth/login` | ❌ | Login — retorna accessToken e refreshToken |
| `POST` | `/v1/auth/refresh` | ❌ | Renova o accessToken |
| `GET` | `/v1/auth/validate` | ✅ | Valida o token e retorna dados do usuário |
| `GET` | `/health` | ❌ | Health check |

### Erros comuns

| Código | Mensagem | Causa | Solução |
|--------|----------|-------|---------|
| `401` | `Credenciais inválidas` | E-mail ou senha errados | Execute o `script_auth.sql` |
| `401` | `Refresh token inválido ou expirado` | Token expirado (7 dias) | Faça login novamente |
| `400` | `refreshToken obrigatório` | Body sem o campo refreshToken | Inclua o campo no body |
| `Connection refused` | — | Serviço não está rodando | Execute `npm run dev` |
