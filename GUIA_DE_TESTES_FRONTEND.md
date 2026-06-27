# Guia Completo de Testes — Frontend
## Sistema de Gestão Escolar v3.0

> **Para quem é este guia?**
> Este documento foi escrito para qualquer membro da equipe conseguir iniciar, navegar e validar todas as telas do frontend do zero — mesmo sem experiência prévia em desenvolvimento web ou React.

---

## Sumário

1. [Visão Geral do Frontend](#1-visão-geral-do-frontend)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Iniciando todos os serviços](#3-iniciando-todos-os-serviços)
4. [Acessando o sistema no navegador](#4-acessando-o-sistema-no-navegador)
5. [Tela de Login](#5-tela-de-login)
6. [Layout principal — Sidebar e Topbar](#6-layout-principal--sidebar-e-topbar)
7. [Dashboard — Administrador](#7-dashboard--administrador)
8. [Dashboard — Professor](#8-dashboard--professor)
9. [Dashboard — Aluno](#9-dashboard--aluno)
10. [Módulo Alunos (ADMIN)](#10-módulo-alunos-admin)
11. [Módulo Professores (ADMIN)](#11-módulo-professores-admin)
12. [Módulo Turmas (ADMIN)](#12-módulo-turmas-admin)
13. [Módulo Disciplinas (ADMIN)](#13-módulo-disciplinas-admin)
14. [Módulo Calendário (todos)](#14-módulo-calendário-todos)
15. [Módulo Avaliações (ADMIN e PROFESSOR)](#15-módulo-avaliações-admin-e-professor)
16. [Módulo Notas — Lançamento (ADMIN e PROFESSOR)](#16-módulo-notas--lançamento-admin-e-professor)
17. [Módulo Boletim (todos)](#17-módulo-boletim-todos)
18. [Módulo Frequência (PROFESSOR lança / ALUNO consulta)](#18-módulo-frequência-professor-lança--aluno-consulta)
19. [Módulo Comunicados (todos)](#19-módulo-comunicados-todos)
20. [Módulo Configurações (ADMIN)](#20-módulo-configurações-admin)
21. [Controle de acesso por perfil](#21-controle-de-acesso-por-perfil)
22. [Fluxos integrados completos](#22-fluxos-integrados-completos)
23. [Comportamento de token e sessão](#23-comportamento-de-token-e-sessão)
24. [Problemas comuns e soluções](#24-problemas-comuns-e-soluções)

---

## 1. Visão Geral do Frontend

O frontend é uma **SPA (Single Page Application)** construída em React + TypeScript que consome as APIs dos 6 microsserviços do backend. Para funcionar corretamente, **todos os serviços de backend precisam estar rodando ao mesmo tempo** que o frontend.

| Serviço | Porta | O que alimenta no frontend |
|---|---|---|
| **Frontend** | 5173 | Própria interface web |
| **auth-service** | 3000 | Login, tokens JWT |
| **MS-01** | 3001 | Telas de Alunos, Frequência, Histórico |
| **MS-02** | 3002 | Telas de Professores, Grade Horária |
| **MS-03** | 3003 | Turmas, Disciplinas, Calendário |
| **MS-04** | 3004 | Avaliações, Notas, Boletim |
| **MS-05** | 3005 | Comunicados, Notificações |

---

## 2. Pré-requisitos

### 2.1 Node.js 22 ou superior

```bash
node --version
# Deve exibir: v22.x.x
```

Se não tiver, baixe em: https://nodejs.org

### 2.2 Google Chrome, Edge ou Firefox atualizado

O sistema foi testado nesses navegadores. Recomendamos o **Chrome** por ter as melhores ferramentas de desenvolvedor.

### 2.3 Dependências instaladas

Antes da primeira execução, instale as dependências de todos os projetos. Abra o terminal na raiz do projeto e rode cada comando:

```bash
# Frontend
npm install --prefix frontend

# Backend (cada microsserviço)
npm install --prefix auth-service
npm install --prefix MS01_gestao_de_alunos
npm install --prefix MS02_gestao_de_professores
npm install --prefix MS03_turmas_e_disciplinas
npm install --prefix MS04_avaliacoes_e_notas
npm install --prefix MS05_comunicacao_escolar
```

> **Dica:** Se já tiver instalado antes, pode pular este passo. A pasta `node_modules/` dentro de cada projeto indica que já foi instalado.

### 2.4 Variáveis de ambiente do frontend

Crie um arquivo `.env` dentro da pasta `frontend/` com o seguinte conteúdo (se ainda não existir):

```env
VITE_AUTH_URL=http://localhost:3000
VITE_MS01_URL=http://localhost:3001
VITE_MS02_URL=http://localhost:3002
VITE_MS03_URL=http://localhost:3003
VITE_MS04_URL=http://localhost:3004
VITE_MS05_URL=http://localhost:3005
```

> **Nota:** O frontend usa essas URLs para saber onde encontrar cada microsserviço. Se as portas padrão estiverem sendo usadas, os valores acima já funcionam.

---

## 3. Iniciando todos os serviços

Você precisará de **7 terminais abertos** simultaneamente (um para cada serviço). Abra cada terminal na raiz do projeto e execute:

**Terminal 1 — Frontend:**
```bash
npm run dev --prefix frontend
```
✅ Aguarde a mensagem: `VITE v8.x.x  ready in xxx ms` e `➜  Local: http://localhost:5173/`

**Terminal 2 — Auth Service:**
```bash
npm run dev --prefix auth-service
```
✅ Aguarde: `Server listening at http://0.0.0.0:3000`

**Terminal 3 — MS-01 Alunos:**
```bash
npm run dev --prefix MS01_gestao_de_alunos
```
✅ Aguarde: `Server listening at http://0.0.0.0:3001`

**Terminal 4 — MS-02 Professores:**
```bash
npm run dev --prefix MS02_gestao_de_professores
```
✅ Aguarde: `Server listening at http://0.0.0.0:3002`

**Terminal 5 — MS-03 Turmas:**
```bash
npm run dev --prefix MS03_turmas_e_disciplinas
```
✅ Aguarde: `Server listening at http://0.0.0.0:3003`

**Terminal 6 — MS-04 Notas:**
```bash
npm run dev --prefix MS04_avaliacoes_e_notas
```
✅ Aguarde: `Server listening at http://0.0.0.0:3004`

**Terminal 7 — MS-05 Comunicação:**
```bash
npm run dev --prefix MS05_comunicacao_escolar
```
✅ Aguarde: `Server listening at http://0.0.0.0:3005`

> **Todos os 7 terminais precisam estar rodando ao mesmo tempo.** Se fechar qualquer um, as funcionalidades correspondentes vão mostrar erro no frontend.

---

## 4. Acessando o sistema no navegador

### Via Docker Compose (recomendado para apresentação)

Com os containers rodando (`docker compose up -d`), acesse:

```
http://localhost
```

O frontend é servido pelo nginx na porta 80 com SPA routing correto — recarregar a página em qualquer rota funciona normalmente.

### Via Vite (desenvolvimento)

Com os 7 terminais rodando (seção 3), acesse:

```
http://localhost:5173
```

**O que deve acontecer:**
- Se você ainda não está logado → a página redireciona automaticamente para `/login`
- Se já estava logado em uma sessão anterior → vai direto para o Dashboard

---

## 5. Tela de Login

**URL:** `http://localhost:5173/login`

### 5.1 Visual esperado

A tela de login exibe:
- Fundo com gradiente suave (azul claro para branco)
- Card centralizado branco com sombra
- Logo azul escuro (#00288e) com ícone de chapéu de formatura
- Título: **"Gestão Escolar"** e subtítulo: **"Portal Acadêmico"**
- Campo **E-mail** com placeholder `seu@email.com`
- Campo **Senha** com botão de olho (mostrar/ocultar senha)
- Botão **"Entrar"** azul com gradiente

### 5.2 Credenciais de teste

As credenciais padrão para demonstração do sistema são:

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | `admin@escola.com` | `Admin@123` |
| PROFESSOR | `professor@escola.com` | `Prof@123` |
| ALUNO | `aluno@escola.com` | `Aluno@123` |

> **Importante:** as contas de PROFESSOR e ALUNO são vinculadas ao professor e ao aluno mais recentes cadastrados no banco. Se o banco foi limpo e repopulado (ex.: nova execução da collection Postman), execute o script `create_demo_users.js` para recriar os vínculos — veja seção 13 do **GUIA_DE_TESTES.md**.

### 5.3 Testando o login com ADMIN

1. Preencha o e-mail e senha do administrador
2. Clique em **"Entrar"**
3. **Resultado esperado:**
   - Aparece um spinner no botão: `⟳ Entrando...`
   - Toast verde no canto superior: **"Login realizado com sucesso!"**
   - Redireciona automaticamente para `http://localhost:5173/dashboard`

### 5.4 Testando erros de login

**Campos vazios:**
1. Clique em "Entrar" sem preencher nada
2. **Esperado:** Mensagem de erro inline embaixo dos campos: *"Preencha o e-mail e a senha."*

**Senha incorreta:**
1. Preencha o e-mail correto e uma senha errada
2. Clique em "Entrar"
3. **Esperado:** Caixa de erro vermelha com ícone: *"E-mail ou senha incorretos."* (ou a mensagem retornada pela API)

**Proteção contra acesso direto à URL autenticada:**
1. Sem estar logado, acesse `http://localhost:5173/dashboard` direto na barra de endereço
2. **Esperado:** Redireciona imediatamente para `/login` (comportamento do guard `RequireAuth`)

### 5.5 Testando o toggle de senha

1. Digite algo no campo Senha
2. Clique no ícone de olho à direita do campo
3. **Esperado:** O texto da senha fica visível (tipo `text`)
4. Clique novamente no ícone
5. **Esperado:** Volta a ser ocultado (tipo `password`)

---

## 6. Layout principal — Sidebar e Topbar

Após o login, toda a navegação usa um layout com:

### 6.1 Sidebar (barra lateral esquerda)

- **Fundo escuro** (`#0f1c2d`) com texto claro
- Logo "Gestão Escolar / Portal Acadêmico" no topo
- **Links de navegação** com ícones (variam por perfil — veja seção 21)
- Links ativos ficam com fundo azul e texto branco (destaque visual)
- **Botão "Sair"** em vermelho na parte inferior

**Como validar o menu ativo:**
- Ao clicar em "Alunos" na sidebar, o item deve ficar **destacado em azul**
- Ao navegar para outra seção, o destaque muda para o novo item

### 6.2 Topbar (barra superior)

- Título "Gestão Escolar" à esquerda
- **Ícone de sino** (notificações) à direita — ao clicar navega para `/communications`
- Badge vermelho no sino indica a quantidade de comunicados não lidos
- **Nome do usuário logado** exibido ao lado do avatar:
  - ADMIN → "Administrador"
  - PROFESSOR → nome completo buscado do MS-02
  - ALUNO → nome completo buscado do MS-01
- Perfil do usuário exibido abaixo do nome (ADMIN / PROFESSOR / ALUNO)

### 6.3 Área de conteúdo

- Ocupa o restante da tela à direita da sidebar
- Tem scroll independente (a sidebar fica fixa enquanto o conteúdo rola)
- Fundo levemente azulado (`#f9f9ff`)

---

## 7. Dashboard — Administrador

**URL:** `/dashboard` (logado como ADMIN)

### 7.1 O que validar visualmente

O dashboard do admin exibe **4 cards de estatísticas** em linha (ou 2×2 em telas menores):

| Card | Dado esperado | Cor do ícone |
|---|---|---|
| Total de Alunos | Número inteiro (ex: 45) | Azul |
| Total de Professores | Número inteiro (ex: 12) | Verde |
| Turmas Ativas | Número inteiro (ex: 8) | Verde |
| Comunicados Não Lidos | Número inteiro (ex: 3) | Amarelo |

> Se algum microsserviço estiver offline, o card exibe **"—"** no lugar do número. Isso é comportamento correto de fallback.

### 7.2 Tabela de Notas Recentes

- Localizada abaixo dos cards, ocupando 2/3 da largura
- Exibe colunas: **Avaliação**, **Tipo**, **BIM**, **Nota**, **Data**
- A coluna **Avaliação** mostra o título da avaliação (ex.: "Prova de Matemática")
- A coluna **Tipo** exibe um badge colorido: PROVA (azul), TRABALHO (roxo), RECUPERACAO (amarelo)
- A nota é colorida:
  - 🟢 **Verde** (`badge-success`) → nota ≥ 7,0
  - 🟡 **Amarelo** (`badge-warning`) → nota entre 5,0 e 6,9
  - 🔴 **Vermelho** (`badge-danger`) → nota < 5,0

**Como validar:**
1. Certifique-se de que há notas lançadas no sistema (via MS-04)
2. Confirme que o título da avaliação aparece em vez de UUIDs truncados
3. Notas como 8,0 devem aparecer com badge verde
4. Notas como 5,5 devem aparecer com badge amarelo
5. Notas como 3,0 devem aparecer com badge vermelho

### 7.3 Ações Rápidas

- Coluna da direita com 4 botões:
  - **"Matricular Aluno"** → navega para `/students/new`
  - **"Nova Avaliação"** → navega para `/assessments`
  - **"Novo Comunicado"** → navega para `/communications`
  - **"Lançar Notas"** → navega para `/grades`

**Validação:** Clique em cada botão e confirme que navega para a rota correta.

---

## 8. Dashboard — Professor

**URL:** `/dashboard` (logado como PROFESSOR)

### 8.1 O que validar

O dashboard do professor exibe:
- Cards com **aulas de hoje**, **próximas avaliações**, **pendências** (ex: faltas a registrar)
- Lista de turmas associadas ao professor
- Atalhos para lançamento de frequência e notas

> A exibição depende dos dados do banco. Se o professor não tiver turmas associadas, os cards mostrarão "0" ou estado vazio com mensagem.

---

## 9. Dashboard — Aluno

**URL:** `/dashboard` (logado como ALUNO)

### 9.1 O que validar

O dashboard do aluno exibe:
- Resumo do boletim: médias por disciplina do período atual
- Percentual de frequência consolidado
- Comunicados recentes não lidos
- Próximas avaliações da turma

---

## 10. Módulo Alunos (ADMIN)

### 10.1 Lista de Alunos

**URL:** `/students`

**Como acessar:** Clique em **"Alunos"** na sidebar → **"Listar"**

**O que validar:**

1. **Tabela** com colunas: Nome, Matrícula, Turma, Status, Ações
2. **Campo de busca** no topo: digite parte do nome de um aluno → a lista filtra em tempo real (ou ao pressionar Enter, dependendo da implementação)
3. **Paginação** na parte inferior: exibe "Exibindo X–Y de Z alunos"
   - Clique na seta "→" para ir para a próxima página
   - Clique na seta "←" para voltar
4. **Badge de status:** alunos ativos com badge verde, inativos com badge cinza
5. **Botão "Cadastrar Aluno"** no canto superior direito → navega para `/students/new`
6. **Ícone de visualizar** (olho) em cada linha → navega para `/students/:id`

### 10.2 Cadastro de Aluno

**URL:** `/students/new`

**Como acessar:** Clique em "Cadastrar" no submenu de Alunos, ou pelo botão na lista

**O que validar:**

1. **Formulário** com os campos:
   - Nome completo
   - Data de nascimento (date picker)
   - CPF
   - E-mail
   - Telefone
   - CEP + botão "Buscar" → **auto-fill do endereço via ViaCEP**
   - Logradouro, Número, Complemento, Bairro, Cidade, UF
   - Turma (select)

2. **Teste do auto-fill de CEP:**
   a. Digite um CEP válido no campo CEP (ex: `01310-100` — Av. Paulista, SP)
   b. Clique no botão "Buscar" ou pressione Tab
   c. **Esperado:** Os campos Logradouro, Bairro, Cidade e UF são preenchidos automaticamente
   d. Digite um CEP inválido (ex: `00000-000`)
   e. **Esperado:** Toast de erro ou mensagem "CEP não encontrado"

3. **Validação de campos obrigatórios:**
   a. Deixe o campo "Nome" vazio e tente salvar
   b. **Esperado:** Mensagem de erro no campo ou toast vermelho

4. **Salvamento:**
   a. Preencha todos os campos corretamente
   b. Clique em **"Salvar"** ou **"Cadastrar"**
   c. **Esperado:** Toast verde de sucesso + redirecionamento para a lista de alunos

### 10.3 Detalhe do Aluno

**URL:** `/students/:id`

**Como acessar:** Clique no ícone de olho em qualquer linha da lista de alunos

**O que validar:**

A tela de detalhe possui **abas** na parte superior:

| Aba | Conteúdo |
|---|---|
| **Dados** | Informações pessoais e endereço |
| **Frequência** | Histórico de presença/ausência por disciplina |
| **Boletim** | Notas por bimestre e médias |
| **Histórico** | Histórico escolar completo |

**Validações por aba:**
1. Clique em cada aba e confirme que o conteúdo muda
2. Aba **Dados**: confirme que os campos mostram os dados cadastrados
3. Aba **Boletim**: confirme as cores das médias (verde ≥6, vermelho <6)
4. O botão **"Editar"** deve abrir o formulário de edição em `/students/:id/edit`

### 10.4 Edição de Aluno

**URL:** `/students/:id/edit`

**O que validar:**
1. O formulário deve vir **pré-preenchido** com os dados atuais do aluno
2. Altere algum campo (ex: telefone)
3. Clique em "Salvar"
4. **Esperado:** Toast verde de sucesso
5. Volte para a tela de detalhe e confirme que o dado foi atualizado

---

## 11. Módulo Professores (ADMIN)

### 11.1 Lista de Professores

**URL:** `/teachers`

**Como acessar:** Clique em **"Professores"** → **"Listar"** na sidebar

**O que validar:**
1. Tabela com: Nome, E-mail, Disciplinas, Status
2. Campo de busca funcional
3. Clique em um professor → vai para `/teachers/:id`

### 11.2 Detalhe do Professor

**URL:** `/teachers/:id`

**O que validar:**
1. **Dados pessoais** do professor (nome, e-mail, telefone)
2. **Grade horária semanal**: tabela com dias da semana × horários, mostrando as turmas e disciplinas lecionadas
3. **Substituições**: lista de substituições registradas (se houver)

**Validação da grade horária:**
- A tabela deve mostrar os slots ocupados com o nome da disciplina e turma
- Slots vazios devem aparecer em branco ou com traço

---

## 12. Módulo Turmas (ADMIN)

### 12.1 Lista de Turmas

**URL:** `/classes`

**Como acessar:** Clique em **"Turmas"** na sidebar

**O que validar:**
1. Cards ou linhas de tabela com: Nome da turma, Ano, Turno, Quantidade de alunos
2. Clique em uma turma → vai para `/classes/:id`

### 12.2 Detalhe da Turma

**URL:** `/classes/:id`

**O que validar:**
1. **Informações gerais** da turma (nome, turno, ano letivo)
2. **Lista de alunos** matriculados na turma com nome e matrícula
3. **Grade da turma**: horários com disciplinas e professores vinculados

---

## 13. Módulo Disciplinas (ADMIN)

**URL:** `/disciplines`

**Como acessar:** Clique em **"Disciplinas"** na sidebar

**O que validar:**
1. Lista de todas as disciplinas cadastradas
2. Cada disciplina exibe: Nome, Código, Carga Horária
3. Busca/filtro funcional (se implementado)

---

## 14. Módulo Calendário (todos)

**URL:** `/calendar`

**Como acessar:** Clique em **"Calendário"** na sidebar (disponível para todos os perfis)

**O que validar:**

1. **Visualização em lista** (padrão): eventos ordenados cronologicamente
2. **Visualização em grade mensal** (se houver botão de alternância):
   - Meses navegáveis com botões "←" e "→"
   - Dias com eventos destacados
3. **Tipos de eventos** (cada tipo tem uma cor/badge diferente):
   - `AULA` → cor padrão
   - `FERIADO` → cor de destaque
   - `PROVA` → cor de aviso
   - `EVENTO` → cor informativa
   - `RECESSO` → cor neutra

**Validação prática:**
1. Confirme que os eventos cadastrados no MS-03 aparecem listados
2. Verifique se as datas estão no formato `DD/MM/AAAA`

---

## 15. Módulo Avaliações (ADMIN e PROFESSOR)

**URL:** `/assessments`

**Como acessar:** Clique em **"Avaliações"** na sidebar

**O que validar:**

1. **Filtros** no topo da página:
   - Bimestre (1º, 2º, 3º, 4º)
   - Tipo (PROVA, TRABALHO, SIMULADO, etc.)
2. A lista atualiza conforme o filtro selecionado
3. Cada avaliação exibe: Título, Tipo, Disciplina, Turma, Data, Nota Máxima

**Teste de filtro:**
1. Selecione "1º Bimestre" → confirme que só aparecem avaliações desse bimestre
2. Selecione "PROVA" no filtro de tipo → confirme que só aparecem provas
3. Combine os dois filtros

**Criação de avaliação (se disponível):**
1. Clique em "Nova Avaliação"
2. Preencha: Título, Tipo, Disciplina, Turma, Data, Peso, Nota Máxima, Bimestre
3. Salve e confirme que aparece na lista

---

## 16. Módulo Notas — Lançamento (ADMIN e PROFESSOR)

**URL:** `/grades`

**Como acessar:** Clique em **"Notas"** na sidebar

### 16.1 Lançamento em lote

Esta é a principal funcionalidade da tela. Permite lançar notas para múltiplos alunos de uma vez.

**O que validar:**

1. **Seleção de avaliação**: dropdown para escolher a avaliação a ser corrigida
2. **Tabela de alunos**: lista todos os alunos da turma com campo numérico ao lado de cada nome
3. **Campos de nota** com validação visual:
   - Nota ≥ 6,0 → campo fica com fundo/borda **verde**
   - Nota < 6,0 → campo fica com fundo/borda **vermelho**
4. **Botão "Salvar Notas"** para gravar em lote

**Teste de lançamento:**
1. Selecione uma avaliação já cadastrada
2. A tabela deve carregar com os alunos da turma dessa avaliação
3. Digite `8,0` para o primeiro aluno → o campo deve ficar **verde**
4. Digite `4,5` para o segundo aluno → o campo deve ficar **vermelho**
5. Clique em "Salvar Notas"
6. **Esperado:** Toast verde de sucesso
7. Acesse o Boletim de um dos alunos e confirme que a nota aparece registrada

---

## 17. Módulo Boletim (todos)

**URL:** `/boletim` (para aluno logado) ou `/grades/:alunoId/boletim` (admin/professor acessando boletim de aluno específico)

**Como acessar:**
- **ALUNO:** Clique em **"Boletim"** na sidebar
- **ADMIN:** Acesse a tela de detalhe de um aluno → aba "Boletim"

### 17.1 O que validar

O boletim exibe uma tabela com:

| Coluna | Descrição |
|---|---|
| Disciplina | Nome da matéria |
| 1º Bim | Média do 1º bimestre |
| 2º Bim | Média do 2º bimestre |
| 3º Bim | Média do 3º bimestre |
| 4º Bim | Média do 4º bimestre |
| Média Final | Média das 4 médias |
| Situação | APROVADO / REPROVADO / PROVA FINAL |

**Validação das cores:**
- Médias ≥ 6,0 devem aparecer com badge ou texto **verde** (`badge-success`)
- Médias < 6,0 devem aparecer com badge ou texto **vermelho** (`badge-danger`)
- Situação "APROVADO" → badge verde
- Situação "REPROVADO" → badge vermelho
- Situação "PROVA FINAL" → badge **amarelo/laranja** (`badge-warning`)

**Teste prático:**
1. Identifique um aluno com notas lançadas
2. Acesse o boletim dele
3. Confirme que as médias calculadas são matematicamente corretas
4. Confirme as cores de acordo com as médias

---

## 18. Módulo Frequência (PROFESSOR lança / ALUNO consulta)

**URL:** `/frequency`

**Como acessar:** Clique em **"Frequência"** na sidebar

### 18.1 Visão do PROFESSOR — Registro de chamada

**O que validar:**

1. **Seleção de turma e disciplina** no topo (dropdowns)
2. **Seleção de data** (date picker)
3. **Lista de alunos** da turma com dois botões por aluno:
   - **"P"** (Presente) — fica verde quando selecionado
   - **"F"** (Falta) — fica vermelho quando selecionado
4. Botão **"Salvar Chamada"**

**Teste de chamada:**
1. Selecione uma turma e disciplina
2. Escolha a data de hoje
3. Marque alguns alunos como Presente e outros como Falta
4. Clique em "Salvar Chamada"
5. **Esperado:** Toast verde de sucesso
6. Recarregue a página, selecione os mesmos filtros
7. **Esperado:** Os registros salvos aparecem preenchidos (a chamada já foi feita hoje)

### 18.2 Visão do ALUNO — Consulta de frequência

**O que validar:**

1. Tabela com todas as disciplinas do aluno
2. Para cada disciplina: Total de aulas, Presenças, Faltas, Percentual de frequência
3. Percentual ≥ 75% → **verde** (situação regular)
4. Percentual < 75% → **vermelho** (em risco de reprovação por falta)

---

## 19. Módulo Comunicados (todos)

**URL:** `/communications`

**Como acessar:** Clique em **"Comunicados"** na sidebar

### 19.1 Layout

A tela é dividida em duas colunas:
- **Esquerda (35%):** Lista de comunicados com título, remetente e data
- **Direita (65%):** Conteúdo do comunicado selecionado

### 19.2 O que validar

1. **Lista de comunicados:**
   - Comunicados **não lidos** têm destaque visual (bold, ponto azul, fundo diferente)
   - Comunicados **lidos** têm aparência normal
2. **Ao clicar em um comunicado:**
   - O conteúdo aparece na coluna da direita
   - O comunicado é marcado como lido (o destaque visual some)
   - O contador de "Não lidos" no dashboard diminui em 1
3. **Criação de comunicado (ADMIN):**
   - Botão "Novo Comunicado" no topo
   - Formulário com: Título, Mensagem, Destinatários (TODOS / TURMA específica / TODOS OS PROFESSORES)
   - Após salvar, o comunicado aparece na lista

**Teste de leitura:**
1. Identifique um comunicado com destaque de "não lido"
2. Clique nele
3. **Esperado:** O conteúdo carrega na coluna da direita e o destaque de não lido desaparece

**Teste de criação (como ADMIN):**
1. Clique em "Novo Comunicado"
2. Preencha título e mensagem
3. Selecione "TODOS" como destinatários
4. Clique em "Enviar"
5. **Esperado:** O comunicado aparece no topo da lista para todos os usuários

---

## 20. Módulo Configurações (ADMIN)

**URL:** `/settings`

**Como acessar:** Clique em **"Configurações"** na sidebar (visível apenas para ADMIN)

### 20.1 O que validar

1. **Média mínima para aprovação:** campo numérico com o valor atual (padrão: 6,0)
2. Altere o valor (ex: para 7,0)
3. Clique em "Salvar"
4. **Esperado:** Toast verde de sucesso
5. Recarregue a página e confirme que o novo valor foi persistido

6. **Histórico de alterações:** lista mostrando quem alterou a configuração, o valor anterior, o novo valor e a data/hora

---

## 21. Controle de acesso por perfil

Esta seção valida que cada perfil vê apenas o que deve ver.

### 21.1 Menu da sidebar por perfil

| Item do menu | ADMIN | PROFESSOR | ALUNO |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Alunos (Listar/Cadastrar) | ✅ | ❌ | ❌ |
| Professores | ✅ | ❌ | ❌ |
| Turmas | ✅ | ❌ | ❌ |
| Disciplinas | ✅ | ❌ | ❌ |
| Calendário | ✅ | ❌ | ❌ |
| Avaliações | ✅ | ✅ | ❌ |
| Notas (lançamento) | ✅ | ✅ | ❌ |
| Boletim | ❌ | ❌ | ✅ |
| Frequência | ✅ | ✅ (lança) | ✅ (consulta) |
| Comunicados | ✅ | ✅ | ✅ |
| Configurações | ✅ | ❌ | ❌ |
| Meu Perfil | ❌ | ✅ | ✅ |
| Matrícula Rápida (sidebar inferior) | ✅ | ❌ | ❌ |

### 21.1.1 Botões e ações escondidos dentro das telas

Mesmo nas telas em que um perfil tem permissão de **leitura**, as ações de escrita só aparecem para quem pode executá-las. Para validar:

| Tela | Perfil | O que deve estar **escondido** |
|---|---|---|
| `/disciplines` | PROFESSOR / ALUNO | botão "Nova Disciplina" e ícones de editar/excluir |
| `/classes` | PROFESSOR / ALUNO | botão "Nova Turma" |
| `/classes/:id` | PROFESSOR / ALUNO | botão "Alocar Aluno" |
| `/assessments` | ALUNO | botão "Nova Avaliação" (visível para ADMIN e PROFESSOR) |
| `/settings` | PROFESSOR | botão "Alterar" da média mínima (ao acessar via URL) |
| `/teachers/:id` | PROFESSOR (vendo o próprio perfil) | botões "Editar Professor" e "Adicionar Horário"; queries de lookup de turmas/disciplinas não são disparadas |

> **Como validar visualmente:** abra a tela com cada perfil e confirme que as ações restritas não aparecem na UI — não basta confiar no bloqueio do menu lateral.

### 21.2 Como testar o controle de acesso

**Teste 1 — Aluno tentando acessar rota de admin:**
1. Faça login como ALUNO
2. Tente acessar diretamente: `http://localhost:5173/students`
3. **Esperado:** Redireciona para `/unauthorized` com mensagem "Acesso negado" ou redireciona para o dashboard

**Teste 2 — Professor tentando acessar Configurações:**
1. Faça login como PROFESSOR
2. Tente acessar: `http://localhost:5173/settings`
3. **Esperado:** Redireciona para `/unauthorized` ou o item não aparece na sidebar

**Teste 3 — Itens invisíveis no menu:**
1. Faça login como ALUNO
2. **Esperado:** A sidebar não exibe "Alunos", "Professores", "Turmas", "Disciplinas", "Avaliações", "Configurações"
3. **Esperado:** A sidebar exibe "Dashboard", "Meu Perfil", "Boletim", "Frequência", "Comunicados"

---

## 22. Fluxos integrados completos

Esta seção cobre os fluxos mais importantes do ponto de vista acadêmico, testando múltulos módulos em sequência.

### 22.1 Fluxo: Matrícula de novo aluno e verificação no sistema

**Objetivo:** Matricular um aluno e confirmar que ele aparece em todas as telas relevantes.

1. Faça login como **ADMIN**
2. Vá para `/students/new`
3. Preencha todos os dados do aluno (incluindo CEP para testar o auto-fill)
4. Associe o aluno a uma turma existente
5. Clique em "Salvar"
6. **Checkpoint:** Toast de sucesso + redirecionamento para a lista
7. Na lista, busque pelo nome do aluno → **deve aparecer**
8. Clique no aluno para ver o detalhe → **dados devem estar corretos**
9. Vá para `/classes/:id` da turma selecionada → **aluno deve aparecer na lista da turma**
10. Faça login como o **PROFESSOR** da turma
11. Vá para `/frequency` e selecione a turma → **aluno deve aparecer na chamada**

### 22.2 Fluxo: Lançamento de notas e reflexo no boletim

**Objetivo:** Lançar notas e confirmar que o boletim é atualizado.

1. Faça login como **ADMIN** ou **PROFESSOR**
2. Certifique-se de que há uma avaliação cadastrada em `/assessments`
3. Vá para `/grades`
4. Selecione a avaliação
5. Digite notas para pelo menos 3 alunos (uma nota ≥ 7, uma entre 5-6, uma < 5)
6. Clique em "Salvar Notas"
7. **Checkpoint:** Toast verde de sucesso
8. Agora faça login como **ALUNO** (um dos que recebeu nota)
9. Vá para `/boletim`
10. **Esperado:** A nota lançada aparece no bimestre correto, com a cor correspondente

### 22.3 Fluxo: Registro de frequência e consulta pelo aluno

**Objetivo:** Professor registra chamada; aluno vê o percentual atualizado.

1. Faça login como **PROFESSOR**
2. Vá para `/frequency`
3. Selecione turma, disciplina e a data de hoje
4. Marque metade dos alunos como Presente, metade como Falta
5. Clique em "Salvar Chamada"
6. **Checkpoint:** Toast verde de sucesso
7. Faça login como **ALUNO** que foi marcado como Falta
8. Vá para `/frequency`
9. **Esperado:** A disciplina mostra 1 falta a mais que antes; o percentual diminuiu

### 22.4 Fluxo: Envio e leitura de comunicado

**Objetivo:** Admin envia comunicado; professor e aluno recebem e leem.

1. Faça login como **ADMIN**
2. Vá para `/communications`
3. Clique em "Novo Comunicado"
4. Preencha:
   - Título: "Aviso de Reunião de Pais"
   - Mensagem: "A reunião de pais e mestres será realizada no próximo sábado às 9h."
   - Destinatários: **TODOS**
5. Clique em "Enviar"
6. **Checkpoint:** O comunicado aparece no topo da lista
7. Faça login como **PROFESSOR**
8. O dashboard deve mostrar +1 em "Comunicados Não Lidos"
9. Vá para `/communications`
10. O novo comunicado deve aparecer com **destaque de não lido** (bold ou marcação visual)
11. Clique no comunicado
12. **Esperado:** Conteúdo carrega à direita; destaque some (marcado como lido)
13. Volte ao Dashboard → "Comunicados Não Lidos" diminuiu em 1

---

## 23. Comportamento de token e sessão

### 23.1 Persistência de sessão ao fechar e reabrir o navegador

1. Faça login como ADMIN
2. Feche a aba do navegador
3. Abra uma nova aba e acesse `http://localhost:5173`
4. **Esperado:** Você ainda está logado (a sessão é persistida no `localStorage` via Zustand)

**Teste extra (F5 em qualquer página autenticada):**
1. Estando logado, navegue para `/students` (ou qualquer outra rota autenticada)
2. Aperte **F5** para recarregar a página
3. **Esperado:** A página recarrega e você continua na mesma rota, ainda logado — sem cair em `/login`. O `authStore` tem um `onRehydrateStorage` que volta a decodificar o JWT a partir do `localStorage` no boot, repopulando `user` e `isAuthenticated`.

### 23.2 Logout manual

1. Estando logado, clique em **"Sair"** no fundo da sidebar (texto vermelho)
2. **Esperado:**
   - Redireciona para `/login`
   - Tente acessar `/dashboard` → redireciona de volta para `/login`
   - O `localStorage` foi limpo (tokens removidos)

**Como verificar o localStorage:**
1. Abra o Chrome DevTools (F12)
2. Aba "Application" → "Local Storage" → `http://localhost:5173`
3. Após login: deve haver uma chave `auth-store` com tokens
4. Após logout: a chave deve ser removida ou os tokens devem estar vazios

### 23.3 Renovação automática de token (refresh token)

O sistema renova automaticamente o `accessToken` quando ele expira, usando o `refreshToken`. Isso acontece de forma transparente — o usuário não precisa fazer login novamente.

**Como simular para testar:**
1. Faça login
2. Abra o DevTools (F12) → aba "Application" → "Local Storage"
3. Localize a chave `auth-store`
4. Edite manualmente o campo `accessToken` para um valor inválido (ex: `token-invalido`)
5. Tente fazer qualquer requisição na interface (ex: navegue para `/students`)
6. **Esperado:** O sistema detecta o erro 401, usa o `refreshToken` para obter um novo `accessToken`, e a requisição é refeita automaticamente — sem mostrar erro ao usuário

7. Se o `refreshToken` também for inválido/expirado, o sistema faz logout automático e redireciona para `/login`

### 23.4 Sessão expirada por inatividade

1. Faça login
2. Aguarde o `accessToken` expirar naturalmente (tempo configurado no auth-service)
3. Tente navegar para qualquer módulo
4. **Esperado:** O interceptor Axios detecta o 401, renova o token e a navegação continua normalmente

---

## 24. Problemas comuns e soluções

### ❌ Tela em branco ao acessar `localhost:5173`

**Causa provável:** O servidor do frontend não está rodando.

**Solução:**
```bash
npm run dev --prefix frontend
```

---

### ❌ Cards do Dashboard mostram "—" em vez de números

**Causa provável:** O microsserviço correspondente não está rodando.

**Solução:** Verifique qual terminal parou e reinicie o serviço:
```bash
# Exemplo: MS-01 parou
npm run dev --prefix MS01_gestao_de_alunos
```

---

### ❌ Erro "Network Error" ou "Failed to fetch" no console

**Causa provável:** Um ou mais microsserviços de backend estão offline.

**Solução:**
1. Abra o DevTools (F12) → aba "Network"
2. Identifique qual requisição falhou (coluna "Status" mostrará erro de rede)
3. A URL da requisição indicará qual porta está offline
4. Reinicie o serviço correspondente à porta

---

### ❌ "E-mail ou senha incorretos" mesmo com credenciais certas

**Causa provável 1:** O auth-service não está rodando (porta 3000).

**Solução:** Inicie o auth-service e tente novamente.

**Causa provável 2:** O usuário não foi cadastrado no banco de dados.

**Solução:** Verifique se o usuário existe no banco com:
```sql
USE auth_service_db;
SELECT email, role FROM users;
```

---

### ❌ Após o login, fica em tela de carregamento / redireciona de volta para `/login`

**Causa provável:** O token recebido está sendo mal interpretado pelo store.

**Solução:**
1. Abra o DevTools → aba "Console"
2. Verifique se há erros relacionados ao Zustand ou ao JWT
3. Limpe o localStorage: DevTools → Application → Local Storage → clique com direito → "Clear"
4. Tente fazer login novamente

---

### ❌ A sidebar mostra itens do admin para um professor/aluno

**Causa provável:** O campo `role` no token JWT não está sendo lido corretamente.

**Solução:**
1. Abra o DevTools → Console
2. Digite: `JSON.parse(localStorage.getItem('auth-store'))`
3. Verifique o campo `user.role` — deve ser `ADMIN`, `PROFESSOR` ou `ALUNO`
4. Se estiver incorreto, o problema está no auth-service (verifique como o token está sendo gerado)

---

### ❌ Auto-fill de CEP não funciona

**Causa provável:** Sem conexão com a internet (a ViaCEP é uma API externa).

**Solução:** Verifique a conexão e tente novamente. Se estiver em rede sem acesso à internet, o campo ficará em branco — preencha manualmente.

---

### ❌ As notas lançadas não aparecem no boletim

**Causa provável 1:** O MS-04 não está rodando (porta 3004).

**Causa provável 2:** O cache do TanStack Query ainda não foi invalidado.

**Solução:**
1. Verifique se o MS-04 está ativo
2. Recarregue a página do boletim com `Ctrl + F5` (força recarregamento sem cache)
3. Aguarde alguns segundos — o cache expira em 2 minutos por padrão

---

### ❌ Página mostra "404 Not Found" ao atualizar (F5) no Docker

**Causa provável:** O nginx não estava configurado para redirecionar todas as rotas para o `index.html` (comportamento obrigatório em SPAs).

**Situação:** Corrigida. O arquivo `frontend/nginx.conf` com `try_files $uri $uri/ /index.html` já está incluso na imagem Docker. Recarregar a página em qualquer rota (ex.: `/dashboard`, `/students/123`) funciona normalmente.

**Se ainda ocorrer:** Reconstrua a imagem Docker do frontend com `docker compose build --no-cache frontend && docker compose up -d frontend`.

---

### ❌ Página mostra "404 — Página não encontrada" (recurso inexistente)

**Causa provável:** Você acessou uma URL inválida.

**Solução:** Verifique a URL digitada. Use a sidebar para navegar. Se a URL parece correta, pode ser que o item não exista no banco (ex: `/students/id-inexistente`).

---

### ❌ Página mostra "403 — Acesso negado"

**Causa provável:** Você tentou acessar uma rota que seu perfil não tem permissão.

**Solução:** Faça login com o perfil correto (ADMIN para acessar `/settings`, por exemplo).

---

## Referência Rápida — URLs por perfil

### ADMIN — Todas as rotas disponíveis

| Rota | Tela |
|---|---|
| `/dashboard` | Dashboard com estatísticas gerais |
| `/students` | Lista de alunos |
| `/students/new` | Cadastro de aluno |
| `/students/:id` | Detalhe do aluno |
| `/students/:id/edit` | Edição do aluno |
| `/teachers` | Lista de professores |
| `/teachers/:id` | Detalhe do professor |
| `/classes` | Lista de turmas |
| `/classes/:id` | Detalhe da turma |
| `/disciplines` | Lista de disciplinas |
| `/calendar` | Calendário escolar |
| `/assessments` | Avaliações |
| `/grades` | Lançamento de notas |
| `/grades/:alunoId/boletim` | Boletim de um aluno específico |
| `/frequency` | Frequência |
| `/communications` | Comunicados |
| `/settings` | Configurações do sistema |

### PROFESSOR — Rotas disponíveis

| Rota | Tela |
|---|---|
| `/dashboard` | Dashboard do professor |
| `/teachers/:id` | Meu perfil |
| `/frequency` | Registro de chamada |
| `/assessments` | Avaliações das minhas turmas |
| `/grades` | Lançamento de notas |
| `/communications` | Comunicados |

### ALUNO — Rotas disponíveis

| Rota | Tela |
|---|---|
| `/dashboard` | Dashboard do aluno |
| `/students/:id` | Meu perfil |
| `/boletim` | Meu boletim |
| `/frequency` | Consulta de frequência |
| `/communications` | Comunicados |
