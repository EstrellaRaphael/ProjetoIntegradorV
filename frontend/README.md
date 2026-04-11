# Frontend — Sistema de Gestão Escolar

> React + TypeScript + Vite + Tailwind CSS · Porta 5173

---

## Visão Geral

SPA (Single Page Application) que serve como interface web do Sistema de Gestão Escolar. Consome exclusivamente as APIs REST dos 6 microsserviços do backend via Axios. Toda a autenticação é feita com JWT emitido pelo auth-service.

O design foi gerado pelo **AI Stitch** (design system "Nexus Acadêmico") e implementado fielmente em React com Tailwind CSS.

---

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| React | 18 | Framework de UI |
| TypeScript | 5 | Tipagem estrita |
| Vite | 8 | Bundler e dev server |
| Tailwind CSS | 3 | Estilização utility-first |
| React Router | v7 | Roteamento client-side |
| TanStack Query | v5 | Cache e sincronização com APIs |
| Zustand | — | Estado global (autenticação) |
| Axios | — | Cliente HTTP |
| react-hot-toast | — | Notificações toast |

---

## Estrutura de Pastas

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      ← Shell: sidebar + topbar + <Outlet />
│   │   │   ├── Sidebar.tsx        ← Sidebar escura com nav por role
│   │   │   └── Topbar.tsx         ← Topbar com sino de notificações
│   │   └── ui/
│   │       ├── Modal.tsx          ← Modal reutilizável (sm/md/lg)
│   │       ├── ConfirmDialog.tsx  ← Dialog de confirmação de ação
│   │       ├── EmptyState.tsx     ← Estado vazio com ação opcional
│   │       └── Pagination.tsx     ← Paginação "Exibindo X–Y de Z"
│   ├── pages/
│   │   ├── Login.tsx              ← Tela de login
│   │   ├── Dashboard.tsx          ← Router de dashboard por role
│   │   ├── Dashboard/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ProfessorDashboard.tsx
│   │   │   └── AlunoDashboard.tsx
│   │   ├── students/
│   │   │   ├── StudentList.tsx    ← Lista com busca, filtro e paginação
│   │   │   ├── StudentDetail.tsx  ← Detalhe com abas (Dados/Freq/Boletim/Histórico)
│   │   │   └── StudentForm.tsx    ← Cadastro/edição com auto-fill CEP (ViaCEP)
│   │   ├── teachers/
│   │   │   ├── TeacherList.tsx
│   │   │   └── TeacherDetail.tsx  ← Grade horária semanal + substituições
│   │   ├── classes/
│   │   │   ├── ClassList.tsx
│   │   │   └── ClassDetail.tsx    ← Alunos alocados + grade da turma
│   │   ├── disciplines/
│   │   │   └── DisciplineList.tsx
│   │   ├── calendar/
│   │   │   └── CalendarPage.tsx   ← Visualização lista ou grade mensal
│   │   ├── assessments/
│   │   │   └── AssessmentList.tsx ← Filtro por bimestre e tipo
│   │   ├── grades/
│   │   │   ├── GradeLaunch.tsx    ← Lançamento em lote (input verde/vermelho)
│   │   │   ├── Boletim.tsx        ← Boletim completo com prova final
│   │   │   └── Frequency.tsx      ← Chamada (Professor) ou consulta (Aluno)
│   │   ├── communications/
│   │   │   └── CommunicationsPage.tsx ← Layout 35/65 lista + conteúdo
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx   ← Média mínima + histórico de alterações
│   │   └── errors/
│   │       ├── NotFound.tsx       ← 404
│   │       └── Unauthorized.tsx   ← 403
│   ├── services/
│   │   └── api.ts                 ← Axios clients + services para cada MS
│   ├── store/
│   │   └── authStore.ts           ← Zustand: tokens, user, login, logout
│   ├── types/
│   │   └── index.ts               ← Todos os tipos TypeScript do domínio
│   ├── router.tsx                 ← Rotas + guard RequireAuth
│   ├── main.tsx                   ← App entry: QueryClient + RouterProvider + Toaster
│   └── index.css                  ← Tailwind + design system (tokens Stitch)
├── stitch/                        ← Design de referência gerado pelo AI Stitch
│   ├── nexus_acadêmico/DESIGN.md  ← Design system "Nexus Acadêmico"
│   └── */screen.png               ← Screenshot de cada tela
├── .claude/launch.json            ← Config do preview server
├── tailwind.config.js             ← Tokens de cor do design system
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Design System

Design gerado pelo AI Stitch, batizado internamente de **"Nexus Acadêmico"**. Os tokens de cor estão registrados no `tailwind.config.js` e as classes utilitárias compostas em `src/index.css`.

### Paleta principal

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#00288e` | Fundo de botões primários |
| `primary-container` | `#1e40af` | Gradiente de CTAs |
| `surface` | `#f9f9ff` | Canvas da aplicação |
| `surface-container-lowest` | `#ffffff` | Cards e modais |
| `surface-container-low` | `#f0f3ff` | Cabeçalhos de tabela, hover de linha |
| `on-surface` | `#111c2d` | Texto principal |
| `on-surface-variant` | `#444653` | Labels, texto secundário |
| `sidebar` | `#0f1c2d` | Fundo da sidebar |
| `error` | `#ba1a1a` | Estados de erro |
| `success` | `#16a34a` | Aprovado, presente |
| `warning` | `#d97706` | Atenção, prova final |

### Classes CSS compostas (em `index.css`)

| Classe | Descrição |
|---|---|
| `.btn-primary` | Botão primário com gradiente azul |
| `.btn-secondary` | Botão secundário cinza |
| `.btn-ghost` | Botão transparente texto azul |
| `.btn-danger` | Botão de ação destrutiva |
| `.card` / `.card-padded` | Card branco com sombra ambiente |
| `.input-field` | Input field estilizado |
| `.badge-*` | Badges coloridas (success/danger/warning/primary/neutral) |
| `.table-wrap` / `.th` / `.td` / `.tr-row` | Tabela sem bordas duras |
| `.stat-card` / `.stat-value` / `.stat-label` | Cards de estatística do dashboard |
| `.nav-item` / `.nav-item.active` | Item de navegação da sidebar |
| `.page-title` / `.page-subtitle` | Cabeçalho de página |

---

## Autenticação e Roteamento

### Guard `RequireAuth`

Todo o layout autenticado (`/dashboard`, `/students`, etc.) é protegido por um guard em `router.tsx`. Se não houver `accessToken` no store, redireciona para `/login`.

### Renovação automática de token

O interceptor de resposta do Axios em `src/services/api.ts` detecta erro `401`, usa o `refreshToken` para obter um novo `accessToken` via `POST /v1/auth/refresh` e repete a requisição original automaticamente. Se o refresh falhar, faz logout e redireciona para `/login`.

### Navegação por role

A sidebar em `Sidebar.tsx` renderiza menus diferentes conforme `useAuthStore().user.role`:

| Role | Acesso |
|---|---|
| `ADMIN` | Todas as seções |
| `PROFESSOR` | Dashboard, Frequência, Avaliações, Notas, Comunicados |
| `ALUNO` | Dashboard, Boletim, Frequência, Comunicados |

---

## Telas Implementadas

| Tela | Rota | Roles |
|---|---|---|
| Login | `/login` | Público |
| Dashboard Admin | `/dashboard` | ADMIN |
| Dashboard Professor | `/dashboard` | PROFESSOR |
| Dashboard Aluno | `/dashboard` | ALUNO |
| Lista de Alunos | `/students` | ADMIN |
| Cadastro de Aluno | `/students/new` | ADMIN |
| Detalhe do Aluno | `/students/:id` | ADMIN |
| Edição de Aluno | `/students/:id/edit` | ADMIN |
| Lista de Professores | `/teachers` | ADMIN |
| Detalhe do Professor | `/teachers/:id` | ADMIN |
| Lista de Turmas | `/classes` | ADMIN |
| Detalhe da Turma | `/classes/:id` | ADMIN |
| Disciplinas | `/disciplines` | ADMIN |
| Calendário | `/calendar` | Todos |
| Avaliações | `/assessments` | ADMIN, PROFESSOR |
| Lançamento de Notas | `/grades` | ADMIN, PROFESSOR |
| Boletim | `/grades/:alunoId/boletim` | Todos |
| Frequência | `/frequency` | PROFESSOR (lança) / ALUNO (consulta) |
| Comunicados | `/communications` | Todos |
| Configurações | `/settings` | ADMIN |
| 404 | `*` | — |
| 403 | `/unauthorized` | — |

---

## Integração com os Microsserviços

O arquivo `src/services/api.ts` cria um cliente Axios por microsserviço. As URLs são configuráveis via variáveis de ambiente:

| Variável | Padrão | Serviço |
|---|---|---|
| `VITE_AUTH_URL` | `http://localhost:3000` | auth-service |
| `VITE_MS01_URL` | `http://localhost:3001` | MS-01 Alunos |
| `VITE_MS02_URL` | `http://localhost:3002` | MS-02 Professores |
| `VITE_MS03_URL` | `http://localhost:3003` | MS-03 Turmas |
| `VITE_MS04_URL` | `http://localhost:3004` | MS-04 Notas |
| `VITE_MS05_URL` | `http://localhost:3005` | MS-05 Comunicação |

Crie um arquivo `.env` na raiz de `frontend/` para customizar:

```env
VITE_AUTH_URL=http://localhost:3000
VITE_MS01_URL=http://localhost:3001
VITE_MS02_URL=http://localhost:3002
VITE_MS03_URL=http://localhost:3003
VITE_MS04_URL=http://localhost:3004
VITE_MS05_URL=http://localhost:3005
```

---

## Como Rodar

```bash
cd frontend
npm install
npm run dev      # dev server com HMR em http://localhost:5173
npm run build    # build de produção → dist/
npm run preview  # preview do build de produção
```

---

## Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `react` | 18 | Framework |
| `react-dom` | 18 | Renderização DOM |
| `react-router-dom` | v7 | Roteamento |
| `@tanstack/react-query` | v5 | Cache e fetch de dados |
| `zustand` | — | Estado global |
| `axios` | — | Cliente HTTP |
| `react-hot-toast` | — | Toasts de feedback |
| `tailwindcss` *(dev)* | 3 | CSS utility-first |
| `typescript` *(dev)* | 5 | Tipagem estrita |
| `vite` *(dev)* | 8 | Bundler |
| `@types/react` *(dev)* | — | Tipos React |
| `@types/node` *(dev)* | — | Tipos Node.js |
