# Especificação de Frontend — Sistema de Gestão Escolar
## Documento para geração de design (AI Stitch)

> **Contexto:** Este documento descreve completamente o sistema para o qual o frontend deve ser criado. O objetivo é uma aplicação web moderna, responsiva e profissional que sirva como painel de controle de uma instituição de ensino, com três perfis de usuário distintos (Admin, Professor, Aluno). Leia tudo antes de gerar qualquer tela.

---

## 1. O que é o sistema

O **Sistema de Gestão Escolar** é uma aplicação web usada no dia a dia de uma escola. Três tipos de usuário interagem com ele:

- **Administrador (ADMIN):** secretaria/coordenação. Gerencia tudo: alunos, professores, turmas, disciplinas, calendário, médias e comunicados.
- **Professor (PROFESSOR):** Lança frequência e notas das próprias turmas. Consulta sua grade de horários. Envia comunicados.
- **Aluno (ALUNO):** Somente leitura. Consulta seu boletim, frequência, horário e comunicados.

Cada perfil vê uma interface diferente — menus, telas e ações variam de acordo com o que o usuário pode fazer.

---

## 2. Stack do Frontend

| Tecnologia | Papel |
|---|---|
| **React 18 + Vite** | Framework e bundler |
| **TypeScript** | Linguagem (tipagem estrita) |
| **Tailwind CSS v3** | Estilização utility-first |
| **React Router v7** | Roteamento SPA (client-side) |
| **TanStack Query v5** | Fetch, cache e sincronização de dados com as APIs |
| **Zustand** | Estado global (usuário autenticado, token JWT) |
| **Axios** | Cliente HTTP |

O frontend consome exclusivamente as APIs REST dos 6 microsserviços do backend. **Não há banco de dados no frontend.** Toda informação vem de chamadas HTTP com token JWT no header `Authorization: Bearer <token>`.

---

## 3. Autenticação

### Como funciona
1. Usuário entra na tela de **Login** com e-mail e senha
2. A API retorna `{ accessToken, refreshToken, role }`
3. O `accessToken` expira em **15 minutos** — o sistema renova automaticamente em background usando o `refreshToken` (válido 7 dias)
4. Enquanto logado, o token é enviado em **todas** as requisições
5. O payload do token contém: `role` (ADMIN/PROFESSOR/ALUNO), `sub` (ID do usuário), `referenciaId` (ID do aluno ou professor vinculado), `turmaId` (para alunos)

### Redirecionamento pós-login
- ADMIN → `/dashboard`
- PROFESSOR → `/dashboard`
- ALUNO → `/dashboard`

(O dashboard muda conforme o role, mas a URL é a mesma)

---

## 4. Layout Geral

### Estrutura visual

O layout é dividido em **3 zonas fixas**:

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR  (logo + nome do usuário + badge de notificações)   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │            ÁREA DE CONTEÚDO                  │
│   (nav)      │         (muda conforme a rota)               │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** fixa à esquerda, ~240px de largura. Em mobile, recolhe e abre com hamburguer.
- **Topbar:** fixa no topo. Exibe logo, nome do usuário logado, seu role em uma badge colorida, e um sino com contador de comunicados não lidos.
- **Área de conteúdo:** ocupa o restante. Scroll vertical quando necessário.

### Cores principais sugeridas

| Elemento | Cor sugerida |
|---|---|
| Primary (botões, links ativos, badges) | Azul institucional — `#1E40AF` (blue-800) ou similar |
| Sidebar background | Cinza muito escuro ou azul escuro — `#1E293B` (slate-800) |
| Sidebar texto ativo | Branco |
| Sidebar texto inativo | Cinza claro — `#94A3B8` |
| Background geral | Cinza claríssimo — `#F1F5F9` (slate-100) |
| Cards | Branco com sombra suave |
| Danger (excluir, reprovar) | Vermelho — `#DC2626` |
| Success (aprovado, presente) | Verde — `#16A34A` |
| Warning (atenção, prova final) | Âmbar — `#D97706` |
| Neutral | Slate/cinza |

### Tipografia
- **Fonte:** Inter ou similar (sans-serif limpa)
- Títulos de página: `text-2xl font-semibold`
- Labels de formulário: `text-sm font-medium text-slate-700`
- Dados em tabela: `text-sm text-slate-900`
- Texto secundário/auxiliar: `text-sm text-slate-500`

---

## 5. Navegação por Perfil

### ADMIN — Menu lateral

```
📊  Dashboard
👥  Alunos
    ├── Listar alunos
    └── Cadastrar aluno
👨‍🏫  Professores
    ├── Listar professores
    └── Cadastrar professor
🏫  Turmas
    ├── Listar turmas
    └── Criar turma
📚  Disciplinas
📅  Calendário
📝  Avaliações
📊  Notas
📢  Comunicados
⚙️  Configurações
```

### PROFESSOR — Menu lateral

```
📊  Dashboard
👤  Meu Perfil
🗓️  Minha Grade
✅  Frequência
📝  Avaliações
📊  Notas
📢  Comunicados
```

### ALUNO — Menu lateral

```
📊  Dashboard
👤  Meu Perfil
📊  Boletim
✅  Frequência
🗓️  Horário
📢  Comunicados
📋  Histórico
```

---

## 6. Telas — Descrição Detalhada

---

### 6.1 Login

**URL:** `/login`  
**Acesso:** Público (sem autenticação)

**Elementos da tela:**
- Logo da escola centralizado no topo
- Card centralizado (max ~400px) com leve sombra
- Título: "Acesso ao Sistema"
- Campo: **E-mail** (type email, placeholder: "seu@email.com")
- Campo: **Senha** (type password, com botão de mostrar/ocultar senha)
- Botão primário: "Entrar" (largura total)
- Texto de erro em vermelho abaixo do formulário (ex: "Credenciais inválidas")
- Estado de loading no botão enquanto a requisição está em andamento

**Design:** Fundo com gradient sutil ou pattern geométrico. Card branco com bordas arredondadas. Limpo e profissional.

---

### 6.2 Dashboard — ADMIN

**URL:** `/dashboard` (quando role = ADMIN)  
**Dados carregados:** contagem de alunos, professores, turmas ativas, comunicados não lidos, notas recentes

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Bom dia, Admin! · Terça, 14 de abril de 2026           │
├──────────┬──────────┬──────────┬────────────────────────┤
│ 📦 148   │ 👨‍🏫 24    │ 🏫 12    │ 📢 5 não lidos         │
│ Alunos   │Professores│ Turmas  │ Comunicados            │
├──────────┴──────────┴──────────┴────────────────────────┤
│                                                         │
│  [Notas Recentes ─ últimas 5]     [Ações Rápidas]      │
│  Tabela com: Aluno, Disciplina,   + Cadastrar aluno     │
│  Bimestre, Nota, Data             + Cadastrar professor  │
│                                   + Criar turma         │
│                                   + Novo comunicado     │
│                                                         │
│  [Calendário — próximos eventos]                        │
│  Lista compacta: data + descrição + tipo (badge)        │
└─────────────────────────────────────────────────────────┘
```

**Cards de estatísticas:** 4 cards em linha, cada um com ícone grande, número em destaque e label. Ao clicar, navega para a seção correspondente.

**Tabela de notas recentes:** colunas — Aluno, Disciplina, Bimestre, Valor (badge colorida: verde ≥6, vermelho <6), Lançada em.

---

### 6.3 Dashboard — PROFESSOR

**URL:** `/dashboard` (quando role = PROFESSOR)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Olá, Maria!                                            │
├─────────────────────────────┬───────────────────────────┤
│  Minha Grade — Hoje         │  Comunicados              │
│  ┌──────────────────────┐   │  (3 não lidos)            │
│  │ 19:00 Matemática 3A  │   │  • Reunião pedagógica...  │
│  │ 20:40 Matemática 3B  │   │  • Alteração de horário.. │
│  └──────────────────────┘   │  [Ver todos]              │
├─────────────────────────────┴───────────────────────────┤
│  Lançamentos Pendentes                                  │
│  Avaliações criadas sem nota para todos os alunos       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Prova 1 · Matemática · Turma 3A · 5 pendentes   │    │
│  │ Trabalho · Matemática · Turma 3B · 8 pendentes  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

### 6.4 Dashboard — ALUNO

**URL:** `/dashboard` (quando role = ALUNO)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Olá, João!  Turma 3A · 2026                            │
├────────────────────┬────────────────────────────────────┤
│  Resumo do Boletim │  Comunicados Recentes              │
│                    │  (2 não lidos)                     │
│  Matemática  7.5 ✅ │  • Reunião de pais — 15/05...     │
│  Português   6.0 ✅ │  • Aviso turma 3A...              │
│  Física      4.5 ⚠️ │  [Ver todos]                      │
│  [Ver boletim]    │                                    │
├────────────────────┴────────────────────────────────────┤
│  Próximas Avaliações                                    │
│  📝 Prova 1 · Matemática · 20/04 · Bimestre 1          │
│  📝 Trabalho · Física · 25/04 · Bimestre 1             │
└─────────────────────────────────────────────────────────┘
```

---

### 6.5 Lista de Alunos (ADMIN)

**URL:** `/students`

**Elementos:**
- **Header da página:** "Alunos" (h1) + badge com total (ex: "148 cadastrados") + botão "**+ Cadastrar Aluno**" (direita)
- **Barra de busca e filtros:**
  - Input de busca por nome/matrícula/e-mail (esquerda)
  - Dropdown "Status": Todos / Ativo / Inativo (direita)
- **Tabela:**
  | Matrícula | Nome | E-mail | Turma | Status | Ações |
  |---|---|---|---|---|---|
  | MAT-001 | João Silva | joao@... | 3A-2026 | 🟢 Ativo | [Ver] [Editar] [Inativar] |
  - Status exibido como badge colorida (verde = Ativo, cinza = Inativo)
  - Ações como ícones de botão (olho, lápis, lixeira)
- **Paginação** na parte inferior: "Exibindo 1–20 de 148" com botões Anterior/Próximo e seletor de itens por página

**Responsividade:** Em telas menores, a tabela tem scroll horizontal. Em mobile, pode virar cards.

---

### 6.6 Formulário de Cadastro/Edição de Aluno (ADMIN)

**URL:** `/students/new` e `/students/:id/edit`

**Layout:** Formulário em duas colunas (em desktop), uma coluna (em mobile)

**Campos:**
- **Dados Pessoais** (seção com título)
  - Nome Completo (obrigatório)
  - CPF (máscara: 000.000.000-00)
  - Data de Nascimento (date picker)
  - Telefone (máscara: (00) 00000-0000)
  - E-mail (obrigatório)
  - Matrícula (opcional — gerada automaticamente se vazio)
- **Endereço** (seção com título)
  - CEP (máscara + busca automática via ViaCEP)
  - Logradouro
  - Número
  - Complemento (opcional)
  - Bairro
  - Cidade
  - Estado (dropdown com UFs)
- **Vínculo Escolar** (seção com título)
  - Turma Atual (dropdown das turmas ativas)
- **Botões:** "Salvar" (primário) e "Cancelar" (secundário)

---

### 6.7 Detalhe do Aluno (ADMIN)

**URL:** `/students/:id`

**Layout com abas:**

```
[João da Silva · MAT-2026-001 · 3A · Ativo]

[ Dados Pessoais | Frequência | Boletim | Histórico ]
```

- **Aba Dados Pessoais:** Grid com todos os campos do aluno em modo leitura. Botão "Editar" no canto.
- **Aba Frequência:** Tabela com disciplinas × bimestres. Colunas: Disciplina, Bimestre, Total Aulas, Presenças, Faltas, %, Status (badge verde/vermelho). Botão "Override" para admin.
- **Aba Boletim:** Tabela com médias por disciplina × bimestre. Linha de Média Anual ao final. Badges coloridas (verde ≥6, amarelo 5–5.99, vermelho <5).
- **Aba Histórico:** Timeline ou tabela por ano letivo com resultado em cada disciplina.

---

### 6.8 Lista de Professores (ADMIN)

**URL:** `/teachers`

Similar à lista de alunos.

**Tabela:**
| Nome | E-mail | Disciplinas | Grade | Ações |
|---|---|---|---|---|
| Maria Oliveira | maria@... | Matemática, Física | 3 turmas | [Ver] [Editar] [Remover] |

---

### 6.9 Formulário de Cadastro/Edição de Professor (ADMIN)

**URL:** `/teachers/new` e `/teachers/:id/edit`

**Campos:**
- Nome Completo (obrigatório)
- E-mail (obrigatório)

---

### 6.10 Detalhe do Professor (ADMIN)

**URL:** `/teachers/:id`

**Layout com abas:**

```
[ Maria Oliveira Santos ]

[ Dados | Grade Horária | Substituições ]
```

- **Aba Grade Horária:** Tabela semanal (segunda a sábado × horários). Cada célula: Disciplina + Turma. Botão "Adicionar horário". Cards clicáveis para editar. Filtros por Bimestre e Ano.
- **Aba Substituições:** Histórico de substituições registradas (data início, fim, motivo, professor substituto).

---

### 6.11 Gestão de Grade Horária (ADMIN)

**Dentro do detalhe do professor**

**Formulário modal** "Adicionar/Editar Horário":
- Turma (dropdown)
- Disciplina (dropdown)
- Bimestre (1–4)
- Ano Letivo
- Dia da Semana (dropdown: Segunda a Sábado)
- Horário Início (time picker)
- Horário Fim (time picker)

**Formulário modal** "Registrar Substituição":
- Professor Substituto (dropdown de professores)
- Motivo (textarea)
- Data Início (date picker)
- Data Fim (date picker)

---

### 6.12 Lista de Turmas (ADMIN)

**URL:** `/classes`

**Tabela:**
| Código | Ano | Turno | Alunos | Professores | Ações |
|---|---|---|---|---|---|
| 3A-2026 | 2026 | Noite | 35 | 8 | [Ver] [Editar] [Remover] |

---

### 6.13 Detalhe da Turma (ADMIN)

**URL:** `/classes/:id`

**Layout com abas:**
```
[ 3A-2026 · Noite · 2026 ]

[ Dados | Alunos | Professores/Grade ]
```

- **Aba Alunos:** Lista dos alunos alocados com botão "Alocar Aluno" (dropdown + data de matrícula) e botão de remoção por linha.
- **Aba Professores/Grade:** Tabela da grade horária da turma (dia × horário), mostrando professor + disciplina em cada slot.

---

### 6.14 Lista de Disciplinas (ADMIN)

**URL:** `/disciplines`

**Tabela simples:**
| Nome | Carga Horária | Ações |
|---|---|---|
| Matemática | 80h | [Editar] [Remover] |

**Modal de criação/edição:** Nome + Carga Horária.

---

### 6.15 Calendário Escolar

**URL:** `/calendar`  
**Acesso:** Todos os perfis (ADMIN gerencia, demais só visualizam)

**Dois modos de visualização (toggle no header):**

**Modo Lista:**
Tabela com: Data, Descrição, Tipo (badge colorida).
- AULA: azul
- FERIADO: vermelho
- RECESSO: laranja
- EVENTO: roxo

**Modo Calendário:**
Grid de calendário mensal com eventos marcados nas datas correspondentes. Ao clicar num evento, abre modal com detalhes.

**Para ADMIN:** botão "+ Novo Evento" abre modal com campos: Data, Descrição, Tipo (dropdown).

**Filtros:** por Tipo, por período (date range picker).

---

### 6.16 Avaliações (ADMIN / PROFESSOR)

**URL:** `/assessments`

**Tabela:**
| Título | Tipo | Disciplina | Turma | Bimestre | Data | Ações |
|---|---|---|---|---|---|---|
| Prova 1 — Álgebra | PROVA | Matemática | 3A | 1º | 20/04 | [Ver] [Editar] |

Tipos exibidos como badges: PROVA (azul), TRABALHO (roxo), RECUPERACAO (âmbar), PROVA_FINAL (laranja escuro).

**Filtros:** Disciplina, Turma, Bimestre, Tipo.

**Modal de criação/edição:**
- Título
- Tipo (dropdown: PROVA, TRABALHO, RECUPERACAO, PROVA_FINAL)
- Bimestre (1, 2, 3, 4)
- Ano Letivo
- Disciplina (dropdown)
- Turma (dropdown)
- Professor (dropdown — preenchido automaticamente se PROFESSOR)
- Data de Aplicação (date picker)
- Peso na Média (number, padrão 1.0)

---

### 6.17 Lançamento de Notas (ADMIN / PROFESSOR)

**URL:** `/grades`

**Layout de duas etapas:**

**Etapa 1 — Selecionar Avaliação:**
Lista/dropdown das avaliações disponíveis. O professor filtra por sua disciplina/turma.

**Etapa 2 — Lançar Notas em Lote:**
Ao selecionar uma avaliação, exibe tabela:

| Aluno | Matrícula | Nota | Status |
|---|---|---|---|
| João Silva | MAT-001 | [input numérico 0–10] | Pendente |
| Ana Costa | MAT-002 | [input numérico 0–10] | Lançada ✅ |

- Notas de 0 a 10, decimais permitidos (ex: 7.5)
- Ao salvar cada linha, a média bimestral é recalculada automaticamente
- Indicador visual por aluno: lançada (verde), pendente (cinza), abaixo da média (amarelo)
- Botão "Salvar Tudo" para enviar todas as notas em lote

---

### 6.18 Boletim do Aluno

**URL:** `/grades/:alunoId/boletim` (Admin/Prof) ou `/boletim` (Aluno vê o próprio)

**Layout principal:** Tabela com disciplinas nas linhas e bimestres nas colunas.

```
┌──────────────┬──────┬──────┬──────┬──────┬──────────┬──────────┬────────┐
│ Disciplina   │  1º  │  2º  │  3º  │  4º  │ Rec.     │ M. Anual │ Sit.   │
├──────────────┼──────┼──────┼──────┼──────┼──────────┼──────────┼────────┤
│ Matemática   │ 7.5  │ 8.0  │ 6.5  │ 7.0  │  —       │  7.25    │ ✅ APR │
│ Português    │ 5.0  │ 5.5  │ 6.0  │ 6.5  │  6.5*    │  6.25    │ ✅ APR │
│ Física       │ 4.0  │ 3.5  │ 5.0  │ 4.5  │  —       │  4.25    │ ⚠️ P.F │
└──────────────┴──────┴──────┴──────┴──────┴──────────┴──────────┴────────┘
```

- Notas abaixo de 6.0: texto em vermelho
- Recuperação aplicada: asterisco com tooltip explicando
- Situação:
  - ✅ APROVADO (verde)
  - ⚠️ PROVA FINAL (âmbar)
  - ❌ REPROVADO (vermelho)
  - 🔄 EM CURSO (cinza, bimestre ainda não finalizado)

**Seção de Prova Final** (exibida se Média Anual < 6.0):
Cards por disciplina com: Média Anual, Nota PF, Média Final, Status Final.

**Seção de Frequência** (resumo abaixo do boletim):
| Disciplina | Total Aulas | Presenças | Faltas | % | Status |
|---|---|---|---|---|---|
| Matemática | 40 | 36 | 4 | 90% | ✅ |
| Física | 40 | 28 | 12 | 70% | ❌ Reprovado por falta |

---

### 6.19 Frequência — Professor

**URL:** `/frequency` (professor vê alunos de suas turmas)

**Fluxo:**
1. Selecionar Turma → Disciplina → Data → Bimestre
2. Lista de alunos da turma com toggle **Presente / Ausente** por aluno
3. Botão "Salvar Presença" envia todos os registros

**Design da lista de chamada:**
```
[ Turma 3A · Matemática · 07/04/2026 · 1º Bimestre ]

João Silva        [● Presente  ○ Ausente]
Ana Costa         [● Presente  ○ Ausente]
Pedro Alves       [○ Presente  ● Ausente]
...

[Salvar Chamada]
```

Contador no topo: "35 alunos · 30 presentes · 5 ausentes"

---

### 6.20 Grade Horária — Professor (Minha Grade)

**URL:** `/schedule` (professor vê sua própria grade)

**Visualização semanal:**

Tabela com horários nas linhas (ex: 19:00, 19:50, 20:40…) e dias da semana nas colunas.  
Cada célula ocupada exibe: Disciplina em negrito + Turma em tamanho menor.  
Células vazias ficam em cinza claro.

Filtro por Bimestre e Ano Letivo no topo.

---

### 6.21 Comunicados

**URL:** `/communications`

**Layout em duas colunas:**

```
┌────────────────────┬───────────────────────────────────────┐
│  Lista de          │  Conteúdo do comunicado selecionado   │
│  Comunicados       │                                       │
│                    │  [Reunião de Pais — 2º Bimestre]     │
│  🔵 Reunião de     │  De: Admin · 11/04/2026              │
│     Pais...        │  Para: Geral                         │
│  ● Aviso Turma 3A  │                                       │
│  ● Novo Horário    │  Informamos que a reunião de pais     │
│    (automático)    │  acontecerá no dia 15/05 às 19h...   │
│                    │                                       │
│                    │  [Marcar como Lido]                   │
└────────────────────┴───────────────────────────────────────┘
```

- Comunicados não lidos: marcador azul e texto em bold
- Comunicados lidos: texto normal
- Badge de tipo: "GERAL" (azul), "TURMA" (verde), "AUTOMÁTICO" (cinza), "MANUAL" (roxo)
- Ícone de sistema (⚙️) para comunicados gerados automaticamente pelo worker
- Para ADMIN/PROFESSOR: botão "+ Novo Comunicado"

**Modal/Drawer "Novo Comunicado":**
- Título (obrigatório)
- Conteúdo (textarea grande, obrigatório)
- Público-alvo (dropdown):
  - **Geral** — todos os usuários
  - **Turma Específica** — exibe dropdown de turmas
  - **Todos os Professores**
  - **Lista Manual** — exibe campo para adicionar IDs/buscar usuários
- Botão "Enviar"

---

### 6.22 Perfil do Usuário

**URL:** `/profile`  
**Acesso:** Todos os perfis

Exibe os dados do usuário logado em modo leitura. Para PROFESSOR e ALUNO, mostra os dados do registro vinculado (nome, e-mail, etc.).

---

### 6.23 Configurações (ADMIN)

**URL:** `/settings`

**Seção "Notas":**
- **Média Mínima de Aprovação:** input numérico com valor atual (padrão: 6.0). Botão "Salvar".
- Histórico de alterações: tabela com data, valor anterior, novo valor.

---

### 6.24 Histórico Escolar — Aluno

**URL:** `/history` (aluno vê o próprio) ou `/students/:id/history` (admin)

Timeline vertical por ano letivo:

```
2026
  └─ Turma 3A
     Matemática    ✅ Aprovado · Média 7.25
     Português     ✅ Aprovado · Média 6.50
     Física        ❌ Reprovado por Nota · Média 4.25

2025
  └─ Turma 2B
     ...
```

---

## 7. Componentes Reutilizáveis

| Componente | Descrição |
|---|---|
| `<PageHeader>` | Título h1 + breadcrumb + botão de ação primária |
| `<DataTable>` | Tabela com ordenação, paginação e busca integradas |
| `<StatusBadge>` | Badge colorida para status (ATIVO/INATIVO, aprovado/reprovado, tipo de avaliação, etc.) |
| `<Modal>` | Dialog centralizado para formulários e confirmações |
| `<Drawer>` | Painel lateral deslizante (para formulários extensos como "Novo Comunicado") |
| `<EmptyState>` | Ilustração + texto quando uma lista está vazia |
| `<LoadingSpinner>` | Indicador de carregamento para requisições |
| `<ConfirmDialog>` | Modal de confirmação para ações destrutivas (excluir, inativar) |
| `<Tabs>` | Abas de navegação internas (usado no detalhe de aluno, professor, turma) |
| `<GradeInput>` | Input numérico especializado: 0–10, valida decimais, mostra cor por faixa |
| `<AttendanceToggle>` | Toggle presente/ausente com visual claro para chamada |
| `<NotificationBell>` | Sino com badge numérico no topbar; dropdown com comunicados recentes |

---

## 8. Fluxos de Navegação Importantes

### Fluxo de Lançamento de Notas (Professor)

```
/assessments → Clica em avaliação → /grades (pré-filtrado) → Preenche notas → Salva → Toast "Notas salvas"
```

### Fluxo de Chamada (Professor)

```
/frequency → Seleciona Turma + Disciplina + Data + Bimestre → Lista de alunos aparece → Marca presença → "Salvar Chamada" → Toast "Chamada salva · 30 presentes"
```

### Fluxo de Cadastro de Aluno (Admin)

```
/students → Clica "+ Cadastrar Aluno" → /students/new → Preenche formulário → "Salvar" → Redireciona para /students/:id (detalhe do aluno criado)
```

### Fluxo de Leitura de Comunicado (Aluno)

```
/dashboard (badge "2 não lidos") → Clica → /communications → Seleciona comunicado → Lê → "Marcar como Lido" → Badge decrementa
```

---

## 9. Estados e Feedbacks Visuais

### Toasts / Notificações inline

Toda ação de sucesso ou erro mostra um **toast** no canto superior direito:
- ✅ Sucesso: verde — "Aluno cadastrado com sucesso!"
- ❌ Erro: vermelho — "Erro ao salvar. Tente novamente."
- ⚠️ Aviso: âmbar — "Token expirado. Reconectando..."

### Loading States

- Botões de submit: ficam desabilitados com spinner durante a requisição
- Tabelas: skeleton loader (linhas cinzas animadas) enquanto carrega
- Páginas inteiras: spinner centralizado no conteúdo

### Validação de Formulários

- Erros inline abaixo de cada campo inválido (texto vermelho pequeno)
- Campo com erro: borda vermelha
- Campos obrigatórios marcados com `*`
- Validação em tempo real onde fizer sentido (ex: CPF, CEP, e-mail)

### Estados Vazios

Quando uma lista não tem itens:
- Ícone ilustrativo grande (ex: caixa vazia, documento)
- Texto descritivo: "Nenhum aluno cadastrado ainda."
- Botão de ação: "Cadastrar primeiro aluno"

---

## 10. Responsividade

| Breakpoint | Comportamento |
|---|---|
| Mobile (< 768px) | Sidebar oculta (hamburguer menu); tabelas viram cards empilhados; formulários em 1 coluna |
| Tablet (768–1024px) | Sidebar recolhida (só ícones); formulários em 2 colunas |
| Desktop (> 1024px) | Sidebar expandida com textos; layouts em múltiplas colunas |

---

## 11. Páginas de Erro

| Situação | Tela |
|---|---|
| Rota não existe | 404 — "Página não encontrada" + botão voltar |
| Sem permissão | 403 — "Você não tem acesso a esta área" |
| Erro de servidor | 500 — "Algo deu errado. Tente novamente." |
| Sessão expirada | Redirect para `/login` com aviso "Sua sessão expirou" |

---

## 12. Integrações com a API (por tela)

| Tela | Endpoints consumidos |
|---|---|
| Login | `POST /v1/auth/login` |
| Dashboard Admin | `GET /v1/students/count` · `GET /v1/teachers/count` · `GET /v1/classes/active/count` · `GET /v1/communications/unread` · `GET /v1/grades/recent` · `GET /v1/calendar/events` |
| Dashboard Professor | `GET /v1/teachers/me` · `GET /v1/teachers/:id/schedule` · `GET /v1/communications` · `GET /v1/assessments` |
| Dashboard Aluno | `GET /v1/students/me` · `GET /v1/grades/:id/boletim` · `GET /v1/communications` · `GET /v1/assessments` |
| Lista Alunos | `GET /v1/students` |
| Detalhe Aluno | `GET /v1/students/:id` · `GET /v1/students/:id/frequency` · `GET /v1/grades/:id/boletim` · `GET /v1/students/:id/history` |
| Lista Professores | `GET /v1/teachers` |
| Detalhe Professor | `GET /v1/teachers/:id` · `GET /v1/teachers/:id/schedule` |
| Grade Horária | `POST/PUT /v1/teachers/:id/schedule` · `POST /v1/teachers/:id/schedule/:id/substitution` |
| Turmas | `GET/POST/PUT/DELETE /v1/classes` · `POST /v1/classes/:id/students` |
| Disciplinas | `GET/POST/PUT/DELETE /v1/disciplines` |
| Calendário | `GET/POST/PUT/DELETE /v1/calendar/events` |
| Avaliações | `GET/POST/PUT /v1/assessments` |
| Notas | `GET /v1/grades/recent` · `POST /v1/grades` · `PUT /v1/grades/:id` · `POST /v1/grades/prova-final` |
| Boletim | `GET /v1/grades/:alunoId/boletim` |
| Frequência (Prof) | `POST /v1/students/:id/frequency` |
| Comunicados | `GET/POST /v1/communications` · `PUT /v1/communications/:id/read` |
| Preferências Notif | `GET/PUT /v1/notifications/preferences` |
| Configurações | `GET/PUT /v1/grades/config` |

---

## 13. Gerenciamento de Estado (Zustand)

```
Store: authStore
  ├── user: { sub, role, referenciaId, turmaId }
  ├── accessToken: string
  ├── refreshToken: string
  ├── isAuthenticated: boolean
  ├── login(email, senha) → chama API, salva tokens
  ├── logout() → limpa store + redireciona
  └── refreshAccessToken() → usa refreshToken para obter novo accessToken
```

O `accessToken` é injetado automaticamente em todas as requisições via interceptor do Axios.

---

## 14. Resumo Visual — Mapa de Telas

```
/login                          ← Pública

/dashboard                      ← Conteúdo varia por role

/students                       ← ADMIN
/students/new
/students/:id
/students/:id/edit

/teachers                       ← ADMIN
/teachers/new
/teachers/:id
/teachers/:id/edit

/classes                        ← ADMIN
/classes/new
/classes/:id
/classes/:id/edit

/disciplines                    ← ADMIN

/calendar                       ← Todos (ADMIN edita)

/assessments                    ← ADMIN, PROFESSOR
/assessments/new
/assessments/:id/edit

/grades                         ← ADMIN, PROFESSOR
/grades/:alunoId/boletim        ← Todos (ALUNO vê o próprio)

/frequency                      ← PROFESSOR (lança) · ALUNO (consulta própria em /boletim)

/schedule                       ← PROFESSOR (minha grade) · ALUNO (horário da turma)

/communications                 ← Todos

/history                        ← ALUNO (próprio) · ADMIN via /students/:id

/profile                        ← Todos

/settings                       ← ADMIN
```

---

## 15. Tom Visual e Identidade

O sistema é usado por uma **instituição de ensino técnico/superior**, então o design deve transmitir:

- **Profissionalismo e seriedade** — não é um app casual
- **Clareza** — muitos dados em tabela; legibilidade é prioridade
- **Confiança** — azul como cor primária, poucas cores de acento
- **Modernidade** — flat design, sem sombras excessivas, bordas arredondadas suaves

**Referências de estilo:** Vercel Dashboard, Linear, Notion, Google Admin Console — interfaces que equilibram densidade de informação com elegância visual.

**NÃO deve parecer:** dark/gamer, colorido demais, com elementos decorativos excessivos, ou com tipografia muito pequena.

---

*Sistema de Gestão Escolar v3.0 · SENAC RJ 2026/1 · Grupo 1 · Noite*
