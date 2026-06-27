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
│   │       ├── Pagination.tsx     ← Paginação "Exibindo X–Y de Z"
│   │       ├── Field.tsx          ← Par label + valor para telas de detalhe
│   │       ├── GradeBadge.tsx     ← Badge colorido por faixa (≥7 verde, ≥5 amarelo, <5 vermelho)
│   │       ├── StatusBadge.tsx    ← Badge de status do aluno
│   │       └── TabNav.tsx         ← Navegação por abas
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
│   │   ├── httpClient.ts          ← Factory de Axios + injeção de JWT + refresh 401
│   │   ├── authService.ts         ← login, refresh, validate
│   │   ├── studentsService.ts     ← /v1/students, frequência, histórico
│   │   ├── teachersService.ts     ← /v1/teachers, grade, substituições
│   │   ├── classesService.ts      ← /v1/classes, alocações
│   │   ├── disciplinesService.ts  ← /v1/disciplines
│   │   ├── calendarService.ts     ← /v1/calendar/events
│   │   ├── assessmentsService.ts  ← /v1/assessments
│   │   ├── gradesService.ts       ← /v1/grades, boletim, prova final, config
│   │   ├── communicationsService.ts ← /v1/communications, preferências
│   │   └── api.ts                 ← Barrel re-export (mantém imports `from '../services/api'` válidos)
│   ├── utils/
│   │   └── formatters.ts          ← formatDate, formatGrade, getInitials (helpers compartilhados)
│   ├── store/
│   │   └── authStore.ts           ← Zustand: tokens, user, login, logout
│   │                                 (com onRehydrateStorage que re-decodifica o JWT
│   │                                  no boot — evita logout falso ao recarregar a página)
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
| `.avatar-sm` / `.avatar-md` / `.avatar-lg` + `.avatar-primary` / `-secondary` / etc. | Avatar circular com iniciais e variantes de cor |
| `.skeleton-row` / `.skeleton-card` / `.skeleton-block` | Placeholders de loading |
| `.icon-btn` / `.icon-btn-danger` | Botões de ícone (ações em linha de tabela) |
| `.search-wrap` / `.search-icon` / `.search-input` | Campo de busca com ícone embutido |
| `.section-title` | Título de seção dentro de uma página |
| `.form-grid-2` / `.form-actions` | Grid de 2 colunas e barra de ações de formulário |
| `.detail-header` / `.detail-header-inner` / `.detail-header-info` | Cabeçalho de telas de detalhe |
| `.step-number` | Numerador de passos (wizards) |
| `.comm-list` / `.comm-item` / `.comm-unread-dot` / `.comm-spacer-dot` | Lista de comunicados |
| `.tab-nav` / `.tab-nav-inner` / `.tab-nav-item` | Estilos do componente `TabNav` |

---

## Autenticação e Roteamento

### Guard `RequireAuth`

Todo o layout autenticado (`/dashboard`, `/students`, etc.) é protegido por um guard em `router.tsx`. Se não houver `accessToken` no store, redireciona para `/login`.

### Renovação automática de token

O interceptor de resposta do Axios fica em `src/services/httpClient.ts` (uma factory usada por todos os clients dos MSs). Ele detecta erro `401`, usa o `refreshToken` para obter um novo `accessToken` via `POST /v1/auth/refresh` e repete a requisição original automaticamente. Se o refresh falhar, faz logout e redireciona para `/login`.

### Persistência da sessão entre recargas

O `authStore` usa o middleware `persist` do Zustand para salvar os tokens no `localStorage`, e tem um callback `onRehydrateStorage` que volta a decodificar o JWT no carregamento da página — isso reidrata `user` e `isAuthenticated` a partir do token persistido, evitando que o usuário seja redirecionado para `/login` ao apertar F5.

### Navegação por role

A sidebar em `Sidebar.tsx` renderiza menus diferentes conforme `useAuthStore().user.role`:

| Role | Acesso |
|---|---|
| `ADMIN` | Todas as seções |
| `PROFESSOR` | Dashboard, Frequência, Avaliações, Notas, Comunicados |
| `ALUNO` | Dashboard, Boletim, Frequência, Comunicados |

Dentro das próprias páginas há um segundo nível de *gating* visual aplicado em cima do menu:

- `DisciplineList`, `ClassList`, `ClassDetail`, `SettingsPage`, `TeacherDetail` escondem os botões/ações administrativas (`Nova Disciplina`, `Nova Turma`, `Alocar Aluno`, `Alterar` configuração, `Editar Professor`, `Adicionar Horário`) para quem não é ADMIN.
- `AssessmentList` exibe `Nova Avaliação` para ADMIN e PROFESSOR, escondendo do ALUNO.
- `TeacherDetail` ainda evita disparar as queries de lookup (turmas e disciplinas) para perfis não-ADMIN.
- IDs (UUID) deixaram de aparecer na UI em ~15 locais: turmas, disciplinas e alunos agora são exibidos pelo nome, resolvido por queries de lookup do TanStack Query.

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

Os clients Axios — um por microsserviço — são criados em `src/services/httpClient.ts` através da factory `createClient(baseURL)`, que já aplica injeção de `Authorization: Bearer ...` e o interceptor de refresh em 401. Cada domínio (alunos, professores, turmas, disciplinas, calendário, avaliações, notas, comunicados) tem seu próprio arquivo `*Service.ts`, e `src/services/api.ts` reexporta tudo num único barrel para que imports antigos (`from '../../services/api'`) continuem funcionando. As URLs são configuráveis via variáveis de ambiente:

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
