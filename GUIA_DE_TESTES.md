# Guia Completo de Execução e Testes
## Sistema de Gestão Escolar v3.0

> **Para quem é este guia?**
> Este documento foi escrito para qualquer membro da equipe conseguir instalar, executar e validar todas as funcionalidades do sistema do zero — mesmo sem experiência prévia com APIs REST ou microsserviços.

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração Inicial do Banco de Dados](#3-configuração-inicial-do-banco-de-dados)
4. [Instalação das Dependências](#4-instalação-das-dependências)
5. [Iniciando os Serviços](#5-iniciando-os-serviços)
6. [Como funciona a autenticação (JWT)](#6-como-funciona-a-autenticação-jwt)
7. [Auth Service — Porta 3000](#7-auth-service--porta-3000)
8. [MS-03 — Turmas e Disciplinas — Porta 3003](#8-ms-03--turmas-e-disciplinas--porta-3003)
9. [MS-02 — Gestão de Professores — Porta 3002](#9-ms-02--gestão-de-professores--porta-3002)
10. [MS-01 — Gestão de Alunos — Porta 3001](#10-ms-01--gestão-de-alunos--porta-3001)
11. [MS-04 — Avaliações e Notas — Porta 3004](#11-ms-04--avaliações-e-notas--porta-3004)
12. [MS-05 — Comunicação Escolar — Porta 3005](#12-ms-05--comunicação-escolar--porta-3005)
13. [Criando Usuários para Testes (Professor e Aluno)](#13-criando-usuários-para-testes-professor-e-aluno)
14. [Cenário Integrado Completo](#14-cenário-integrado-completo)
15. [Referência Rápida — Todos os Endpoints](#15-referência-rápida--todos-os-endpoints)

---

## 1. Visão Geral do Sistema

O sistema é composto por **6 microsserviços independentes**, cada um rodando em uma porta diferente:

| Serviço | Porta | Responsabilidade |
|---|---|---|
| **auth-service** | 3000 | Login, tokens JWT, autenticação |
| **MS-01** | 3001 | Alunos, frequência, histórico escolar |
| **MS-02** | 3002 | Professores, grade de horários, substituições |
| **MS-03** | 3003 | Turmas, disciplinas, calendário escolar |
| **MS-04** | 3004 | Avaliações, notas, médias, prova final |
| **MS-05** | 3005 | Comunicados internos, notificações externas |

Cada serviço tem seu **próprio banco de dados** (schema separado no mesmo servidor MySQL). Eles se comunicam entre si via chamadas HTTP quando necessário.

**Ordem de dependência para testes:** Auth → MS-03 → MS-02 → MS-01 → MS-04 → MS-05

---

## 2. Pré-requisitos

Antes de começar, verifique se você tem instalado:

### 2.1 Node.js 22 ou superior

```bash
node --version
# Deve exibir: v22.x.x
```

Se não tiver, baixe em: https://nodejs.org

### 2.2 npm (vem com o Node.js)

```bash
npm --version
# Deve exibir: 10.x.x ou superior
```

### 2.3 Ferramenta para fazer requisições HTTP

Escolha uma das opções abaixo:

**Opção A — curl** (recomendado para este guia, já vem no Windows 10/11, macOS e Linux)
```bash
curl --version
```

**Opção B — Postman** (interface gráfica, mais fácil para iniciantes)
- Download: https://www.postman.com/downloads/

**Opção C — Insomnia**
- Download: https://insomnia.rest/download

### 2.4 HeidiSQL ou DBeaver (para executar o script do banco de dados)

- HeidiSQL (Windows): https://www.heidisql.com/download.php
- DBeaver (todas as plataformas): https://dbeaver.io/download/

### 2.5 Acesso ao servidor MySQL da instituição

- **Host:** `edumysql.acesso.rj.senac.br`
- **Porta:** `3306`
- **Usuário:** `20261_prjint5_noite`
- **Senha:** (verificar com o grupo)

---

## 3. Configuração Inicial do Banco de Dados

> ⚠️ **Este passo precisa ser feito apenas uma vez.** Se já foi feito anteriormente, pule para a seção 4.

### 3.1 Executar o script do Auth Service

O auth-service precisa criar a tabela `usuario` e inserir o usuário administrador padrão.

1. Abra o HeidiSQL e conecte ao servidor MySQL
2. Abra o arquivo `script_auth.sql` na raiz do projeto
3. Selecione todo o conteúdo e execute (F9 ou botão "Executar")

Isso criará a tabela `usuario` no schema `20261_prjint5_raphaelestrella` e inserirá o admin padrão:
- **E-mail:** `admin@escola.com`
- **Senha:** `Admin@123`

### 3.2 Verificar os schemas dos outros MSs

Os outros microserviços já têm seus schemas criados no banco. Para confirmar, execute via HeidiSQL:

```sql
SHOW TABLES IN `20261_prjint5_carlossoares`;    -- MS-04
SHOW TABLES IN `20261_prjint5_andrebezerra`;    -- MS-03
SHOW TABLES IN `20261_prjint5_gabrielsantos`;   -- MS-02
SHOW TABLES IN `20261_prjint5_otaviosilva`;     -- MS-05
-- (MS-01 tem seu próprio schema também)
```

Se algum schema estiver vazio, execute o script SQL correspondente (`script_db_ms0X.sql`) da mesma forma que o `script_auth.sql`.

---

## 4. Instalação das Dependências

Abra um terminal na pasta raiz do projeto e execute para **cada** serviço:

```bash
# Auth Service
cd auth-service
npm install
cd ..

# MS-01
cd MS01_gestao_de_alunos
npm install
cd ..

# MS-02
cd MS02_gestao_de_professores
npm install
cd ..

# MS-03
cd MS03_turmas_e_disciplinas
npm install
cd ..

# MS-04
cd MS04_avaliacoes_e_notas
npm install
cd ..

# MS-05
cd MS05_comunicacao_escolar
npm install
cd ..
```

> 💡 **Dica:** Se você usa **PowerShell no Windows**, o comando `cd ..` funciona da mesma forma.

### 4.1 Configurar os arquivos .env

Cada serviço tem um arquivo `.env` com as credenciais do banco. Verifique se todos estão configurados corretamente. Exemplo para o Auth Service:

```bash
cat auth-service/.env
```

A senha do banco deve ser a senha correta do MySQL da instituição. Se precisar atualizar, edite o arquivo `.env` diretamente.

### 4.2 Gerar o Prisma Client

Cada serviço usa o Prisma para acessar o banco. Antes de iniciar, garanta que o client está gerado:

```bash
cd auth-service && npx prisma generate && cd ..
cd MS01_gestao_de_alunos && npx prisma generate && cd ..
cd MS02_gestao_de_professores && npx prisma generate && cd ..
cd MS03_turmas_e_disciplinas && npx prisma generate && cd ..
cd MS04_avaliacoes_e_notas && npx prisma generate && cd ..
cd MS05_comunicacao_escolar && npx prisma generate && cd ..
```

---

## 5. Iniciando os Serviços

Você precisa de **6 terminais abertos simultaneamente** (um para cada serviço). Em cada terminal, entre na pasta do serviço e execute `npm run dev`.

**Terminal 1 — Auth Service:**
```bash
cd auth-service
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3000
```

**Terminal 2 — MS-01:**
```bash
cd MS01_gestao_de_alunos
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3001
```

**Terminal 3 — MS-02:**
```bash
cd MS02_gestao_de_professores
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3002
```

**Terminal 4 — MS-03:**
```bash
cd MS03_turmas_e_disciplinas
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3003
```

**Terminal 5 — MS-04:**
```bash
cd MS04_avaliacoes_e_notas
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3004
```

**Terminal 6 — MS-05:**
```bash
cd MS05_comunicacao_escolar
npm run dev
# Aguarde: Server listening at http://0.0.0.0:3005
```

### 5.1 Verificando se todos os serviços estão no ar

Execute os health checks de todos os serviços:

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

**Resposta esperada para cada um:**
```json
{ "status": "ok", "service": "nome-do-servico" }
```

Se algum serviço não responder, verifique o terminal correspondente para ver a mensagem de erro.

---

## 6. Como Funciona a Autenticação (JWT)

> **O que é JWT?** É um "crachá digital" que você recebe ao fazer login. Você precisa apresentar esse crachá em todas as requisições que não são públicas.

### Fluxo básico:

1. Você faz login no **Auth Service** com e-mail e senha
2. Recebe um **accessToken** (válido por 15 minutos) e um **refreshToken** (válido por 7 dias)
3. Em todas as outras requisições, você inclui o accessToken no cabeçalho `Authorization`
4. Quando o accessToken expirar, use o refreshToken para obter um novo

### Como incluir o token nas requisições:

```bash
# Coloque sempre este cabeçalho nas requisições autenticadas:
-H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Dica para guardar o token no terminal:

**Linux/macOS:**
```bash
TOKEN="colar_o_accessToken_aqui"
# Depois use $TOKEN nas requisições
```

**Windows PowerShell:**
```powershell
$TOKEN="colar_o_accessToken_aqui"
# Depois use $TOKEN nas requisições
```

---

## 7. Auth Service — Porta 3000

### 7.1 Login

**Objetivo:** Obter o token JWT para usar nas demais requisições.

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "Admin@123"
  }'
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
- ✅ `role` é `"ADMIN"`

**Guarde o accessToken!** Você vai usar ele em todas as requisições seguintes.

**Erro comum — 401:**
```json
{ "error": "Credenciais inválidas" }
```
Isso significa que o `script_auth.sql` não foi executado, ou a senha está incorreta.

---

### 7.2 Renovar o token (Refresh)

Quando o `accessToken` expirar (após 15 minutos), use o `refreshToken` para obter um novo:

```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "SEU_REFRESH_TOKEN_AQUI"
  }'
```

**Resposta esperada (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 7.3 Validar o token

Confirma que o token é válido e retorna as informações do usuário:

```bash
curl -s http://localhost:3000/v1/auth/validate \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "valid": true,
  "user": {
    "sub": "uuid-do-admin",
    "role": "ADMIN",
    "referenciaId": null,
    "turmaId": null
  }
}
```

---

## 8. MS-03 — Turmas e Disciplinas — Porta 3003

> **Por que começar pelo MS-03?** Disciplinas e turmas são referenciadas por todos os outros serviços. Precisamos criá-las primeiro.

> 🔑 **Lembrete:** Substitua `SEU_TOKEN_AQUI` pelo `accessToken` obtido no login do Admin.

---

### 8.1 Disciplinas

#### Criar uma disciplina

```bash
curl -s -X POST http://localhost:3003/v1/disciplines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Matemática",
    "carga_horaria": 80
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-gerado-automaticamente",
  "nome": "Matemática",
  "carga_horaria": 80,
  "created_at": "2026-04-11T12:00:00.000Z",
  "updated_at": "2026-04-11T12:00:00.000Z"
}
```

> 📋 **Guarde o `id` retornado!** Você precisará dele para criar turmas e avaliações. Vamos chamá-lo de `ID_DISCIPLINA_MATEMATICA`.

Crie mais uma disciplina para testes:

```bash
curl -s -X POST http://localhost:3003/v1/disciplines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Português",
    "carga_horaria": 60
  }'
```

#### Listar todas as disciplinas

```bash
curl -s http://localhost:3003/v1/disciplines \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
[
  { "id": "...", "nome": "Matemática", "carga_horaria": 80, ... },
  { "id": "...", "nome": "Português", "carga_horaria": 60, ... }
]
```

**O que validar:**
- ✅ As duas disciplinas criadas aparecem na lista
- ✅ Ordem alfabética

#### Buscar disciplina por ID

```bash
curl -s http://localhost:3003/v1/disciplines/ID_DISCIPLINA_MATEMATICA \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Editar disciplina

```bash
curl -s -X PUT http://localhost:3003/v1/disciplines/ID_DISCIPLINA_MATEMATICA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "carga_horaria": 100 }'
```

**O que validar:**
- ✅ `carga_horaria` agora é 100

---

### 8.2 Calendário Escolar

#### Criar um evento no calendário

```bash
curl -s -X POST http://localhost:3003/v1/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "data": "2026-04-21",
    "descricao": "Tiradentes — Feriado Nacional",
    "tipo": "FERIADO"
  }'
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

> 📋 **Guarde o `id` do evento!** Vamos chamá-lo de `ID_CALENDARIO`.

Os valores válidos para `tipo` são: `AULA`, `FERIADO`, `RECESSO`, `EVENTO`

#### Listar eventos do calendário

```bash
curl -s http://localhost:3003/v1/calendar/events \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar eventos por tipo

```bash
curl -s "http://localhost:3003/v1/calendar/events?tipo=FERIADO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar eventos por período

```bash
curl -s "http://localhost:3003/v1/calendar/events?data_inicio=2026-04-01&data_fim=2026-04-30" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

### 8.3 Turmas

#### Criar uma turma

```bash
curl -s -X POST http://localhost:3003/v1/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "codigo": "3A-2026",
    "ano_letivo": 2026,
    "turno": "NOITE",
    "calendario_id": "ID_CALENDARIO"
  }'
```

> ⚠️ Substitua `ID_CALENDARIO` pelo ID do evento de calendário criado anteriormente.

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

> 📋 **Guarde o `id` da turma!** Vamos chamá-lo de `ID_TURMA_3A`.

Os valores válidos para `turno` são: `MANHA`, `TARDE`, `NOITE`

#### Listar turmas

```bash
curl -s http://localhost:3003/v1/classes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "data": [
    {
      "id": "...",
      "codigo": "3A-2026",
      "ano_letivo": 2026,
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

#### Contar turmas ativas do ano atual

```bash
curl -s http://localhost:3003/v1/classes/active/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{ "total": 1 }
```

#### Buscar detalhes de uma turma

```bash
curl -s http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 9. MS-02 — Gestão de Professores — Porta 3002

> 🔑 Todas as rotas de escrita exigem role `ADMIN`.

### 9.1 Cadastrar um professor

```bash
curl -s -X POST http://localhost:3002/v1/teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome_completo": "Maria Oliveira",
    "email": "maria.oliveira@escola.com"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-professor",
  "nome_completo": "Maria Oliveira",
  "email": "maria.oliveira@escola.com",
  "created_at": "...",
  "updated_at": "..."
}
```

> 📋 **Guarde o `id` do professor!** Vamos chamá-lo de `ID_PROFESSOR_MARIA`.

### 9.2 Listar professores

```bash
curl -s http://localhost:3002/v1/teachers \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "id": "...",
      "nome_completo": "Maria Oliveira",
      "email": "maria.oliveira@escola.com",
      "professor_disciplina": [],
      "professor_turma": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 9.3 Contar total de professores

```bash
curl -s http://localhost:3002/v1/teachers/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:** `{ "total": 1 }`

### 9.4 Buscar professor por ID

```bash
curl -s http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 9.5 Editar professor

```bash
curl -s -X PUT http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "nome_completo": "Maria Oliveira Santos" }'
```

---

### 9.6 Grade de Horários

#### Criar entrada na grade horária

```bash
curl -s -X POST http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "turma_id": "ID_TURMA_3A",
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
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
  "horario_inicio": "19:00:00",
  "horario_fim": "20:40:00"
}
```

> 📋 **Guarde o `id` da grade!** Vamos chamá-lo de `ID_GRADE`.

> ℹ️ **Efeito colateral:** Esta criação gera automaticamente um registro em `evento_grade` com `tipo = 'CRIACAO'`. O MS-05 vai detectar esse evento no próximo ciclo de polling (30 segundos) e criar um comunicado automático.

Os valores válidos para `dia_semana`: `SEGUNDA`, `TERCA`, `QUARTA`, `QUINTA`, `SEXTA`, `SABADO`

#### Visualizar grade de um professor

```bash
curl -s "http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA/schedule?bimestre=1&ano_letivo=2026" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Editar uma entrada da grade

```bash
curl -s -X PUT http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA/schedule/ID_GRADE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "horario_inicio": "19:30:00", "horario_fim": "21:10:00" }'
```

> ℹ️ **Efeito colateral:** Gera `evento_grade` com `tipo = 'EDICAO'`.

#### Registrar substituição de professor

```bash
curl -s -X POST http://localhost:3002/v1/teachers/ID_PROFESSOR_MARIA/schedule/ID_GRADE/substitution \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "professor_substituto_id": "ID_DE_OUTRO_PROFESSOR",
    "motivo": "Atestado médico",
    "data_inicio": "2026-04-14",
    "data_fim": "2026-04-18"
  }'
```

> ℹ️ Para testar isso, você precisa criar um segundo professor antes.

#### Ver eventos recentes de grade (feed do dashboard)

```bash
curl -s http://localhost:3002/v1/teachers/schedule/changes/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:**
- ✅ Aparece o evento de CRIACAO gerado quando você criou a grade
- ✅ Campo `processado: false` (ainda não foi processado pelo MS-05)
- ✅ Contém `grade_horaria` com os dados da grade

---

## 10. MS-01 — Gestão de Alunos — Porta 3001

### 10.1 Cadastrar um aluno

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
    "end_cep": "20000-000",
    "turma_atual_id": "ID_TURMA_3A"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-aluno",
  "matricula": "MAT-1234567890",
  "nome_completo": "João da Silva",
  "email": "joao.silva@aluno.escola.com",
  "status": "ATIVO",
  ...
}
```

> 📋 **Guarde o `id` do aluno!** Vamos chamá-lo de `ID_ALUNO_JOAO`.

> ℹ️ Se não informar `matricula`, ela é gerada automaticamente no formato `MAT-{timestamp}`.

### 10.2 Listar alunos

```bash
curl -s http://localhost:3001/v1/students \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Filtrar por status

```bash
# Apenas alunos ativos
curl -s "http://localhost:3001/v1/students?status=ATIVO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Paginação

```bash
curl -s "http://localhost:3001/v1/students?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 10.3 Contar alunos

```bash
curl -s http://localhost:3001/v1/students/count \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:** `{ "total": 1 }`

### 10.4 Buscar aluno por ID

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 10.5 Editar aluno

```bash
curl -s -X PUT http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "telefone": "(21) 88888-0001" }'
```

### 10.6 Inativar aluno (soft delete)

```bash
curl -s -X DELETE http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:** Status 204 (sem conteúdo)

**O que validar:** Busque o aluno novamente e verifique que `status` agora é `"INATIVO"`:
```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
# Deve retornar: { ..., "status": "INATIVO" }
```

> ℹ️ Reative o aluno para continuar os testes:
```bash
curl -s -X PUT http://localhost:3001/v1/students/ID_ALUNO_JOAO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "status": "ATIVO" }'
```

---

### 10.7 Alocar aluno em uma turma (via MS-03)

> Este endpoint está no MS-03, mas faz parte do fluxo de gestão de alunos.

```bash
curl -s -X POST http://localhost:3003/v1/classes/ID_TURMA_3A/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "aluno_id": "ID_ALUNO_JOAO",
    "data_matricula": "2026-02-03"
  }'
```

**Resposta esperada (201):** Objeto da alocação criada.

**Verificar a alocação:**
```bash
curl -s http://localhost:3003/v1/classes/ID_TURMA_3A \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
# Deve mostrar: "alocacao_aluno": [{ "aluno_id": "ID_ALUNO_JOAO", ... }]
```

---

### 10.8 Registrar Frequência

#### Lançar presença/falta de um aluno

```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "turma_id": "ID_TURMA_3A",
    "data": "2026-04-07",
    "presente": true,
    "bimestre": 1
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-registro",
  "aluno_id": "...",
  "disciplina_id": "...",
  "data": "2026-04-07",
  "presente": true,
  "bimestre": 1
}
```

Registre mais algumas faltas para testar o cálculo de frequência:

```bash
# Falta no dia seguinte
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "turma_id": "ID_TURMA_3A",
    "data": "2026-04-08",
    "presente": false,
    "bimestre": 1
  }'
```

#### Visualizar frequência de um aluno

```bash
curl -s "http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency?bimestre=1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": "...",
    "aluno_id": "...",
    "disciplina_id": "...",
    "bimestre": 1,
    "total_aulas": 2,
    "total_presencas": 1,
    "total_faltas": 1,
    "percentual_frequencia": 50.00,
    "reprovado_por_falta": false
  }
]
```

> ℹ️ O sistema recalcula automaticamente a frequência consolidada a cada lançamento. A frequência mínima para aprovação é **75%**.

#### Override de frequência (Admin pode reverter reprovação por falta)

Se um aluno ficou com `reprovado_por_falta: true`, o Admin pode fazer um override com justificativa:

```bash
curl -s -X POST http://localhost:3001/v1/students/ID_ALUNO_JOAO/frequency/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "justificativa": "Aluno apresentou atestado médico para todas as faltas do período"
  }'
```

---

### 10.9 Histórico Escolar

```bash
curl -s http://localhost:3001/v1/students/ID_ALUNO_JOAO/history \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:** Lista de registros do histórico escolar com resultados por disciplina.

> ℹ️ O histórico é populado pelo MS-04 ao encerrar o período letivo.

---

## 11. MS-04 — Avaliações e Notas — Porta 3004

### 11.1 Configuração de Média Mínima

#### Consultar configuração atual

```bash
curl -s http://localhost:3004/v1/grades/config \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "media_min_aprovacao": 6.00,
  "vigente_desde": "...",
  "ativa": true
}
```

#### Alterar a média mínima (RF-30)

```bash
curl -s -X PUT http://localhost:3004/v1/grades/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "media_min_aprovacao": 5.5 }'
```

**O que validar:**
- ✅ A configuração anterior foi desativada (`ativa = false`)
- ✅ Uma nova configuração foi criada (`ativa = true`)
- ✅ Consultar config novamente mostra o novo valor

> Retorne para 6.0 para os próximos testes:
```bash
curl -s -X PUT http://localhost:3004/v1/grades/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "media_min_aprovacao": 6.0 }'
```

---

### 11.2 Avaliações

#### Criar uma avaliação (RF-23)

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Prova 1 — Álgebra",
    "tipo": "PROVA",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "turma_id": "ID_TURMA_3A",
    "professor_id": "ID_PROFESSOR_MARIA",
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
  ...
}
```

> 📋 **Guarde o `id` da avaliação!** Vamos chamá-lo de `ID_AVALIACAO_PROVA1`.

Os valores válidos para `tipo`: `PROVA`, `TRABALHO`, `RECUPERACAO`, `PROVA_FINAL`

#### Criar um trabalho no mesmo bimestre

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Trabalho em Grupo — Geometria",
    "tipo": "TRABALHO",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "turma_id": "ID_TURMA_3A",
    "professor_id": "ID_PROFESSOR_MARIA",
    "data_aplicacao": "2026-04-25",
    "peso_na_media": 1.0
  }'
```

> 📋 Guarde este ID como `ID_AVALIACAO_TRABALHO1`.

#### Listar avaliações

```bash
curl -s "http://localhost:3004/v1/assessments?bimestre=1&ano_letivo=2026" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Editar avaliação

```bash
curl -s -X PUT http://localhost:3004/v1/assessments/ID_AVALIACAO_PROVA1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "data_aplicacao": "2026-04-22" }'
```

---

### 11.3 Lançamento de Notas (RF-24 e RF-25)

#### Lançar nota na prova

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "avaliacao_id": "ID_AVALIACAO_PROVA1",
    "aluno_id": "ID_ALUNO_JOAO",
    "valor": 7.5
  }'
```

**Resposta esperada (201):**
```json
{
  "avaliacao_id": "...",
  "aluno_id": "...",
  "professor_id": "...",
  "valor": 7.50,
  "substituida": false,
  "lancada_em": "..."
}
```

**O que validar (efeito colateral — RF-25):**
A média bimestral foi recalculada automaticamente. Verifique no boletim:

```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO_JOAO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Deve aparecer em `medias_bimestrais`:
```json
{
  "disciplina_id": "...",
  "bimestre": 1,
  "ano_letivo": 2026,
  "valor_calculado": 7.50,
  "recuperacao_aplicada": false
}
```

#### Lançar nota no trabalho

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "avaliacao_id": "ID_AVALIACAO_TRABALHO1",
    "aluno_id": "ID_ALUNO_JOAO",
    "valor": 8.0
  }'
```

**Verificar média atualizada:**
```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO_JOAO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

A média bimestral agora deve ser `(7.5 + 8.0) / 2 = 7.75`.

#### Editar nota já lançada

> 📋 Para editar, você precisa do ID da nota. O retorno do POST acima não inclui diretamente o `id` da nota como campo separado — use a rota de notas recentes para buscá-lo:

```bash
curl -s http://localhost:3004/v1/grades/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Com o ID da nota em mãos (campo `id`):

```bash
curl -s -X PUT http://localhost:3004/v1/grades/ID_DA_NOTA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "valor": 9.0 }'
```

**O que validar:** A média bimestral foi recalculada automaticamente.

---

### 11.4 Recuperação (RF-26)

A recuperação funciona criando uma avaliação do tipo `RECUPERACAO` e lançando a nota. O sistema automaticamente compara com a menor média bimestral e aplica a substituição se a nota for melhor.

#### Criar avaliação de recuperação

```bash
curl -s -X POST http://localhost:3004/v1/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Recuperação — 1º Bimestre",
    "tipo": "RECUPERACAO",
    "bimestre": 1,
    "ano_letivo": 2026,
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "turma_id": "ID_TURMA_3A",
    "professor_id": "ID_PROFESSOR_MARIA",
    "data_aplicacao": "2026-05-10",
    "peso_na_media": 1.0
  }'
```

> 📋 Guarde o ID como `ID_AVALIACAO_RECUPERACAO`.

#### Lançar nota de recuperação

```bash
curl -s -X POST http://localhost:3004/v1/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "avaliacao_id": "ID_AVALIACAO_RECUPERACAO",
    "aluno_id": "ID_ALUNO_JOAO",
    "valor": 8.5
  }'
```

**O que validar no boletim:**
```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO_JOAO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Se a nota de recuperação (8.5) for maior que a menor média bimestral, o campo `recuperacao_aplicada` deve ser `true` e a média atualizada.

---

### 11.5 Prova Final (RF-28 e RF-29)

Para testar a prova final, o aluno precisa ter Média Anual < 6.0. Crie um cenário de reprovação:

#### Passo 1: Crie avaliações nos 4 bimestres com notas baixas

> Por brevidade, crie uma avaliação e lance nota baixa em cada bimestre (repita o processo para bimestres 2, 3 e 4 com `valor` menor que 6.0).

Após ter os 4 bimestres com médias baixas, acesse o boletim para confirmar que a Média Anual < 6.0 e um registro de `prova_final` foi criado com `status: "EM_CURSO"`.

#### Passo 2: Lançar nota da prova final

```bash
curl -s -X POST http://localhost:3004/v1/grades/prova-final \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "aluno_id": "ID_ALUNO_JOAO",
    "disciplina_id": "ID_DISCIPLINA_MATEMATICA",
    "ano_letivo": 2026,
    "nota_prova_final": 7.0
  }'
```

**Cálculo automático:**
- `Média Final = (Média Anual + Nota PF) / 2`
- Se `Média Final >= 6.0` → `status = "APROVADO_PF"`
- Se `Média Final < 6.0` → `status = "REPROVADO_NOTA"`

**Verificar resultado no boletim:**
```bash
curl -s http://localhost:3004/v1/grades/ID_ALUNO_JOAO/boletim \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Deve aparecer em `provas_final`:
```json
{
  "disciplina_id": "...",
  "media_anual": 4.50,
  "nota_prova_final": 7.00,
  "media_final": 5.75,
  "status": "REPROVADO_NOTA"
}
```

---

## 12. MS-05 — Comunicação Escolar — Porta 3005

### 12.1 Preferências de Notificação

#### Consultar preferências do usuário atual

```bash
curl -s http://localhost:3005/v1/notifications/preferences \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "usuario_id": "uuid-do-admin",
  "email_obrigatorio": true,
  "whatsapp_opcional": false
}
```

> ℹ️ Se não existir, cria automaticamente com os valores padrão.

#### Atualizar preferências

```bash
curl -s -X PUT http://localhost:3005/v1/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "email_obrigatorio": true,
    "whatsapp_opcional": true
  }'
```

---

### 12.2 Comunicados

#### Criar comunicado GERAL

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Reunião de Pais — 2º Bimestre",
    "conteudo": "Informamos que a reunião de pais acontecerá no dia 15/05 às 19h no auditório principal. Presença obrigatória.",
    "publico_alvo": "GERAL"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "uuid-do-comunicado",
  "remetente_id": "uuid-do-admin",
  "titulo": "Reunião de Pais — 2º Bimestre",
  "conteudo": "...",
  "publico_alvo": "GERAL",
  "data_envio": "..."
}
```

> 📋 Guarde o `id` como `ID_COMUNICADO_GERAL`.

#### Criar comunicado para turma específica

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Aviso — Turma 3A",
    "conteudo": "A aula de Matemática da próxima segunda-feira será transferida para a sala 205.",
    "publico_alvo": "TURMA_ESPECIFICA",
    "turma_id": "ID_TURMA_3A"
  }'
```

> ℹ️ O sistema vai chamar automaticamente o MS-03 para resolver os alunos da turma e criar registros de notificação para cada um.

#### Criar comunicado manual

```bash
curl -s -X POST http://localhost:3005/v1/communications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo": "Convocação Individual",
    "conteudo": "Comparecer à secretaria para regularizar documentação.",
    "publico_alvo": "LISTA_MANUAL",
    "destinatarios": ["ID_ALUNO_JOAO"]
  }'
```

> 📋 Guarde o `id` como `ID_COMUNICADO_MANUAL`.

---

#### Listar comunicados (visão do Admin — vê todos)

```bash
curl -s http://localhost:3005/v1/communications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:**
- ✅ Todos os comunicados criados aparecem
- ✅ Cada comunicado inclui os destinatários (`destinatario_comunicado`)

#### Feed de comunicados recentes

```bash
curl -s http://localhost:3005/v1/communications/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:**
- ✅ Retorna no máximo 20 registros
- ✅ Ordenados do mais recente para o mais antigo

#### Contagem de não lidos

```bash
curl -s http://localhost:3005/v1/communications/unread \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:** `{ "total": 0 }`

> ℹ️ O admin vê 0 porque ele não está na lista de destinatários (ele é o remetente).

#### Buscar comunicado por ID

```bash
curl -s http://localhost:3005/v1/communications/ID_COMUNICADO_GERAL \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Marcar comunicado como lido

```bash
curl -s -X PUT http://localhost:3005/v1/communications/ID_COMUNICADO_MANUAL/read \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{ "success": true }
```

> ℹ️ Retorna erro 404 se o usuário autenticado não for destinatário do comunicado.

---

### 12.3 Validar os Workers Assíncronos

#### Worker de Grade (gradeWorker)

**O que ele faz:** A cada 30 segundos, verifica se há eventos de alteração de grade no MS-02 (`evento_grade` com `processado = false`) e cria comunicados automáticos.

**Como testar:**
1. Crie uma entrada na grade horária no MS-02 (seção 9.6)
2. Aguarde até 30 segundos
3. Verifique se um novo comunicado apareceu no MS-05:

```bash
curl -s http://localhost:3005/v1/communications/recent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**O que validar:**
- ✅ Um comunicado com título `"Novo Horário Adicionado"` ou `"Horário Alterado"` apareceu
- ✅ O `remetente_id` é `"sistema"`
- ✅ O `publico_alvo` é `"TURMA_ESPECIFICA"`

No terminal do MS-05, você deve ver um log como:
```
[gradeWorker] Evento abc-123 (CRIACAO) processado → comunicado xyz-456
```

#### Worker de Notificações (notificacaoWorker)

**O que ele faz:** A cada 30 segundos, processa a fila `notificacao_externa` — tentando enviar e-mails e WhatsApp.

Como o envio está em modo mock (sem SMTP configurado), você verá no terminal do MS-05:
```
[notificacaoWorker] [EMAIL MOCK] → usuário uuid-do-aluno: Novo comunicado: Aviso — Turma 3A
```

**Para validar o retry com backoff:**
O worker tenta até 3 vezes com backoff exponencial (1min → 5min → 15min). Como o envio é mock (sempre tem sucesso), todas as notificações serão marcadas como `ENVIADO`. Se quiser testar a lógica de falha, seria necessário alterar temporariamente `sendEmail` para lançar um erro.

---

## 13. Criando Usuários para Testes (Professor e Aluno)

> **Por que isso é necessário?** O sistema não tem uma rota de cadastro de usuários via API (apenas login). Os usuários de acesso são criados via inserção direta no banco de dados do auth-service.

Para testar as rotas que exigem login com role `PROFESSOR` ou `ALUNO`, siga os passos abaixo.

### 13.1 Gerar o hash da senha

Para inserir um usuário no banco, você precisa de um hash bcrypt da senha. Use o seguinte script Node.js para gerar:

Crie um arquivo `gerar-hash.js` temporário em qualquer pasta:

```javascript
const bcrypt = require('bcryptjs')
const senha = 'Senha@123'  // Altere para a senha que quiser
const hash = bcrypt.hashSync(senha, 10)
console.log(hash)
```

Execute:
```bash
node gerar-hash.js
# Saída: $2b$10$xxxxx...  (copie este valor)
```

> ⚠️ Se não tiver `bcryptjs` instalado globalmente, use: `cd auth-service && node -e "const b = require('bcryptjs'); console.log(b.hashSync('Senha@123', 10))"`

### 13.2 Inserir usuário Professor no banco

Abra o HeidiSQL, conecte ao servidor MySQL e execute no schema `20261_prjint5_raphaelestrella`:

```sql
INSERT INTO usuario (id, email, senha_hash, role, referencia_id, ativo)
VALUES (
    UUID(),
    'maria.prof@escola.com',
    '$2b$10$HASH_GERADO_AQUI',  -- substitua pelo hash gerado
    'PROFESSOR',
    'ID_PROFESSOR_MARIA',       -- substitua pelo UUID do professor criado no MS-02
    TRUE
);
```

> ⚠️ O campo `referencia_id` deve apontar para o `id` do registro de professor no MS-02.

### 13.3 Inserir usuário Aluno no banco

```sql
INSERT INTO usuario (id, email, senha_hash, role, referencia_id, ativo)
VALUES (
    UUID(),
    'joao.aluno@escola.com',
    '$2b$10$HASH_GERADO_AQUI',  -- substitua pelo hash gerado
    'ALUNO',
    'ID_ALUNO_JOAO',            -- substitua pelo UUID do aluno criado no MS-01
    TRUE
);
```

### 13.4 Fazer login com o novo usuário

```bash
# Login como Professor
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "maria.prof@escola.com", "senha": "Senha@123" }'
```

```bash
# Login como Aluno
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "joao.aluno@escola.com", "senha": "Senha@123" }'
```

### 13.5 Testando rotas exclusivas do Professor

Com o token do professor salvo em `TOKEN_PROFESSOR`:

```bash
# Professor vê sua própria grade
curl -s http://localhost:3002/v1/teachers/me \
  -H "Authorization: Bearer TOKEN_PROFESSOR"

# Professor vê avaliações que criou
curl -s http://localhost:3004/v1/assessments \
  -H "Authorization: Bearer TOKEN_PROFESSOR"

# Professor tenta ver avaliações de outro professor (deve falhar ou mostrar apenas as suas)
curl -s "http://localhost:3004/v1/assessments?professor_id=OUTRO_ID" \
  -H "Authorization: Bearer TOKEN_PROFESSOR"
```

### 13.6 Testando rotas exclusivas do Aluno

Com o token do aluno salvo em `TOKEN_ALUNO`:

```bash
# Aluno vê seu próprio perfil
curl -s http://localhost:3001/v1/students/me \
  -H "Authorization: Bearer TOKEN_ALUNO"

# Aluno tenta acessar perfil de outro aluno (deve retornar 403)
curl -s http://localhost:3001/v1/students/OUTRO_ALUNO_ID \
  -H "Authorization: Bearer TOKEN_ALUNO"
# Resposta esperada: { "error": "Acesso negado" }

# Aluno vê seu boletim
curl -s http://localhost:3004/v1/grades/ID_ALUNO_JOAO/boletim \
  -H "Authorization: Bearer TOKEN_ALUNO"

# Aluno vê comunicados (só os gerais + os destinados a ele)
curl -s http://localhost:3005/v1/communications \
  -H "Authorization: Bearer TOKEN_ALUNO"

# Aluno marca comunicado como lido
curl -s -X PUT http://localhost:3005/v1/communications/ID_COMUNICADO_MANUAL/read \
  -H "Authorization: Bearer TOKEN_ALUNO"
```

---

## 14. Cenário Integrado Completo

Este cenário simula o fluxo real de uso do sistema, do início do ano letivo até o encerramento de um bimestre.

### Fase 1 — Configuração inicial do ano letivo

```
1. [Admin] Cria disciplinas (MS-03)
2. [Admin] Cria evento no calendário (MS-03)
3. [Admin] Cria turma vinculada ao calendário (MS-03)
4. [Admin] Cadastra professores (MS-02)
5. [Admin] Aloca professores nas turmas (grade horária) (MS-02)
6. [Admin] Cadastra alunos (MS-01)
7. [Admin] Aloca alunos nas turmas (MS-03)
```

### Fase 2 — Durante o 1º Bimestre

```
8.  [Admin] Cria avaliações (prova + trabalho) para o bimestre 1 (MS-04)
9.  [Prof]  Lança frequência dos alunos (MS-01)
10. [Prof]  Lança notas das avaliações — média bimestral calculada automaticamente (MS-04)
11. [Admin] Envia comunicado para a turma (MS-05)
12. [Aluno] Lê o comunicado e marca como lido (MS-05)
13. [Aluno] Consulta boletim parcial (MS-04)
14. [Aluno] Consulta frequência (MS-01)
```

### Fase 3 — Encerramento do 1º Bimestre

```
15. [Prof]  Cria avaliação de recuperação (MS-04)
16. [Prof]  Lança notas de recuperação (MS-04)
         → Sistema compara com menor média e aplica se melhor
17. [Admin] Altera horário de uma aula (MS-02)
         → MS-02 gera evento_grade automaticamente
         → MS-05 detecta o evento (30s) e cria comunicado automático
         → Alunos da turma recebem notificação
```

### Fase 4 — Final do Ano Letivo

```
18. [Admin] Verifica alunos com Média Anual < 6.0 no boletim (MS-04)
19. [Prof]  Lança nota da Prova Final (MS-04)
         → Status calculado automaticamente (APROVADO_PF ou REPROVADO_NOTA)
20. [Admin] Consulta boletim final de cada aluno (MS-04)
```

---

## 15. Referência Rápida — Todos os Endpoints

### Auth Service (3000)

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/v1/auth/login` | ❌ | Login — retorna accessToken e refreshToken |
| POST | `/v1/auth/refresh` | ❌ | Renova o accessToken com o refreshToken |
| GET | `/v1/auth/validate` | ✅ Todos | Valida o token e retorna dados do usuário |
| GET | `/health` | ❌ | Health check |

### MS-01 — Alunos (3001)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/students` | ADMIN | Lista alunos com paginação e filtro por status |
| GET | `/v1/students/count` | ADMIN | Conta total de alunos |
| GET | `/v1/students/me` | ALUNO | Perfil do aluno autenticado |
| GET | `/v1/students/:id` | ADMIN, ALUNO (próprio) | Dados de um aluno |
| POST | `/v1/students` | ADMIN | Cadastra novo aluno |
| PUT | `/v1/students/:id` | ADMIN | Edita aluno |
| DELETE | `/v1/students/:id` | ADMIN | Inativa aluno (soft delete) |
| GET | `/v1/students/:id/frequency` | ADMIN, PROF, ALUNO (próprio) | Frequência consolidada |
| POST | `/v1/students/:id/frequency` | ADMIN, PROF | Lança presença/falta |
| POST | `/v1/students/:id/frequency/override` | ADMIN | Override de reprovação por falta |
| GET | `/v1/students/:id/history` | ADMIN, ALUNO (próprio) | Histórico escolar |

### MS-02 — Professores (3002)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/teachers` | ADMIN | Lista professores |
| GET | `/v1/teachers/count` | ADMIN | Conta professores |
| GET | `/v1/teachers/me` | PROF | Perfil do professor autenticado |
| GET | `/v1/teachers/:id` | ADMIN, PROF (próprio) | Dados de um professor |
| POST | `/v1/teachers` | ADMIN | Cadastra professor |
| PUT | `/v1/teachers/:id` | ADMIN | Edita professor |
| DELETE | `/v1/teachers/:id` | ADMIN | Remove professor |
| GET | `/v1/teachers/:id/schedule` | ADMIN, PROF (próprio) | Grade horária |
| POST | `/v1/teachers/:id/schedule` | ADMIN | Cria entrada na grade |
| PUT | `/v1/teachers/:id/schedule/:gradeId` | ADMIN | Edita entrada da grade |
| POST | `/v1/teachers/:id/schedule/:gradeId/substitution` | ADMIN | Registra substituição |
| GET | `/v1/teachers/schedule/changes/recent` | Todos | Feed de alterações recentes |

### MS-03 — Turmas e Disciplinas (3003)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/disciplines` | Todos | Lista disciplinas |
| GET | `/v1/disciplines/:id` | Todos | Dados de uma disciplina |
| POST | `/v1/disciplines` | ADMIN | Cria disciplina |
| PUT | `/v1/disciplines/:id` | ADMIN | Edita disciplina |
| DELETE | `/v1/disciplines/:id` | ADMIN | Remove disciplina |
| GET | `/v1/classes` | Todos | Lista turmas com alocações |
| GET | `/v1/classes/active/count` | ADMIN | Conta turmas do ano atual |
| GET | `/v1/classes/:id` | Todos | Dados de uma turma |
| POST | `/v1/classes` | ADMIN | Cria turma |
| PUT | `/v1/classes/:id` | ADMIN | Edita turma |
| DELETE | `/v1/classes/:id` | ADMIN | Remove turma |
| POST | `/v1/classes/:id/students` | ADMIN | Aloca aluno na turma |
| DELETE | `/v1/classes/:id/students/:alunoId` | ADMIN | Remove aluno da turma |
| GET | `/v1/calendar/events` | Todos | Lista eventos do calendário |
| POST | `/v1/calendar/events` | ADMIN | Cria evento |
| PUT | `/v1/calendar/events/:id` | ADMIN | Edita evento |
| DELETE | `/v1/calendar/events/:id` | ADMIN | Remove evento |

### MS-04 — Avaliações e Notas (3004)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/assessments` | ADMIN, PROF (próprias) | Lista avaliações |
| GET | `/v1/assessments/:id` | Todos | Dados de uma avaliação |
| POST | `/v1/assessments` | ADMIN, PROF | Cria avaliação |
| PUT | `/v1/assessments/:id` | ADMIN, PROF (próprias) | Edita avaliação |
| GET | `/v1/grades/recent` | ADMIN, PROF (próprias) | Feed de notas recentes |
| POST | `/v1/grades` | ADMIN, PROF | Lança nota |
| PUT | `/v1/grades/:id` | ADMIN, PROF | Edita nota |
| GET | `/v1/grades/:alunoId/boletim` | ADMIN, PROF, ALUNO (próprio) | Boletim completo |
| POST | `/v1/grades/prova-final` | ADMIN, PROF | Lança nota de prova final |
| GET | `/v1/grades/config` | ADMIN | Configuração de média mínima |
| PUT | `/v1/grades/config` | ADMIN | Altera média mínima |

### MS-05 — Comunicação Escolar (3005)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/v1/communications` | Todos | Lista comunicados (filtrado por role) |
| GET | `/v1/communications/recent` | Todos | Feed dos 20 mais recentes |
| GET | `/v1/communications/unread` | Todos | Contagem de não lidos |
| GET | `/v1/communications/:id` | Todos | Detalhes de um comunicado |
| POST | `/v1/communications` | ADMIN, PROF | Cria e envia comunicado |
| PUT | `/v1/communications/:id/read` | Todos | Marca como lido |
| GET | `/v1/notifications/preferences` | Todos | Preferências de notificação |
| PUT | `/v1/notifications/preferences` | Todos | Atualiza preferências |

---

## Dicas Finais

### Erros comuns e soluções

| Erro | Causa provável | Solução |
|---|---|---|
| `401 Credenciais inválidas` | Usuário não existe ou senha errada | Execute `script_auth.sql` |
| `401 Unauthorized` | Token ausente ou expirado | Refaça o login ou use `/v1/auth/refresh` |
| `403 Permissão insuficiente` | Role do usuário não permite a ação | Use o token de ADMIN para esta operação |
| `404 Registro não encontrado` | ID inválido ou registro deletado | Verifique se o ID existe com uma rota GET |
| `409 Registro já existe` | Violação de chave única | Verifique se e-mail/matricula/código já existem |
| `Connection refused` | Serviço não está rodando | Inicie o serviço correspondente com `npm run dev` |
| `Prisma: Can't reach database server` | Banco não acessível | Verifique a VPN/rede e a senha no `.env` |

### Como usar no Postman (alternativa ao curl)

1. Crie uma nova **Collection** chamada "Gestão Escolar"
2. Adicione uma variável de coleção `token` (deixe vazia inicialmente)
3. No primeiro request (login), na aba **Tests** adicione:
   ```javascript
   const json = pm.response.json()
   pm.collectionVariables.set("token", json.accessToken)
   ```
4. Nos demais requests, adicione o header:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`
5. Isso garante que o token é atualizado automaticamente após cada login

### Atalho para renovar token rapidamente

Se o token expirar durante os testes (15 minutos), basta refazer o login:

```bash
# Linux/macOS:
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"Admin@123"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
```
