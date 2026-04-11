# Auth Service

> Componente compartilhado de autenticação e autorização · Porta 3000

---

## Visão Geral

O Auth Service é o componente de infraestrutura compartilhado responsável por **autenticar usuários** e **emitir tokens JWT** consumidos por todos os demais microserviços. Ele não pertence a nenhum integrante individualmente — é a fundação de segurança de todo o sistema.

Adota uma estratégia **stateless**: não há sessões armazenadas no servidor. Toda informação necessária (identidade, perfil, turma) está contida no próprio token JWT assinado.

---

## Responsabilidades

| ID | Requisito |
|---|---|
| RF-AUTH-01 | Login com e-mail e senha, retornando JWT válido |
| RF-AUTH-02 | Suporte aos três perfis: ADMIN, PROFESSOR, ALUNO |
| RF-AUTH-03 | Endpoint de validação de token para uso dos microserviços e do API Gateway |
| RF-AUTH-04 | Redefinição de senha via link por e-mail *(pendente)* |
| RF-AUTH-05 | Bloqueio de usuário pelo Admin *(parcialmente — campo `ativo` na tabela)* |
| RF-AUTH-06 | Refresh token para renovação de sessão sem novo login |

---

## Banco de Dados

**Schema:** `20261_prjint5_raphaelestrella`

O Auth Service compartilha o mesmo schema do MS-01 (Gestão de Alunos). Isso foi necessário porque o servidor de banco não permite criar novos schemas e não havia um schema dedicado para auth.

### Tabela `usuario`

Criada pelo `script_auth.sql` na raiz do projeto. **Rodar antes de iniciar o serviço pela primeira vez.**

```sql
CREATE TABLE usuario (
    id            CHAR(36)     NOT NULL,
    email         VARCHAR(255) NOT NULL,          -- login
    senha_hash    VARCHAR(255) NOT NULL,          -- bcrypt custo 10
    role          ENUM('ADMIN','PROFESSOR','ALUNO') NOT NULL,
    referencia_id CHAR(36)     NULL,              -- aluno.id ou professor.id
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_email (email)
);
```

**Campo `referencia_id`:**
- Para `ALUNO`: aponta para `aluno.id` no mesmo schema — permite incluir `turma_atual_id` no JWT
- Para `PROFESSOR`: aponta para `professor.id` no schema `gabrielsantos` *(referência lógica, sem FK real entre schemas)*
- Para `ADMIN`: `NULL`

### Relação com a tabela `aluno` (MS-01)

O Auth Service usa `include: { aluno: true }` ao buscar um usuário para incluir o `turma_atual_id` no payload do JWT. Isso é possível porque ambas as tabelas estão no mesmo schema.

---

## Arquitetura do Serviço

```
auth-service/
├── src/
│   ├── index.js              ← Fastify app, registro de plugins e rotas
│   ├── plugins/
│   │   └── prisma.js         ← Plugin que instancia e decora o PrismaClient
│   └── routes/
│       └── auth.js           ← Handlers de login, refresh, validate
├── prisma/
│   └── schema.prisma         ← Modelos: usuario, aluno (introspectados + manual)
├── .env                      ← Variáveis de ambiente (não versionar)
├── .env.example              ← Template de variáveis
├── package.json
├── Dockerfile
└── README.md
```

---

## Variáveis de Ambiente

```env
PORT=3000
DATABASE_URL="mysql://20261_prjint5_noite:SENHA@edumysql.acesso.rj.senac.br:3306/20261_prjint5_raphaelestrella"
JWT_SECRET="segredo_do_access_token"
JWT_REFRESH_SECRET="segredo_do_refresh_token_diferente_do_access"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

> O `JWT_SECRET` deve ser **exatamente igual** ao configurado em todos os outros microserviços, pois cada um valida os tokens de forma independente sem consultar o auth-service a cada requisição.

---

## Endpoints da API

### `POST /v1/auth/login`

Autentica o usuário e retorna os tokens.

**Body:**
```json
{
  "email": "admin@escola.com",
  "senha": "Admin@123"
}
```

**Resposta 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN"
}
```

**Erros:**
- `401` — Credenciais inválidas ou usuário inativo

---

### `POST /v1/auth/refresh`

Renova o access token sem exigir novo login.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros:**
- `400` — `refreshToken` não fornecido
- `401` — Refresh token inválido, expirado ou usuário inativo

---

### `GET /v1/auth/validate`

Valida o access token e retorna o payload decodificado. Usado pelo API Gateway e pelos microserviços que precisam inspecionar o token.

**Header:** `Authorization: Bearer <accessToken>`

**Resposta 200:**
```json
{
  "valid": true,
  "user": {
    "sub": "uuid-do-usuario",
    "role": "ADMIN",
    "referenciaId": null,
    "turmaId": null,
    "iat": 1234567890,
    "exp": 1234568790
  }
}
```

**Erros:**
- `401` — Token ausente, inválido ou expirado

---

### `GET /health`

```json
{ "status": "ok", "service": "auth-service" }
```

---

## Payload do JWT

```json
{
  "sub": "uuid-do-usuario-na-tabela-usuario",
  "role": "ADMIN | PROFESSOR | ALUNO",
  "referenciaId": "uuid-do-aluno-ou-professor (null para ADMIN)",
  "turmaId": "uuid-da-turma-atual (apenas para ALUNO, null para outros)",
  "iat": 1234567890,
  "exp": 1234568790
}
```

Cada microserviço extrai esses dados de `request.user` após a verificação JWT, sem precisar consultar o banco de usuários.

---

## Segurança

### Senhas

As senhas são armazenadas com **bcrypt, custo 10**, conforme exigido pelo RNF-02. Nunca são armazenadas em texto puro.

```javascript
// Hash ao criar usuário
const hash = await bcrypt.hash(senha, 10)

// Verificação no login
const valida = await bcrypt.compare(senhaFornecida, usuario.senha_hash)
```

### Tokens duplos

| Token | Expiração | Finalidade |
|---|---|---|
| **Access Token** | 15 minutos | Autoriza requisições às APIs |
| **Refresh Token** | 7 dias | Obtém novo access token sem novo login |

Os dois tokens são JWTs assinados com **segredos diferentes** (`JWT_SECRET` e `JWT_REFRESH_SECRET`). Isso impede que um refresh token seja usado onde se espera um access token e vice-versa.

A implementação no Fastify usa dois namespaces separados do plugin `@fastify/jwt`:
```javascript
fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET, namespace: 'jwt' })
fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_REFRESH_SECRET, namespace: 'refreshJwt' })
```

---

## Como Rodar

### Pré-requisito

Execute o `script_auth.sql` no schema `raphaelestrella` **antes** de subir o serviço:
```
HeidiSQL → conectar em 20261_prjint5_raphaelestrella → File > Run SQL file → script_auth.sql
```

### Desenvolvimento

```bash
cd auth-service
npm run dev
```

Saída esperada:
```
{"level":30,"msg":"Server listening at http://0.0.0.0:3000"}
```

### Produção

```bash
npm start
```

### Docker

```bash
docker build -t auth-service .
docker run -p 3000:3000 --env-file .env auth-service
```

---

## Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `fastify` | ^5.0.0 | Framework HTTP |
| `@fastify/jwt` | ^9.0.0 | Emissão e verificação de JWT (dois namespaces) |
| `@fastify/cors` | ^10.0.0 | Habilita CORS para o frontend |
| `@prisma/client` | ^6.0.0 | Client ORM gerado |
| `bcryptjs` | ^2.4.3 | Hash e verificação de senhas |
| `dotenv` | ^16.0.0 | Carregamento de variáveis de ambiente |
| `fastify-plugin` | ^5.0.0 | Encapsulamento correto de plugins Fastify |
| `prisma` *(dev)* | ^6.0.0 | CLI para `db pull` e `generate` |
| `nodemon` *(dev)* | ^3.0.0 | Reload automático em desenvolvimento |
