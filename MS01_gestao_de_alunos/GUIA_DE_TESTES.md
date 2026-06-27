# Guia de Testes — MS01 Gestão de Alunos
## Sistema de Gestão Escolar

> **Para quem é este guia?**
> Este documento guia você passo a passo na instalação, configuração e validação de todas as funcionalidades do MS01. Não é necessária experiência com APIs REST — cada etapa é explicada com exemplos prontos para copiar e colar.

---

## Sumário

1. [O que é o MS01?](#1-o-que-é-o-ms01)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Instalação e Preparação](#4-instalação-e-preparação)
5. [Iniciando o Serviço](#5-iniciando-o-serviço)
6. [Como Funciona a Autenticação (JWT)](#6-como-funciona-a-autenticação-jwt)
7. [Gestão de Alunos — Endpoints CRUD](#7-gestão-de-alunos--endpoints-crud)
   - [7.1 Cadastrar aluno](#71-cadastrar-aluno)
   - [7.2 Listar alunos](#72-listar-alunos)
   - [7.3 Contar alunos](#73-contar-alunos)
   - [7.4 Buscar aluno por ID](#74-buscar-aluno-por-id)
   - [7.5 Editar aluno](#75-editar-aluno)
   - [7.6 Inativar aluno (soft delete)](#76-inativar-aluno-soft-delete)
   - [7.7 Reativar aluno](#77-reativar-aluno)
8. [Frequência](#8-frequência)
   - [8.1 Lançar presença ou falta](#81-lançar-presença-ou-falta)
   - [8.2 Consultar frequência consolidada](#82-consultar-frequência-consolidada)
   - [8.3 Override de reprovação por falta](#83-override-de-reprovação-por-falta)
9. [Histórico Escolar](#9-histórico-escolar)
10. [Testando com Perfil de Aluno](#10-testando-com-perfil-de-aluno)
11. [Health Check](#11-health-check)
12. [Erros Comuns e Soluções](#12-erros-comuns-e-soluções)
13. [Referência Rápida — Todos os Endpoints](#13-referência-rápida--todos-os-endpoints)

---

## 1. O que é o MS01?

O MS01 é o **microserviço de Gestão de Alunos**. Ele é responsável por:

- **Cadastro e manutenção** dos dados dos alunos (nome, CPF, endereço, turma, etc.)
- **Registro de frequência** — lançamento de presenças e faltas por aula
- **Cálculo automático** da frequência consolidada por disciplina e bimestre
- **Override administrativo** — permite que o administrador reverta uma reprovação por falta com justificativa
- **Histórico escolar** — consulta dos resultados de anos letivos anteriores

O serviço roda na **porta 3001** e expõe todas as suas rotas sob o prefixo `/v1/students`.

> **Dependência importante:** O MS01 usa o mesmo sistema de autenticação (JWT) do `auth-service`. Isso significa que, para testar o MS01, você precisa ter o `auth-service` rodando para conseguir um token de acesso — **ou** pode gerar um token manualmente (explicado na seção 6).

---

## 2. Pré-requisitos

Antes de começar, verifique se você tem instalado:

### 2.1 Node.js 22 ou superior

```bash
node --version
# Deve exibir: v22.x.x
```

Se não tiver, baixe em: https://nodejs.org

### 2.2 npm (vem junto com o Node.js)

```bash
npm --version
# Deve exibir: 10.x.x ou superior
```

### 2.3 Ferramenta para fazer requisições HTTP

Escolha uma das opções abaixo. Os exemplos deste guia usam `curl`.

**Opção A — curl** (recomendado — já vem instalado no Windows 10/11, macOS e Linux)
```bash
curl --version
```

**Opção B — Postman** (interface visual, mais fácil para quem nunca usou uma API)
- Download: https://www.postman.com/downloads/

**Opção C — Insomnia**
- Download: https://insomnia.rest/download

### 2.4 Acesso ao banco de dados MySQL

O MS01 precisa de um schema MySQL configurado. Você precisará do endereço do servidor, porta, usuário e senha. Consulte seu grupo ou o arquivo `.env.example` para referência.

---

## 3. Configuração do Ambiente

### 3.1 Criar o arquivo .env

Na pasta do projeto, você vai encontrar um arquivo chamado `.env.example`. Ele serve como modelo. Copie-o criando um novo arquivo chamado `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (Prompt de Comando) ou macOS/Linux:**
```bash
cp .env.example .env
```

### 3.2 Preencher o arquivo .env

Abra o arquivo `.env` com qualquer editor de texto (Bloco de Notas, VS Code, etc.) e preencha os valores:

```env
PORT=3001
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@HOST:3306/NOME_DO_SCHEMA"
JWT_SECRET="mesmo_secret_do_auth_service"
```

**Explicando cada variável:**

| Variável | O que é | Exemplo |
|----------|---------|---------|
| `PORT` | Porta onde o serviço vai escutar | `3001` |
| `DATABASE_URL` | Endereço completo do banco de dados | `mysql://user:senha@servidor:3306/schema` |
| `JWT_SECRET` | Chave secreta para validar tokens JWT — **deve ser idêntica** à usada no auth-service | `minha_chave_secreta_123` |

> **Atenção:** O `JWT_SECRET` precisa ser o mesmo em todos os microsserviços do sistema. Se estiver diferente, os tokens gerados pelo auth-service não serão aceitos pelo MS01.

### 3.3 Executar o script do banco de dados

Se o banco ainda não tem as tabelas criadas, execute o arquivo `script_db_ms01.txt` no seu gerenciador MySQL (HeidiSQL, DBeaver, etc.):

1. Abra o HeidiSQL e conecte ao servidor MySQL
2. Selecione o schema correto no painel esquerdo
3. Abra o arquivo `script_db_ms01.txt`
4. Selecione todo o conteúdo e execute (tecla F9 ou botão "Executar")

Isso vai criar as tabelas: `aluno`, `frequencia_consolidada`, `registro_frequencia`, `historico_escolar`, `resultado_disciplina` e `override_frequencia`.

---

## 4. Instalação e Preparação

### 4.1 Instalar as dependências

Abra um terminal na pasta do projeto e execute:

```bash
npm install
```

Aguarde o npm baixar todos os pacotes. Isso pode levar alguns minutos na primeira vez.

### 4.2 Gerar o Prisma Client

O Prisma é a biblioteca usada para acessar o banco de dados. Antes de iniciar o serviço, é preciso gerar o client com base no schema do banco:

```bash
npx prisma generate
```

**Resposta esperada:**
```
✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client
```

> **Por que isso é necessário?** O Prisma Client é gerado a partir do arquivo `prisma/schema.prisma` e cria tipos TypeScript específicos para o seu banco. Sem esse passo, o serviço não consegue se comunicar com o banco.

---

## 5. Iniciando o Serviço

Execute o servidor em modo de desenvolvimento (com recarregamento automático ao editar arquivos):

```bash
npm run dev
```

**Resposta esperada no terminal:**
```
{"level":30,"msg":"Server listening at http://0.0.0.0:3001"}
```

Se aparecer essa mensagem, o serviço está rodando. Deixe este terminal aberto — o serviço precisa continuar em execução para os testes.

> **Dica:** Se a porta 3001 já estiver em uso por outro processo, você verá um erro `EADDRINUSE`. Nesse caso, encerre o processo que está usando a porta ou mude o valor de `PORT` no arquivo `.env`.

---

## 6. Como Funciona a Autenticação (JWT)

> **O que é JWT?** É como um "crachá digital". Quando você faz login no auth-service, recebe esse crachá. Nos pedidos seguintes ao MS01, você apresenta o crachá para provar quem é.

Todas as rotas do MS01 exigem autenticação — exceto o `/health`. Isso significa que você precisa ter um token JWT válido para fazer qualquer requisição.

### 6.1 Obtendo um token via auth-service

Se o auth-service estiver rodando na porta 3000:

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "Admin@123"
  }'
```

**Resposta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN"
}
```

**Guarde o `accessToken`** — você vai usá-lo em todas as requisições a seguir.

### 6.2 Como usar o token nas requisições

Em cada requisição, adicione o cabeçalho `Authorization` com o token:

```bash
-H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6.3 Salvar o token como variável (opcional, mas prático)

Em vez de colar o token toda vez, você pode salvá-lo em uma variável no terminal:

**Linux/macOS (bash/zsh):**
```bash
TOKEN="colar_o_accessToken_aqui"
# Depois use $TOKEN nas requisições:
curl -s http://localhost:3001/health -H "Authorization: Bearer $TOKEN"
```

**Windows PowerShell:**
```powershell
$TOKEN="colar_o_accessToken_aqui"
# Depois use $TOKEN nas requisições:
curl -s http://localhost:3001/health -H "Authorization: Bearer $TOKEN"
```

> **Atenção:** O accessToken expira em 15 minutos. Se começar a receber erros `401 Unauthorized`, basta fazer login novamente para obter um novo token.

---

## 7. Gestão de Alunos — Endpoints CRUD

> **Lembrete:** Nas requisições abaixo, substitua `SEU_TOKEN_AQUI` pelo accessToken obtido no login.

---

### 7.1 Cadastrar aluno

**Rota:** `POST /v1/students`
**Quem pode usar:** Somente `ADMIN`

```bash
curl -s -X POST http://localhost:3001/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome_completo": "João da Silva",
    "data_nascimento": "2008-03-15",
    "email": "joao.silva@aluno.escola.com",
    "cpf": "123.456.789-00",
    "telefone": "(21) 99999-0001",
    "end_logradouro": "Rua das Flores",
    "end_numero": "42",
    "end_complemento": "Apto 101",
    "end_bairro": "Centro",
    "end_cidade": "Rio de Janeiro",
    "end_estado": "RJ",
    "end_cep": "20000-000"
  }'
```

**Resposta esperada (status 201):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "matricula": "MAT-1714000000000",
  "nome_completo": "João da Silva",
  "data_nascimento": "2008-03-15T00:00:00.000Z",
  "email": "joao.silva@aluno.escola.com",
  "cpf": "123.456.789-00",
  "telefone": "(21) 99999-0001",
  "end_logradouro": "Rua das Flores",
  "end_numero": "42",
  "end_complemento": "Apto 101",
  "end_bairro": "Centro",
  "end_cidade": "Rio de Janeiro",
  "end_estado": "RJ",
  "end_cep": "20000-000",
  "turma_atual_id": null,
  "status": "ATIVO",
  "created_at": "2026-04-07T12:00:00.000Z",
  "updated_at": "2026-04-07T12:00:00.000Z"
}
```

**O que validar:**
- ✅ Status HTTP 201 (criado com sucesso)
- ✅ Campo `id` presente (UUID gerado automaticamente)
- ✅ Campo `matricula` gerado no formato `MAT-{timestamp}` (pois não foi enviado)
- ✅ Campo `status` é `"ATIVO"` por padrão

> **Campos obrigatórios:** `nome_completo`, `data_nascimento`, `email`, `cpf`, `end_logradouro`, `end_numero`, `end_bairro`, `end_cidade`, `end_estado` (máximo 2 letras) e `end_cep`.
>
> **Campos opcionais:** `matricula` (gerada automaticamente se omitida), `telefone`, `end_complemento`, `turma_atual_id`.

> **Guarde o `id` retornado!** Você vai precisar dele nas próximas etapas. Vamos chamá-lo de `ID_ALUNO_JOAO`.

---

### 7.2 Listar alunos

**Rota:** `GET /v1/students`
**Quem pode usar:** `ADMIN` (sem restrição) · `PROFESSOR` (obrigatório informar `turma_id`)

> **Por que PROFESSOR pode listar?** A listagem por turma é o que alimenta a chamada de frequência e o lançamento de notas. O professor só consegue ver os alunos da turma específica que informar — qualquer chamada sem `turma_id` retorna 403.

#### Listagem básica

```bash
curl -s http://localhost:3001/v1/students \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (status 200):**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "matricula": "MAT-1714000000000",
      "nome_completo": "João da Silva",
      "status": "ATIVO",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**O que validar:**
- ✅ O aluno criado aparece na lista
- ✅ Os resultados estão em ordem alfabética por nome

#### Filtrar por status

```bash
# Listar somente alunos ATIVOS
curl -s "http://localhost:3001/v1/students?status=ATIVO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Listar somente alunos INATIVOS
curl -s "http://localhost:3001/v1/students?status=INATIVO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Os valores válidos para `status` são: `ATIVO`, `INATIVO`, `TRANSFERIDO`

#### Paginação

```bash
# Primeira página, 5 itens por página
curl -s "http://localhost:3001/v1/students?page=1&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Segunda página
curl -s "http://localhost:3001/v1/students?page=2&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por turma (obrigatório quando o token é de PROFESSOR)

```bash
# PROFESSOR — listar alunos de uma turma específica
curl -s "http://localhost:3001/v1/students?turma_id=UUID_DA_TURMA" \
  -H "Authorization: Bearer TOKEN_PROFESSOR"
```

**Resposta esperada (status 200):** lista contendo apenas os alunos cujo `turma_atual_id` é o informado.

**Testando o erro — PROFESSOR sem `turma_id`:**
```bash
curl -s http://localhost:3001/v1/students \
  -H "Authorization: Bearer TOKEN_PROFESSOR"
```
**Resposta esperada (status 403):**
```json
{ "error": "Professor deve filtrar por turma_id" }
```

> **Por que essa regra existe?** O professor precisa listar os alunos das suas turmas para fazer chamada e lançar notas — mas não deve enxergar a base completa de alunos da escola. Ao exigir `turma_id`, garantimos que ele só consulta o recorte da turma com que está trabalhando.

---

### 7.3 Contar alunos

**Rota:** `GET /v1/students/count`
**Quem pode usar:** Somente `ADMIN`

```bash
curl -s http://localhost:3001/v1/students/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (status 200):**
```json
{ "total": 1 }
```

---

### 7.4 Buscar aluno por ID

**Rota:** `GET /v1/students/:id`
**Quem pode usar:** `ADMIN` (qualquer aluno) ou `ALUNO` (apenas o próprio)

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (status 200):**
```json
{
  "id": "a1b2c3d4-...",
  "matricula": "MAT-1714000000000",
  "nome_completo": "João da Silva",
  "email": "joao.silva@aluno.escola.com",
  "status": "ATIVO",
  ...
}
```

**Testando o erro — ID inexistente:**
```bash
curl -s http://localhost:3001/v1/students/id-que-nao-existe \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```
**Resposta esperada (status 404):**
```json
{ "error": "Registro não encontrado" }
```

---

### 7.5 Editar aluno

**Rota:** `PUT /v1/students/:id`
**Quem pode usar:** Somente `ADMIN`

Você pode atualizar qualquer campo do aluno enviando apenas os campos que deseja alterar — não precisa enviar tudo de novo.

**Exemplo: atualizar apenas o telefone:**
```bash
curl -s -X PUT http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "telefone": "(21) 88888-0001" }'
```

**Exemplo: atualizar múltiplos campos:**
```bash
curl -s -X PUT http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "end_logradouro": "Av. Brasil",
    "end_numero": "1000",
    "end_bairro": "Penha",
    "end_cep": "21010-000"
  }'
```

**Resposta esperada (status 200):**
```json
{
  "id": "a1b2c3d4-...",
  "nome_completo": "João da Silva",
  "telefone": "(21) 88888-0001",
  ...
}
```

**O que validar:**
- ✅ Os campos enviados foram alterados
- ✅ Os campos não enviados permanecem inalterados

---

### 7.6 Inativar aluno (soft delete)

**Rota:** `DELETE /v1/students/:id`
**Quem pode usar:** Somente `ADMIN`

> **O que é soft delete?** Em vez de apagar o aluno do banco de dados (o que perderia todo o histórico), o sistema apenas muda o `status` do aluno para `"INATIVO"`. O aluno continua no banco, mas não aparece nas listagens de alunos ativos.

```bash
curl -s -X DELETE http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status HTTP **204** (sem conteúdo no body — isso é normal)

**Verificando que funcionou:**
```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

A resposta deve mostrar `"status": "INATIVO"`:
```json
{
  "id": "a1b2c3d4-...",
  "nome_completo": "João da Silva",
  "status": "INATIVO",
  ...
}
```

---

### 7.7 Reativar aluno

Para continuar os testes, reative o aluno usando o endpoint de edição:

```bash
curl -s -X PUT http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "status": "ATIVO" }'
```

**Resposta esperada (status 200):** Dados do aluno com `"status": "ATIVO"`

---

## 8. Frequência

O sistema de frequência funciona em duas camadas:

1. **`registro_frequencia`** — cada lançamento individual (uma presença ou falta em uma aula específica)
2. **`frequencia_consolidada`** — resumo calculado automaticamente (total de aulas, presenças, faltas e percentual) por aluno/disciplina/bimestre

A **frequência mínima** para aprovação por presença é **75%**. Se o aluno cair abaixo disso, o campo `reprovado_por_falta` na frequência consolidada fica `true`.

---

### 8.1 Lançar presença ou falta

**Rota:** `POST /v1/students/:id/frequency`
**Quem pode usar:** `PROFESSOR` ou `ADMIN`

> **Efeito automático:** A cada lançamento, o sistema recalcula automaticamente a frequência consolidada daquele aluno na disciplina e bimestre informados.

**Lançando uma presença:**
```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "UUID_DA_DISCIPLINA",
    "turma_id": "UUID_DA_TURMA",
    "data": "2026-04-07",
    "presente": true,
    "bimestre": 1
  }'
```

**Lançando uma falta:**
```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "UUID_DA_DISCIPLINA",
    "turma_id": "UUID_DA_TURMA",
    "data": "2026-04-08",
    "presente": false,
    "bimestre": 1
  }'
```

**Resposta esperada (status 201):**
```json
{
  "id": "uuid-do-registro",
  "aluno_id": "ID_ALUNO_JOAO",
  "disciplina_id": "UUID_DA_DISCIPLINA",
  "turma_id": "UUID_DA_TURMA",
  "professor_id": "uuid-do-professor",
  "data": "2026-04-07T00:00:00.000Z",
  "presente": true,
  "bimestre": 1,
  "observacao": null
}
```

**O que validar:**
- ✅ Status 201
- ✅ `presente` reflete o valor enviado
- ✅ `bimestre` precisa ser um número inteiro entre 1 e 4

> **Campos obrigatórios:** `disciplina_id`, `turma_id`, `data` (formato YYYY-MM-DD), `presente` (true ou false), `bimestre` (1 a 4)
>
> **Campo opcional:** `observacao` (texto livre), `professor_id` (quando quem lança é um ADMIN e quer registrar em nome de um professor específico)

**Para simular um cenário de reprovação por falta**, lance 4 faltas e 1 presença:

```bash
# Presença na aula 1
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "disciplina_id": "UUID_DA_DISCIPLINA", "turma_id": "UUID_DA_TURMA", "data": "2026-04-07", "presente": true, "bimestre": 1 }'

# Falta na aula 2
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "disciplina_id": "UUID_DA_DISCIPLINA", "turma_id": "UUID_DA_TURMA", "data": "2026-04-08", "presente": false, "bimestre": 1 }'

# Falta na aula 3
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "disciplina_id": "UUID_DA_DISCIPLINA", "turma_id": "UUID_DA_TURMA", "data": "2026-04-09", "presente": false, "bimestre": 1 }'

# Falta na aula 4
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "disciplina_id": "UUID_DA_DISCIPLINA", "turma_id": "UUID_DA_TURMA", "data": "2026-04-10", "presente": false, "bimestre": 1 }'

# Falta na aula 5
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "disciplina_id": "UUID_DA_DISCIPLINA", "turma_id": "UUID_DA_TURMA", "data": "2026-04-11", "presente": false, "bimestre": 1 }'
```

Após esses 5 lançamentos: 1 presença em 5 aulas = **20% de frequência** → `reprovado_por_falta: true`

---

### 8.2 Consultar frequência consolidada

**Rota:** `GET /v1/students/:id/frequency`
**Quem pode usar:** `ADMIN`, `PROFESSOR` (qualquer aluno) ou `ALUNO` (apenas o próprio)

#### Consulta básica (todas as disciplinas)

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (status 200):**
```json
[
  {
    "id": "uuid-da-frequencia-consolidada",
    "aluno_id": "ID_ALUNO_JOAO",
    "disciplina_id": "UUID_DA_DISCIPLINA",
    "turma_id": "UUID_DA_TURMA",
    "bimestre": 1,
    "total_aulas": 5,
    "total_presencas": 1,
    "percentual": "20",
    "reprovado_por_falta": true
  }
]
```

**O que validar:**
- ✅ `total_aulas` = número de lançamentos feitos
- ✅ `total_presencas` ≤ `total_aulas`
- ✅ `percentual` = `(total_presencas / total_aulas) * 100` (retornado como string)
- ✅ `reprovado_por_falta` é `true` se percentual < 75%

#### Filtrar por bimestre

```bash
curl -s "http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency?bimestre=1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por disciplina

```bash
curl -s "http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency?disciplina_id=UUID_DA_DISCIPLINA" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por bimestre e disciplina ao mesmo tempo

```bash
curl -s "http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency?bimestre=1&disciplina_id=UUID_DA_DISCIPLINA" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

### 8.3 Override de reprovação por falta

**Rota:** `POST /v1/students/:id/frequency/override`
**Quem pode usar:** Somente `ADMIN`

Esta rota permite que o administrador reverta uma reprovação por falta. Isso acontece quando o aluno apresenta, por exemplo, um atestado médico que justifique as faltas. O sistema cria um registro de override e marca `reprovado_por_falta` como `false` na frequência consolidada.

> **Pré-requisito:** O aluno precisa ter um registro de frequência consolidada na disciplina informada. Se a consulta de frequência retornar vazio, faça ao menos um lançamento primeiro.

```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "UUID_DA_DISCIPLINA",
    "justificativa": "Aluno apresentou atestado médico cobrindo todas as ausências do período"
  }'
```

**Resposta esperada (status 201):**
```json
{
  "id": "uuid-do-override",
  "aluno_id": "ID_ALUNO_JOAO",
  "disciplina_id": "UUID_DA_DISCIPLINA",
  "admin_id": "uuid-do-admin",
  "justificativa": "Aluno apresentou atestado médico cobrindo todas as ausências do período",
  "data_decisao": "2026-04-12T10:00:00.000Z",
  "status_anterior": true
}
```

**Verificando o efeito do override:**
```bash
curl -s "http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency?disciplina_id=UUID_DA_DISCIPLINA" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

O campo `reprovado_por_falta` agora deve ser `false`:
```json
[
  {
    ...
    "percentual": "20",
    "reprovado_por_falta": false
  }
]
```

**O que validar:**
- ✅ `status_anterior: true` no retorno do override (confirma que havia reprovação antes)
- ✅ Após o override, `reprovado_por_falta` na frequência consolidada passou para `false`

**Testando o erro — justificativa muito curta:**

A justificativa precisa ter pelo menos 10 caracteres:

```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "UUID_DA_DISCIPLINA",
    "justificativa": "Curta"
  }'
```

**Resposta esperada (status 400):**
```json
{ "error": "body/justificativa must NOT have fewer than 10 characters" }
```

---

## 9. Histórico Escolar

**Rota:** `GET /v1/students/:id/history`
**Quem pode usar:** `ADMIN` ou `ALUNO` (apenas o próprio)

O histórico escolar registra os resultados anuais do aluno por disciplina (notas finais, situação de aprovação/reprovação). Ele é populado pelo MS-04 ao encerrar o período letivo.

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO/history \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (status 200):**
```json
[
  {
    "id": "uuid-do-historico",
    "aluno_id": "ID_ALUNO_JOAO",
    "ano_letivo": 2025,
    "situacao": "APROVADO",
    "resultado_disciplina": [
      {
        "id": "uuid-resultado",
        "historico_id": "uuid-do-historico",
        "disciplina_id": "UUID_DA_DISCIPLINA",
        "media_final": "7.50",
        "status_final": "APROVADO"
      }
    ]
  }
]
```

> **Observação:** Se o aluno foi cadastrado recentemente e ainda não houve encerramento de período letivo, a resposta será uma lista vazia `[]`. Isso é esperado.

**Testando o controle de acesso:**

Se tentar acessar o histórico de outro aluno com token de aluno:
```bash
curl -s http://localhost:3001/v1/students/ID_DE_OUTRO_ALUNO/history \
  -H "Authorization: Bearer TOKEN_DO_ALUNO_JOAO"
```

**Resposta esperada (status 403):**
```json
{ "error": "Acesso negado" }
```

---

## 10. Testando com Perfil de Aluno

Para testar as rotas que se comportam diferente para alunos, você precisa de um token com `role: ALUNO`. Isso exige criar um usuário de acesso vinculado ao aluno no banco de dados do auth-service.

### 10.1 Criar usuário com role ALUNO

Execute o SQL abaixo no schema do auth-service, substituindo os valores:

```sql
INSERT INTO usuario (id, email, senha_hash, role, referencia_id, ativo)
VALUES (
  UUID(),
  'joao.aluno@escola.com',
  '$2b$10$HASH_DA_SENHA_AQUI',
  'ALUNO',
  'ID_ALUNO_JOAO',
  TRUE
);
```

Para gerar o hash da senha, rode no terminal dentro da pasta do projeto:
```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('Senha@123', 10))"
```

### 10.2 Fazer login como aluno

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "joao.aluno@escola.com", "senha": "Senha@123" }'
```

Guarde o `accessToken` retornado. Vamos chamá-lo de `TOKEN_ALUNO`.

### 10.3 Aluno vê o próprio perfil via /me

```bash
curl -s http://localhost:3001/v1/students/me \
  -H "Authorization: Bearer TOKEN_ALUNO"
```

**Resposta esperada (status 200):** Dados completos do aluno João da Silva.

### 10.4 Aluno tenta acessar /me com token de Admin (deve falhar)

A rota `/me` é exclusiva para alunos:

```bash
curl -s http://localhost:3001/v1/students/me \
  -H "Authorization: Bearer TOKEN_DO_ADMIN"
```

**Resposta esperada (status 403):**
```json
{ "error": "Rota exclusiva para alunos" }
```

### 10.5 Aluno tenta acessar dados de outro aluno (deve falhar)

```bash
curl -s http://localhost:3001/v1/students/ID_DE_OUTRO_ALUNO \
  -H "Authorization: Bearer TOKEN_ALUNO"
```

**Resposta esperada (status 403):**
```json
{ "error": "Acesso negado" }
```

### 10.6 Aluno consulta a própria frequência

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Authorization: Bearer TOKEN_ALUNO"
```

**Resposta esperada (status 200):** Lista de frequências consolidadas do próprio aluno.

### 10.7 Aluno tenta cadastrar outro aluno (deve falhar)

Endpoints de escrita são restritos ao ADMIN:

```bash
curl -s -X POST http://localhost:3001/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ALUNO" \
  -d '{ "nome_completo": "Tentativa", "data_nascimento": "2010-01-01", "email": "test@test.com", "cpf": "000.000.000-00", "end_logradouro": "Rua X", "end_numero": "1", "end_bairro": "B", "end_cidade": "C", "end_estado": "SP", "end_cep": "00000-000" }'
```

**Resposta esperada (status 403):**
```json
{ "error": "Permissão insuficiente" }
```

---

## 11. Health Check

**Rota:** `GET /health`
**Autenticação:** Não necessária

Confirma que o serviço está no ar:

```bash
curl -s http://localhost:3001/health
```

**Resposta esperada (status 200):**
```json
{ "status": "ok", "service": "ms01-gestao-de-alunos" }
```

Se não receber essa resposta, verifique se o serviço está rodando (seção 5).

---

## 12. Erros Comuns e Soluções

| Código | Mensagem | Causa provável | Solução |
|--------|----------|---------------|---------|
| `401` | `Unauthorized` | Token ausente, expirado ou inválido | Refaça o login. Certifique-se de incluir o cabeçalho `Authorization: Bearer SEU_TOKEN` |
| `401` | (sem mensagem) | `JWT_SECRET` diferente entre serviços | Confirme que o `.env` do MS01 tem o mesmo `JWT_SECRET` que o auth-service |
| `403` | `Permissão insuficiente` | Role do usuário não tem acesso àquela rota | Use um token de ADMIN para ações administrativas |
| `403` | `Acesso negado` | Aluno tentou acessar dados de outro aluno | Um aluno só pode ver os próprios dados |
| `403` | `Rota exclusiva para alunos` | Admin tentou acessar `/me` | Essa rota só funciona com token de ALUNO |
| `404` | `Registro não encontrado` | ID não existe no banco | Confirme o ID com um `GET /v1/students` |
| `409` | `Registro já existe` | Email ou CPF já cadastrado | Use dados diferentes ou consulte se já existe |
| `400` | `body/campo must be ...` | Campo enviado com formato inválido | Verifique o tipo do campo (string, boolean, integer) |
| `Connection refused` | — | O serviço não está rodando | Execute `npm run dev` na pasta do projeto |
| `Can't reach database server` | — | Banco de dados inacessível | Verifique a `DATABASE_URL` no `.env` e o acesso à rede |

---

## 13. Referência Rápida — Todos os Endpoints

### Gestão de Alunos

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/students` | ADMIN, PROFESSOR (com `turma_id`) | Lista alunos com paginação, filtro por status e por turma |
| `GET` | `/v1/students/count` | ADMIN | Contagem total de alunos |
| `GET` | `/v1/students/me` | ALUNO | Perfil do aluno autenticado |
| `GET` | `/v1/students/:id` | ADMIN, ALUNO (próprio) | Dados completos de um aluno |
| `POST` | `/v1/students` | ADMIN | Cadastra novo aluno |
| `PUT` | `/v1/students/:id` | ADMIN | Atualiza dados do aluno |
| `DELETE` | `/v1/students/:id` | ADMIN | Inativa aluno (soft delete → INATIVO) |

### Frequência

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/students/:id/frequency` | ADMIN, PROFESSOR, ALUNO (próprio) | Frequência consolidada com filtros opcionais |
| `POST` | `/v1/students/:id/frequency` | ADMIN, PROFESSOR | Lança presença ou falta — recalcula automaticamente |
| `POST` | `/v1/students/:id/frequency/override` | ADMIN | Reverte reprovação por falta com justificativa |

### Histórico Escolar

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `GET` | `/v1/students/:id/history` | ADMIN, ALUNO (próprio) | Histórico acadêmico por ano com resultados por disciplina |

### Utilitários

| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| `GET` | `/health` | Não | Verifica se o serviço está no ar |

---

## Dicas Finais

### Usando no Postman

1. Crie uma nova **Collection** chamada "MS01 — Gestão de Alunos"
2. Adicione uma variável de coleção chamada `token` (deixe vazia no início)
3. No request de login (auth-service), na aba **Tests**, cole:
   ```javascript
   const json = pm.response.json()
   pm.collectionVariables.set("token", json.accessToken)
   ```
4. Nos demais requests, no cabeçalho adicione:
   - **Key:** `Authorization`
   - **Value:** `Bearer {{token}}`

Assim o token é atualizado automaticamente a cada login.

### Renovar o token quando expirar

O token expira em 15 minutos. Para renovar rapidamente pelo terminal:

**Linux/macOS:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token renovado!"
```

**Windows PowerShell:**
```powershell
$response = curl -s -X POST http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@escola.com","senha":"Admin@123"}' | ConvertFrom-Json
$TOKEN = $response.accessToken
Write-Host "Token renovado!"
```
