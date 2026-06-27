# Guia de Estudo — Projeto Integrador V

> **Para quem é este documento.** Você e seus colegas vão apresentar este projeto e precisam responder qualquer pergunta técnica com **entendimento**, não com decoreba. Este guia foi escrito para construir essa fundação. Ele explica *o que* foi feito, *como* foi feito e — principalmente — **por que** foi feito assim. Quando entender o porquê, qualquer variação da pergunta na hora da apresentação cai por gravidade.

> **Como usar.** Leia uma vez do começo ao fim para ter o modelo mental completo. Depois volte aos capítulos do seu interesse para aprofundar. Cada capítulo é independente o bastante para ser revisado em ~10 min.

> **Diferença para o `GUIA_TECNICO_COMPLETO.md`.** Esse outro guia é **referência**: descreve o que existe. Este aqui é **didático**: explica por que existe e como pensar sobre isso.

---

## Sumário

**Parte I — Construindo intuição**
- [1. Visão de avião — o que estamos construindo](#1-visão-de-avião--o-que-estamos-construindo)
- [2. Os 4 atores do sistema e suas necessidades reais](#2-os-4-atores-do-sistema-e-suas-necessidades-reais)
- [3. Por que microsserviços e não um monolito?](#3-por-que-microsserviços-e-não-um-monolito)
- [4. O modelo mental: como pensar no sistema](#4-o-modelo-mental-como-pensar-no-sistema)

**Parte II — Stack, tecnologia por tecnologia**
- [5. Backend: Node.js + Fastify + TypeScript](#5-backend-nodejs--fastify--typescript)
- [6. ORM e banco: Prisma + MySQL](#6-orm-e-banco-prisma--mysql)
- [7. Frontend: React + Vite + Tailwind](#7-frontend-react--vite--tailwind)
- [8. Estado: Zustand + React Query](#8-estado-zustand--react-query)
- [9. Autenticação: JWT + bcrypt](#9-autenticação-jwt--bcrypt)
- [10. Containerização: Docker + Compose + nginx](#10-containerização-docker--compose--nginx)

**Parte III — Arquitetura**
- [11. Boundaries: como dividimos os serviços e por quê](#11-boundaries-como-dividimos-os-serviços-e-por-quê)
- [12. Como os serviços conversam entre si](#12-como-os-serviços-conversam-entre-si)
- [13. Banco compartilhado: a decisão polêmica e suas consequências](#13-banco-compartilhado-a-decisão-polêmica-e-suas-consequências)
- [14. Outbox Pattern em detalhe](#14-outbox-pattern-em-detalhe)
- [15. RBAC e autorização](#15-rbac-e-autorização)

**Parte IV — Padrões e princípios aplicados**
- [16. SOLID com exemplos do nosso código](#16-solid-com-exemplos-do-nosso-código)
- [17. Clean Code aplicado](#17-clean-code-aplicado)
- [18. Outros padrões: Service Layer, DTOs, Barrel Files](#18-outros-padrões-service-layer-dtos-barrel-files)

**Parte V — Cada microsserviço por dentro**
- [19. Auth Service](#19-auth-service)
- [20. MS-01 Gestão de Alunos](#20-ms-01-gestão-de-alunos)
- [21. MS-02 Gestão de Professores e Grade](#21-ms-02-gestão-de-professores-e-grade)
- [22. MS-03 Turmas, Disciplinas e Calendário](#22-ms-03-turmas-disciplinas-e-calendário)
- [23. MS-04 Avaliações e Notas](#23-ms-04-avaliações-e-notas)
- [24. MS-05 Comunicação Escolar](#24-ms-05-comunicação-escolar)

**Parte VI — Frontend**
- [25. Estrutura de pastas e por quê](#25-estrutura-de-pastas-e-por-quê)
- [26. Padrão de Services e o split do api.ts](#26-padrão-de-services-e-o-split-do-apits)
- [27. Componentes UI compartilhados](#27-componentes-ui-compartilhados)
- [28. State global vs server state](#28-state-global-vs-server-state)
- [29. Roteamento e guards por role](#29-roteamento-e-guards-por-role)
- [30. Persistência da sessão e o bug do refresh](#30-persistência-da-sessão-e-o-bug-do-refresh)

**Parte VII — Fluxos de ponta a ponta**
- [31. Fluxo de login](#31-fluxo-de-login)
- [32. Fluxo de lançamento de nota (e o recálculo de média)](#32-fluxo-de-lançamento-de-nota-e-o-recálculo-de-média)
- [33. Fluxo de alteração de grade e o comunicado automático](#33-fluxo-de-alteração-de-grade-e-o-comunicado-automático)
- [34. Fluxo de prova final](#34-fluxo-de-prova-final)
- [35. Fluxo de chamada (frequência) e a brecha de auth que corrigimos](#35-fluxo-de-chamada-frequência-e-a-brecha-de-auth-que-corrigimos)

**Parte VIII — Trade-offs honestos**
- [36. O que decidimos sabendo do trade-off](#36-o-que-decidimos-sabendo-do-trade-off)
- [37. O que faríamos diferente hoje](#37-o-que-faríamos-diferente-hoje)
- [38. O que precisaria para escalar](#38-o-que-precisaria-para-escalar)

**Parte IX — Preparando-se para a apresentação**
- [39. Como pensar sobre qualquer pergunta técnica](#39-como-pensar-sobre-qualquer-pergunta-técnica)
- [40. Perguntas que provavelmente vão cair](#40-perguntas-que-provavelmente-vão-cair)
- [41. Armadilhas e erros comuns ao apresentar](#41-armadilhas-e-erros-comuns-ao-apresentar)

**Parte X — Referência rápida**
- [42. Glossário técnico](#42-glossário-técnico)
- [43. Mapa de portas, URLs e endpoints](#43-mapa-de-portas-urls-e-endpoints)
- [44. Comandos úteis](#44-comandos-úteis)

---

# Parte I — Construindo intuição

## 1. Visão de avião — o que estamos construindo

Imagine uma escola de médio porte. Ela tem cinco ou seis grupos de pessoas que precisam de tipos muito diferentes de informação:

- A **secretaria** precisa cadastrar alunos, ver quem está ativo/inativo, gerar relatórios.
- A **coordenação** precisa montar turmas, decidir quais professores dão quais disciplinas, gerenciar o calendário do ano letivo.
- Os **professores** precisam fazer chamada, lançar notas, ver sua grade da semana, mandar avisos.
- Os **alunos e responsáveis** precisam ver boletim, frequência, comunicados, calendário de provas.
- O **administrador do sistema** precisa configurar regras (média mínima de aprovação, p.ex.) e ter visão geral.

Hoje, tipicamente, isso é feito com planilhas Excel espalhadas, WhatsApp, papel, e um sistema desktop antigo que ninguém quer mexer. O resultado: informação duplicada, atualizações que se perdem, professores que não sabem se o aluno trancou, alunos que descobrem o boletim só no final do bimestre.

**O que construímos.** Um sistema web que centraliza tudo isso, com cada grupo de pessoas vendo só o que importa pra ele, e em que mudanças se propagam automaticamente — por exemplo, quando o coordenador altera um horário de aula, os alunos daquela turma recebem um comunicado automático.

**A escolha de não construir um monolito.** Em vez de um único sistema gigante, decompomos o domínio em **seis serviços independentes**, cada um responsável por uma parte:

```
auth-service  → quem é você (login, JWT)
MS-01 Alunos  → cadastro de alunos, frequência, histórico
MS-02 Profs   → cadastro de professores, grade horária, substituições
MS-03 Turmas  → turmas, disciplinas, calendário escolar
MS-04 Notas   → avaliações, notas, médias, configuração de aprovação
MS-05 Comms   → comunicados e notificações
```

Mais o **frontend React** que consome tudo. E por trás, **um único banco MySQL** compartilhado entre eles (vamos discutir essa decisão polêmica no Cap. 13).

O motivo dessa divisão e dos trade-offs ficam claros nos próximos capítulos.

---

## 2. Os 4 atores do sistema e suas necessidades reais

Toda decisão técnica boa parte de *quem usa o sistema*. Os quatro **roles** que existem nele:

### ADMIN — o operador do sistema
Vê e faz tudo. É secretaria + coordenação + suporte técnico. Acessa o dashboard com contagens, cadastra alunos, cria turmas, gerencia disciplinas, monta a grade dos professores, envia comunicados, configura regras (ex.: média mínima de aprovação).

**Pergunta-chave que ele faz:** "Tudo está funcionando? Tem aluno sem turma? Tem turma sem grade?"

### PROFESSOR — o operador acadêmico
Vê o que diz respeito a ele. Sua grade da semana, suas turmas, lança notas e frequência, vê os comunicados gerais e os destinados a professores.

**O que ele não pode fazer:** cadastrar alunos, editar turmas, mudar a média mínima, criar comunicados.

**Pergunta-chave:** "Quais aulas tenho hoje, e o que preciso lançar?"

### ALUNO — o consumidor de informação
Vê seu próprio boletim, sua frequência, seus comunicados, sua turma.

**O que ele não pode fazer:** nada de escrita. É só leitura sobre si mesmo. Não pode ver dados de outros alunos, nem da turma toda.

**Pergunta-chave:** "Como estou indo nas matérias e o que vai cair na próxima prova?"

### O sistema em si (workers automáticos) — não é um usuário, mas age
O MS-05 tem um **worker** que roda em background a cada 30 segundos, perguntando ao MS-02: "teve mudança de grade?". Se teve, ele automaticamente cria comunicados para os alunos afetados. Isso é importante: nem todo "ator" é humano. Esse worker é um ator do sistema, mesmo sem login.

**Por que esses 4 papéis e não mais ou menos?** Porque essa é a granularidade real do domínio escolar. Adicionar um papel "COORDENADOR" separado de ADMIN seria over-engineering pro escopo. Combinar PROFESSOR e ALUNO num único "usuário" quebraria as regras de autorização (professor pode ver vários alunos; aluno só ele mesmo).

---

## 3. Por que microsserviços e não um monolito?

Essa é a pergunta mais importante e mais provável de cair. A resposta honesta tem dois lados.

### O lado pragmático (acadêmico): porque o projeto pediu

A disciplina exige arquitetura de microsserviços. Não construir um monolito é requisito. **Reconhecer isso na apresentação é honesto e mostra maturidade** — você sabe que microsserviços não é a resposta certa pra todo problema.

### O lado técnico: quando microsserviços fazem sentido

Microsserviços trazem benefícios reais quando:

1. **Equipes diferentes podem trabalhar em paralelo sem pisar no pé umas das outras.** No nosso caso, cada um do grupo pôde pegar um MS e trabalhar independente. Em monolito, um conflito de merge no `main` poderia parar todo mundo.

2. **Cada parte do sistema escala diferente.** Se 10.000 alunos abrem o boletim no dia da divulgação das notas, só o MS-04 sofre. Num monolito você teria que escalar a aplicação inteira. Em microsserviços, só replica o MS-04.

3. **Tecnologias diferentes para problemas diferentes.** Hoje todos os MSs usam Node+Fastify+Prisma+MySQL, então não estamos aproveitando essa flexibilidade. Mas a porta está aberta: amanhã o MS-04 (cálculos de média) poderia migrar para Python (NumPy) ou Go (performance) sem afetar nada.

4. **Falhas isoladas.** Se o MS-05 (comunicação) cai, ninguém deixa de ver boletim. Em monolito, um bug crítico derruba tudo.

### O lado dos custos: o que estamos pagando

Microsserviços não é grátis. Estamos pagando:

1. **Complexidade operacional.** Em vez de subir 1 processo, sobem 7 (6 serviços + nginx). Por isso usamos Docker Compose — sem ele, era inviável.

2. **Consistência eventual.** Quando você lança uma nota no MS-04, o MS-05 não fica sabendo na mesma transação. Ele descobre via polling (30s depois, no pior caso).

3. **Chamadas em rede em vez de chamadas de função.** O MS-05 precisa dos alunos da turma? Faz `fetch(http://ms03/v1/classes/:id)`. Em monolito, era `prisma.turma.findUnique(...)`. Rede é mais lenta, falha mais, é mais difícil de debugar.

4. **Duplicação de código.** Cada MS tem seu `authenticate.ts`, seu `prisma.ts`, sua configuração de Fastify. Em monolito, era uma vez só.

### A regra de bolso da indústria

> "Comece com um monolito. Quebre em microsserviços quando a dor do monolito ficar maior que a dor dos microsserviços."

— Martin Fowler, parafraseado.

Para uma escola pequena/média real, um monolito bem feito seria mais barato e funcionaria igual. Mas dado o requisito acadêmico e o aprendizado que essa arquitetura proporciona, **a escolha foi acertada para o contexto.**

---

## 4. O modelo mental: como pensar no sistema

Antes de mergulhar nos detalhes, segure este desenho na cabeça:

```
                          ┌─────────────┐
                          │  Frontend   │  React SPA (porta 80, nginx)
                          │  (browser)  │
                          └──────┬──────┘
                                 │ HTTP/HTTPS (JSON)
                                 │ Authorization: Bearer <accessToken>
            ┌────────────────────┼────────────────────┐
            │                    │                    │
        ┌───▼───┐            ┌───▼───┐            ┌───▼───┐
        │ auth  │            │  MS-01 │           │  MS-02 │  ...
        │ :3000 │            │ :3001  │           │ :3002  │
        └───┬───┘            └───┬───┘            └───┬───┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │   MySQL     │  Banco compartilhado
                          │  raphaela.. │  (todos os MSs leem/escrevem)
                          └─────────────┘
```

Três coisas a internalizar:

**1. Os serviços conversam por HTTP, não por chamadas internas.** O MS-05 chamar o MS-02 é igualzinho ao navegador chamar — uma requisição HTTP cruzando uma "rede" (no caso, a rede interna do Docker).

**2. O frontend tem JWT no peito.** Toda chamada do navegador para qualquer MS leva um header `Authorization: Bearer <token>`. Cada MS valida esse token sozinho — ele não pergunta ao auth-service "esse token é válido?". A validação é local porque o JWT é auto-contido (vide Cap. 9).

**3. Cada MS tem seu próprio Fastify, seu próprio Prisma Client, sua própria porta, seu próprio Dockerfile.** São processos independentes. O que eles compartilham é só o banco MySQL e a chave secreta do JWT (`JWT_SECRET` no `.env` de cada um).

Pronto. Com isso na cabeça, o resto é detalhe.

---

# Parte II — Stack, tecnologia por tecnologia

## 5. Backend: Node.js + Fastify + TypeScript

### Node.js — runtime JavaScript no servidor

**O que é.** Um runtime para executar JavaScript fora do navegador, criado por Ryan Dahl em 2009. Usa o motor V8 do Chrome.

**Por que escolhemos.**
- A equipe já tinha conhecimento de JavaScript.
- Mesma linguagem no front e no back (com TypeScript em ambos) reduz contexto mental.
- Ecossistema npm gigantesco — qualquer biblioteca que precisamos, existe.
- Modelo de I/O assíncrono não-bloqueante, ideal para APIs REST que ficam esperando o banco responder.

**Quando seria errado.**
- Se o sistema fizesse cálculos pesados de CPU (renderização de vídeo, ML). Node tem uma única thread principal — operações CPU-bound a bloqueiam.
- Para nosso domínio (CRUD com lógica de negócio leve), é ideal.

**Versão usada.** Node 22 (LTS recente). Definida no Dockerfile (`node:22-alpine`).

### Fastify — framework HTTP

**O que é.** Um framework web para Node, alternativa ao Express. Foco em performance e ergonomia.

**Por que escolhemos em vez do Express.**
- **Schema-first.** A gente declara o JSON Schema do body, o Fastify valida automaticamente e ainda gera tipos. Menos código de validação manual. Exemplo do `auth.ts`:
  ```ts
  fastify.post<{ Body: LoginBody }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => { ... })
  ```
- **Plugin system.** A gente define `fastify.authenticate` como decorator e usa em qualquer rota. JWT, Prisma, CORS são plugins separados que se encaixam.
- **Performance.** Fastify é ~2x mais rápido que Express em benchmarks. Não que precisemos disso aqui, mas é um nice-to-have.

**Quando Express ainda venceria.** Se a base de código já existia em Express, ou se a equipe tivesse muito mais familiaridade com Express. Nada técnico forte que justifique migrar um sistema legado.

### TypeScript — JavaScript tipado

**O que é.** Um superset do JavaScript que adiciona tipos estáticos. Compila para JS comum.

**Por que escolhemos.**
- **Refactor seguro.** Renomear uma função, mudar uma interface — o compilador grita em todo lugar que precisa atualizar. Em JS puro, você só descobre rodando.
- **Autocomplete real.** O IDE sabe que `request.user.role` existe e que pode ser `'ADMIN' | 'PROFESSOR' | 'ALUNO'`.
- **Documentação viva.** A assinatura de uma função já diz o que ela espera e retorna, sem precisar comentário.

**O que pagamos.** Tempo de build extra (`tsc`), um pouco de boilerplate de tipos. Vale muito a pena pra qualquer projeto além do trivial.

**Configuração.** Cada MS tem seu `tsconfig.json` próprio. O build (`npm run build` no Docker) gera JS na pasta `dist/`. Em desenvolvimento, usamos `ts-node` ou `tsx` pra rodar direto.

---

## 6. ORM e banco: Prisma + MySQL

### MySQL — o banco relacional

**Por que um banco relacional.** O domínio escolar é **altamente relacional**: aluno tem turma, turma tem disciplinas, disciplinas têm avaliações, avaliações têm notas. Tudo é JOIN. Bancos relacionais são imbatíveis nisso.

**Por que MySQL especificamente.**
- Ecossistema maduro.
- Compatibilidade com hospedagens populares.
- Performance suficiente para o escopo.

**Quando MongoDB venceria.** Se os dados fossem semi-estruturados, com schemas variando por documento (logs, eventos). Não é o caso.

**Quando PostgreSQL venceria.** PostgreSQL tem features mais avançadas (JSON nativo robusto, full-text search melhor, tipos customizados). Para nosso uso, MySQL e PostgreSQL são equivalentes na prática.

### Prisma — o ORM

**O que é um ORM.** Object-Relational Mapper. Uma camada que te deixa escrever queries em código (`prisma.aluno.findMany(...)`) em vez de SQL puro (`SELECT * FROM aluno`).

**Por que Prisma especificamente.**
- **Schema declarativo.** O `schema.prisma` descreve as tabelas em uma linguagem própria, e ele gera o cliente tipado. Compare com TypeORM (decorators em classes, verboso) ou Sequelize (configuração imperativa, menos tipado).
- **Tipos perfeitos.** `await prisma.aluno.findUnique({ where: { id } })` retorna `Aluno | null` com todos os campos tipados.
- **Migrations.** `prisma migrate` versiona mudanças de schema. (No nosso projeto, usamos `db pull` porque o schema já existia, mas a feature está lá.)
- **Studio.** Uma GUI web para inspecionar dados (`npx prisma studio`).

**Pegadinhas que tivemos.**

1. **Decimal vira string.** Campos `@db.Decimal` do MySQL viram `string` no Prisma (por segurança numérica — `Number` perde precisão acima de 2^53). Resultado: você tem que envolver com `Number(...)` antes de usar:
   ```ts
   const soma = notas.reduce((acc, n) => acc + Number(n.valor), 0)
   ```
   Esquecer disso gera o erro famoso `e.valor.toFixed is not a function`. A gente apanhou desse no início.

2. **Datas precisam ser `Date`, não string.** `new Date(request.body.data_nascimento)` antes de passar pro Prisma. Senão o MySQL reclama.

3. **Cada MS tem seu próprio `PrismaClient`.** Não compartilhamos uma instância entre serviços — cada MS tem seu próprio package, seu próprio `schema.prisma`, sua própria pasta `node_modules/.prisma/client` gerada. Isso é importante: significa que cada MS "vê" apenas as tabelas que ele importa no schema.

### Por que a gente compartilha o banco (mas cada MS só "vê" o que precisa)

Cada `schema.prisma` lista apenas as tabelas relevantes para aquele MS. Mesmo que o banco tenha 30 tabelas, o `schema.prisma` do MS-01 lista talvez 5. O Prisma Client gerado só conhece essas 5.

Isso é **disciplina técnica** — nada no banco impede o MS-01 de mexer na tabela de notas. Mas o código não tem como fazer isso, porque `prisma.nota` não existe no cliente dele.

É um meio-termo entre "database per service" (a forma "correta" segundo a literatura) e "monolito de dados". Mais sobre isso no Cap. 13.

---

## 7. Frontend: React + Vite + Tailwind

### React — biblioteca de UI

**O que é.** Uma biblioteca JavaScript para construir interfaces declarativas baseadas em componentes.

**Por que escolhemos.**
- **Componentes.** A UI é decomposta em peças reutilizáveis (`<Button>`, `<Field>`, `<Modal>`). Compare com jQuery, onde você manipula o DOM imperativamente e a complexidade explode.
- **Declarativo.** Você descreve *como a UI deve parecer dado o estado*, não *o que mudar quando o estado muda*. O React calcula o diff.
- **Ecossistema.** Bibliotecas para tudo (roteamento, forms, data fetching).
- **Conhecimento da equipe.** Já tínhamos base de React.

**Por que não Vue ou Angular.** Vue seria igualmente válido, talvez até mais simples para iniciantes. Angular seria over-engineering para o escopo (vem com tudo embutido, mas é mais opinativo e verboso). React foi escolha de familiaridade.

### Vite — build tool

**O que é.** Um bundler/dev server moderno, alternativa ao Webpack/Create React App.

**Por que escolhemos.**
- **Dev server instantâneo.** `npm run dev` sobe em <1s. Hot Module Replacement (HMR) é muito mais rápido.
- **Build pequeno.** Saída otimizada, code splitting automático.
- **Sem configuração.** Funciona out-of-the-box pra React+TS+Tailwind.

**Compare com Create React App (CRA).** CRA está deprecated (Meta abandonou). Vite é o sucessor *de facto* da comunidade.

### Tailwind CSS — utility-first CSS

**O que é.** Em vez de escrever CSS separado (`.button { padding: 8px; ... }`), você usa classes utilitárias no HTML (`<button className="px-4 py-2 ...">`).

**Por que escolhemos.**
- **Velocidade.** Você prototipa rápido, sem ficar pulando entre arquivo HTML e CSS.
- **Sem nomes de classe inventados.** O dilema "como vou chamar essa div?" some.
- **Bundle pequeno.** Só vai pro CSS final o que você realmente usou (purge).

**O contraponto.** O HTML/JSX fica longo. Se você não disciplinar, vira sopa de classes.

**Como organizamos no projeto.** Para combater a sopa, criamos um sistema de **classes semânticas em `index.css`** sob `@layer components`:

```css
.btn-primary { @apply inline-flex items-center px-4 py-2.5 ... }
.card { @apply bg-surface-container-lowest rounded-xl ... }
.badge-success { @apply bg-success/10 text-success ... }
.avatar-lg { @apply rounded-full flex items-center justify-center w-14 h-14 }
```

Aí no JSX usamos `<button className="btn-primary">` em vez de repetir 10 classes. O melhor dos dois mundos: utility-first quando é único, classe semântica quando se repete.

**Refator recente.** Identificamos uns 25 padrões repetidos (`.search-wrap`, `.icon-btn`, `.skeleton-row`, `.detail-header`, etc.) e movemos para classes semânticas em ~15 páginas. O JSX ficou muito mais limpo.

---

## 8. Estado: Zustand + React Query

Esse é um ponto que confunde muita gente: por que **dois** gerenciadores de estado?

A resposta é que existem **dois tipos diferentes de estado**, e cada biblioteca é boa em um:

### React Query — server state (dados do servidor)

**O problema que resolve.** Tudo o que vem de uma API tem características especiais: pode ficar stale, precisa ser refetchado, precisa de cache, precisa lidar com loading/error. Fazer isso manualmente é doloroso.

**O que o React Query oferece:**
- **Cache automático.** Duas páginas que pedem `students.list()` compartilham o resultado.
- **Refetch em foco.** Quando o usuário volta pra aba, ele revalida.
- **Invalidação cirúrgica.** Após criar um aluno, você invalida `['students', 'list']` e só essa query é refetchada.
- **Loading/error states grátis.** `isLoading`, `isError`, `data` — vem prontos.

**Exemplo no nosso código:**
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['students', { search, status, page, limit }],
  queryFn: () => studentsService.list({ ... }).then((r) => r.data),
})
```

Quando os filtros (`search`, `status`, etc.) mudam, a queryKey muda, e ele refaz a query.

### Zustand — client state (estado local persistente da aplicação)

**O problema que resolve.** Dados que vivem só no client, mas precisam estar disponíveis em qualquer componente: usuário logado, preferências de tema, sidebar aberta/fechada.

**Por que Zustand e não Redux.**
- Muito menos boilerplate. Redux exige actions, reducers, dispatchers. Zustand é só `set` e `get`.
- Sem providers tomando conta da árvore.
- TypeScript-friendly por padrão.

**O que guardamos no Zustand.** Só uma coisa: o estado de autenticação.
```ts
{
  accessToken: string | null,
  refreshToken: string | null,
  user: JWTPayload | null,  // parseado do JWT
  isAuthenticated: boolean,
}
```

**Persistência.** A gente usa o middleware `persist` do Zustand pra serializar tokens no `localStorage`. Assim, se o usuário fecha o navegador e volta, ainda está logado.

### A divisão fica clara:
- "Quem é o usuário?" → Zustand (precisa persistir, vive no client)
- "Qual a lista de alunos?" → React Query (vem do servidor, precisa de cache)

Confundir os dois leva a problemas: se você guarda lista de alunos no Zustand, perde os benefícios do React Query (cache, refetch, invalidação). Se guarda o usuário logado no React Query, ele expira do cache na hora errada.

---

## 9. Autenticação: JWT + bcrypt

Esse capítulo merece atenção — provavelmente vai cair alguma pergunta sobre.

### Senha: bcrypt

Quando um usuário cadastra senha, **nunca** salvamos a senha em texto puro no banco. Salvamos o **hash bcrypt** dela.

**O que é hash.** Uma função que pega uma entrada qualquer e gera uma string de tamanho fixo, **de forma irreversível**. Você não consegue voltar do hash pra senha.

```
"senha123" → bcrypt → "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

**Por que bcrypt e não SHA-256 puro.** SHA-256 é rápido — uma GPU faz bilhões/s. Atacante com um hash de senha vazado faz brute-force fácil. **Bcrypt é deliberadamente lento** (cost factor 10 = ~100ms por hash). Isso torna brute-force inviável.

**No login, como verificamos.** A gente pega a senha enviada, gera o hash dela com o mesmo salt do hash armazenado, e compara. O `bcrypt.compare()` faz isso.

### Sessão: JWT

Depois do login certo, a gente devolve dois tokens. **Por que dois?** Próximo tópico.

**O que é JWT.** JSON Web Token. Uma string formada por três partes separadas por ponto:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MTIzIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxN30.QbtVK...
└─ header ──────────────────────────┘└─ payload ───────────────────────────────────┘└─ signature
```

- **Header**: tipo do token e algoritmo (HS256).
- **Payload**: os dados (o "claim set"). No nosso caso: `{ sub, role, referenciaId, turmaId, exp, iat }`.
- **Signature**: HMAC do header+payload usando o `JWT_SECRET`. Garante que ninguém alterou o payload.

**Por que JWT em vez de session cookies tradicionais.**
- **Stateless.** O servidor não precisa armazenar sessões. Cada MS valida o token sozinho, sem hit no banco/Redis.
- **Multi-serviço.** Os 6 MSs validam o mesmo token. Não precisam compartilhar storage de sessão.
- **Self-contained.** O token já carrega o `role` — não precisa consultar o auth-service em toda request pra descobrir.

**O preço.**
- **Não dá pra invalidar.** Se você quer deslogar um usuário antes do `exp`, não tem como. O token vai funcionar até expirar. Soluções: blacklist (volta a ter estado), tokens curtos (15 min é nosso caso).
- **Tamanho.** JWT é bem maior que um sessionId. Vai em cada request — mais bytes na rede.

### Por que dois tokens (access + refresh)

**Access token** (15 minutos). Curto, usado em todas as chamadas a APIs. Se vaza, o estrago é limitado pelo tempo.

**Refresh token** (7 dias). Longo. Usado **só** para pedir um novo access token quando o antigo expira. Endpoint dedicado (`/v1/auth/refresh`).

**Por que essa separação.**
- Se o access vaza (logs, XSS), perde acesso em até 15 min.
- O refresh fica menos exposto (vai pra `/auth/refresh` só, e poderíamos guardar HttpOnly cookie pra mais segurança).
- Usuário não precisa logar de novo a cada 15 min — o axios faz refresh transparente.

**Como funciona o refresh transparente no frontend.** O Axios tem um *interceptor de resposta*:
```ts
// httpClient.ts (frontend)
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { data } = await axios.post(`${SERVICES.auth}/v1/auth/refresh`, { refreshToken })
      useAuthStore.getState().setAccessToken(data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return client(original)  // reenvia a request original com o novo token
    }
    ...
  }
)
```

A request original é reenviada com o token novo. O usuário não nota nada.

### Como cada MS valida o token

Quando uma request chega num MS protegido:

1. O Fastify recebe.
2. O `preHandler: fastify.authenticate` roda primeiro.
3. Esse decorator chama `request.jwtVerify()`, que:
   - Lê o header `Authorization`.
   - Valida a assinatura usando o `JWT_SECRET` (que está no `.env` de cada MS).
   - Decodifica o payload e coloca em `request.user`.
4. Se inválido/expirado: 401 automático.
5. Se há `requireRole(['ADMIN'])`, verifica se `request.user.role` está na lista. Se não: 403.
6. Só então o handler da rota roda.

**O `JWT_SECRET` precisa ser o mesmo em todos os MSs.** Senão, MS-02 não consegue validar tokens criados pelo auth-service. Por isso ele está no `.env` de todos.

---

## 10. Containerização: Docker + Compose + nginx

### Docker — empacotamento de aplicações

**O problema que Docker resolve.** "Mas na minha máquina funciona." Diferentes versões de Node, dependências de sistema, configurações — tudo isso quebra ao mover de uma máquina pra outra.

**A solução.** Você descreve **tudo** que sua aplicação precisa num `Dockerfile`: qual SO base, quais pacotes, qual versão de Node, como copiar o código, como rodar. O Docker constrói uma **imagem** — um "snapshot" auto-contido. A imagem roda igual em qualquer Docker, em qualquer SO.

**Multi-stage build (o que usamos).** Olha o Dockerfile do MS-01:

```dockerfile
# Stage 1: builder — instala TUDO, compila TypeScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install                      # devDependencies inclusas
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build                    # gera dist/

# Stage 2: runtime — só o necessário
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production         # SÓ runtime deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Por que multi-stage.** A imagem final não carrega o TypeScript compiler, nem `@types/*`, nem outras devDependencies. Fica menor (300 MB em vez de 600 MB) e tem menos superfície de ataque.

### Docker Compose — orquestração local

**O problema.** A gente tem 7 serviços. Subir cada um com `docker run` seria pesadelo — configurar portas, redes, env vars, dependências.

**A solução.** Um `docker-compose.yml` declara tudo:

```yaml
services:
  auth-service:
    build: ./auth-service
    ports: ["3000:3000"]
    env_file: ./auth-service/.env

  ms01-alunos:
    build: ./MS01_gestao_de_alunos
    ports: ["3001:3001"]
    env_file: ./MS01_gestao_de_alunos/.env
    depends_on: [auth-service]
  ...
```

Aí `docker-compose up --build` faz **tudo**: build de todas as imagens, cria uma rede interna, sobe os containers na ordem certa.

**Por que `depends_on`.** Não é estritamente necessário (cada MS valida JWT local, não precisa do auth pra subir). É documentação visual: "esse serviço lógicamente depende daquele".

### nginx — servidor do frontend

**Por que nginx pra servir o frontend.** O Vite build gera arquivos estáticos (HTML, CSS, JS) em `dist/`. Pra servir estáticos, você precisa de um servidor web. Nginx é a escolha clássica: leve, rápido, configuração simples.

**Configuração crítica: SPA routing.** O React Router gerencia rotas no lado do cliente (`/students`, `/grades`, etc.). Mas quando o usuário dá F5 em `/students`, o navegador pede `GET /students` ao nginx. Sem configuração, nginx retorna 404 — não existe arquivo `students` em `dist/`.

A correção:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Isso diz: "se o arquivo existe, serve. Se não, sirva o `index.html`". Aí o React Router carrega e resolve a rota corretamente.

A gente apanhou desse bug — fica em **toda** SPA. Saber explicar isso pega bem.

---

# Parte III — Arquitetura

## 11. Boundaries: como dividimos os serviços e por quê

A pergunta crítica: **como você decide o que vai em cada microsserviço?**

### O princípio: Bounded Context (DDD)

Da abordagem Domain-Driven Design (Eric Evans), a ideia é: divida pelo **modelo de domínio**, não pelo modelo técnico. Cada serviço deve ser "dono" de uma área conceitualmente coesa.

Nossa divisão:

| Serviço | Domínio | Tabelas próprias (no schema) |
|---|---|---|
| auth-service | "Quem é você" | `usuario` |
| MS-01 Alunos | "Vida do aluno" | `aluno`, `frequencia_consolidada`, `historico_escolar`, etc. |
| MS-02 Professores | "Vida do professor" | `professor`, `grade_horaria`, `substituicao_professor`, `evento_grade` |
| MS-03 Turmas | "Organização escolar" | `turma`, `disciplina`, `calendario_evento`, `alocacao_aluno` |
| MS-04 Notas | "Avaliação acadêmica" | `avaliacao`, `nota`, `media_bimestral`, `prova_final`, `configuracao_avaliacao` |
| MS-05 Comunicação | "Mensagens" | `comunicado`, `destinatario_comunicado`, `notificacao_externa`, `preferencia_usuario` |

### Como reconhecer um bom boundary

Um boundary é bom se:

1. **As mudanças tendem a ficar dentro dele.** Mudou a regra de aprovação? Só MS-04 muda. Mudou a forma como guardamos endereços? Só MS-01.
2. **As tabelas se relacionam fortemente entre si.** `nota` precisa de `avaliacao`, `media_bimestral` é calculada das `nota`s. Tudo MS-04.
3. **Pessoas diferentes "trabalham" em domínios diferentes.** Coordenação mexe em turmas/disciplinas (MS-03). Secretaria em alunos (MS-01). Não se atropelam.

### Sinais de boundary errado (smells)

- **Chamadas constantes entre dois MSs.** Se MS-A precisa do dado de MS-B 90% do tempo, talvez devessem ser o mesmo.
- **Mudança no MS-A obriga mudança no MS-B sempre junto.** Provavelmente o boundary está no lugar errado.
- **Um MS muito gordo e outros muito magros.** Pode indicar que o gordo deveria ser quebrado, ou um dos magros está sobrando.

### Onde nossos boundaries quase quebraram

**MS-05 precisa saber quais alunos estão em uma turma** para mandar comunicado. Mas alunos de turma é dado do MS-03. Solução: MS-05 faz **HTTP request** ao MS-03 (`fetch(http://ms03/v1/classes/:id)`).

Isso é normal e esperado em microsserviços. Vira problema quando vira a **maioria** das ações — aí o boundary estava errado.

---

## 12. Como os serviços conversam entre si

Existem três padrões clássicos de comunicação entre microsserviços. Usamos dois.

### Padrão 1: Síncrono (HTTP request/response) — usamos

Um serviço chama o outro via HTTP e espera resposta na hora.

**Exemplo no projeto.** Quando o MS-05 cria um comunicado para uma turma específica, ele precisa saber quais alunos estão nessa turma:

```ts
// MS-05/src/routes/comunicados.ts
async function resolveAlunosDaTurma(turmaId: string): Promise<string[]> {
  const ms03Url = process.env.MS03_URL ?? 'http://localhost:3003'
  const res = await fetch(`${ms03Url}/v1/classes/${turmaId}`)
  const turma = await res.json() as { alocacao_aluno?: { aluno_id: string }[] }
  return (turma.alocacao_aluno ?? []).map((a) => a.aluno_id)
}
```

**Vantagens.** Simples. Resultado imediato. Fácil de debugar.

**Desvantagens.** **Acoplamento temporal**: se MS-03 está fora do ar, MS-05 quebra. **Latência cumulativa**: se você precisa de 3 chamadas em série, a resposta soma os tempos.

### Padrão 2: Assíncrono via eventos (Outbox Pattern simplificado) — usamos

Um serviço **registra** que algo aconteceu (numa tabela ou fila). Outro serviço **lê** essas mensagens quando puder e age.

**Exemplo no projeto.** Quando um admin altera a grade do professor:

```ts
// MS-02/src/routes/grade.ts (POST /v1/teachers/:id/schedule)
await fastify.prisma.grade_horaria.create({ data: { ... } })
// Em seguida, registra o evento na mesma transação:
await fastify.prisma.evento_grade.create({
  data: {
    grade_horaria_id: grade.id,
    tipo: 'CRIACAO',
    descricao: `Grade criada: ${dia_semana} ${horario_inicio}-${horario_fim}`,
    processado: false
  }
})
```

A linha do evento entra na tabela `evento_grade` com `processado = false`. O MS-02 termina sua request, devolve 201 ao cliente, e segue a vida.

Do outro lado, o MS-05 tem um **worker** (background job) que roda a cada 30 segundos:

```ts
// MS-05/src/workers/gradeWorker.ts
async function pollGradeEvents(prisma) {
  const eventos = await fetch(`${ms02Url}/v1/teachers/schedule/changes/recent`)
  for (const evento of eventos) {
    if (processedEventIds.has(evento.id)) continue
    // 1. Cria um comunicado
    // 2. Busca alunos da turma (HTTP para MS-03)
    // 3. Cria registros de destinatário e notificação
    processedEventIds.add(evento.id)
  }
}
```

**Vantagens.**
- **Desacoplamento temporal.** Se MS-05 está fora, o evento fica na tabela. Quando voltar, processa.
- **Sem cascata de falhas.** O MS-02 não falha porque o MS-05 está caído.

**Desvantagens.**
- **Consistência eventual.** Pode levar até 30s pro comunicado aparecer.
- **Complexidade.** Mais código pra escrever (worker, tracking de processados, retries).

### Padrão 3: Mensageria com broker (RabbitMQ, Kafka) — NÃO usamos

O "real" Outbox Pattern usa um broker dedicado. Você publica um evento, o broker entrega aos interessados.

**Por que não usamos.** Adiciona uma peça de infra (RabbitMQ/Kafka) que precisa rodar. Pro escopo, polling de 30s é suficiente. Em produção real, valeria a pena.

### Quando usar cada um

| Característica | Síncrono | Assíncrono |
|---|---|---|
| Você precisa do resultado AGORA | ✅ | ❌ |
| O outro serviço pode estar fora? | ❌ | ✅ |
| Latência crítica | ❌ | ✅ |
| Simplicidade | ✅ | ❌ |

No projeto, MS-05 → MS-03 (buscar alunos) é síncrono porque ele precisa do dado pra criar destinatários. MS-02 → MS-05 (notificar alteração de grade) é assíncrono porque o aluno pode receber o comunicado 30s depois sem prejuízo.

---

## 13. Banco compartilhado: a decisão polêmica e suas consequências

Essa é A pergunta mais polêmica que pode cair na apresentação. Esteja pronto.

### O que a "literatura correta" prega

> **Database per service.** Cada microsserviço deve ter seu próprio banco. Outros serviços nunca acessam diretamente. Comunicação só por API.

A justificativa: se dois MSs compartilham banco, você acopla pelo schema. Mudar uma coluna no MS-A pode quebrar o MS-B. Aí você não tem microsserviços de verdade — tem um monolito em vários processos.

### O que a gente fez

Um banco MySQL único, compartilhado entre os 6 serviços. Mas com uma técnica para mitigar o acoplamento: **cada `schema.prisma` lista só as tabelas relevantes para aquele MS**.

```
auth-service/schema.prisma  → usuario, aluno (referência apenas)
MS01/schema.prisma          → aluno, frequencia_*, historico_escolar
MS02/schema.prisma          → professor, grade_horaria, ...
MS03/schema.prisma          → turma, disciplina, calendario_evento, alocacao_aluno
MS04/schema.prisma          → avaliacao, nota, media_bimestral, ...
MS05/schema.prisma          → comunicado, destinatario_comunicado, notificacao_externa, ...
```

O Prisma Client gerado **só conhece** as tabelas listadas. Resultado: o código do MS-04 não tem como (literalmente, falha de compilação) escrever na tabela `usuario` do MS-Auth.

### Por que escolhemos compartilhar

**Justificativa honesta:** simplicidade operacional. Subir 6 bancos MySQL diferentes em Docker, gerenciar conexões, lidar com transações distribuídas — seria muito código de infra pra escopo acadêmico.

**Trade-off consciente:** trocamos pureza arquitetural por viabilidade de prazo.

### As consequências reais

1. **Mudança de tabela é mais sensível.** Se o admin do banco dropa a coluna `nome_completo` da tabela `aluno`, todo MS que referencia (auth, MS-01, MS-05 via JOIN) quebra junto.

2. **Transações cross-service são possíveis (e perigosas).** Em teoria, o MS-04 poderia abrir uma transação que lê de `aluno` e escreve em `nota`. Na prática, evitamos isso — só fazemos via API.

3. **Migrations precisam coordenar.** Quem é dono de cada tabela? No nosso caso, definimos *implicitamente*: o MS que mais escreve nela é "dono" e responsável pelas migrations. Mas isso é convenção, não enforçado.

4. **Acoplamento operacional.** Se o banco cai, todos os MSs caem. Em database-per-service, dá pra ter resiliência parcial.

### Como defender essa decisão na apresentação

Se perguntarem "por que vocês não fizeram database-per-service?":

> "Sabemos que a abordagem canônica em microsserviços é database-per-service. Optamos por banco compartilhado conscientemente por dois motivos: (1) reduzir complexidade operacional dado o escopo do projeto, e (2) mantermos disciplina via separação de schemas no Prisma — cada serviço só enxerga suas tabelas, então o acoplamento é por contrato de schema, não por queries livres. Em produção real, com mais tempo, faríamos a separação."

Resposta madura: você sabe a teoria, fez a escolha pragmática, conhece o trade-off.

---

## 14. Outbox Pattern em detalhe

Já tocamos no Cap. 12. Vamos aprofundar porque é provável que caia.

### O problema que o Outbox resolve

Imagine que o MS-02 precisa fazer duas coisas atômicas:
1. Atualizar a grade horária.
2. Notificar o MS-05 que houve mudança.

Tentativa ingênua:
```ts
await prisma.grade_horaria.update(...)  // sucesso
await fetch('http://ms05/notify', ...)  // FALHA — MS-05 está fora
```

Resultado: dados inconsistentes. Grade mudou no MS-02, mas MS-05 nunca soube.

Tentativa ingênua reversa:
```ts
await fetch('http://ms05/notify', ...)  // sucesso
await prisma.grade_horaria.update(...)  // FALHA — banco fora
```

Pior ainda: notificação enviada sobre uma mudança que nunca aconteceu.

### A solução Outbox

> Persista o evento na **mesma transação** que a mudança de dados. Um worker separado lê os eventos e os processa.

Implementação simplificada no MS-02:

```ts
// MS-02/src/routes/grade.ts
await fastify.prisma.grade_horaria.create({ data: { ... } })
await fastify.prisma.evento_grade.create({
  data: { grade_horaria_id, tipo: 'CRIACAO', processado: false, ... }
})
return reply.code(201).send(grade)
```

Aqui as duas inserções são na mesma "unidade de trabalho" — se uma falhar, idealmente a transação do Prisma deveria reverter as duas. **No código atual, não envolvemos em `prisma.$transaction(...)` — esse é um ajuste menor a fazer pra rigor total.**

O MS-05 tem o worker:

```ts
// MS-05/src/workers/gradeWorker.ts
setInterval(async () => {
  const eventos = await fetch(`${ms02Url}/v1/teachers/schedule/changes/recent`)
  for (const ev of eventos) {
    if (processedEventIds.has(ev.id)) continue
    // ... processa: cria comunicado, busca alunos, cria notificações
    processedEventIds.add(ev.id)
  }
}, 30_000)
```

### Garantias e limitações da nossa implementação

- **At-least-once delivery.** Um evento pode ser processado mais de uma vez (worker reinicia e perde o `Set` de processados). Os handlers precisam ser **idempotentes** — re-processar não deve causar dano.
- **No nosso caso, a idempotência não é perfeita.** Re-processar criaria comunicados duplicados. Em produção, marcaríamos `processado = true` no banco do MS-02 ou usaríamos uma tabela de dedup no MS-05.
- **Polling tem latência.** Até 30s. Em produção com mensageria (RabbitMQ/Kafka), seria <1s.

### Quando você ouvir "exactly-once delivery"

Algumas pessoas falam que querem garantir entrega "exatamente uma vez". Na prática **isso é impossível em sistemas distribuídos** (resultado teórico clássico). O melhor que se consegue é "at-least-once + idempotência" ou "at-most-once" (que pode perder mensagens).

---

## 15. RBAC e autorização

### O que é RBAC

Role-Based Access Control. Em vez de "qual usuário pode fazer o quê", você define "qual *papel* pode fazer o quê", e atribui papéis aos usuários.

**Nossos papéis:** ADMIN, PROFESSOR, ALUNO.

**Como aplicamos.** Em cada rota de cada MS, declaramos quem pode acessar:

```ts
// MS-04/src/routes/notas.ts
fastify.put<{ Body: ConfigBody }>('/config', {
  preHandler: fastify.requireRole(['ADMIN']),
  ...
})
```

O `requireRole(['ADMIN'])` é uma factory function que retorna um middleware:

```ts
// MS-XX/src/plugins/authenticate.ts
fastify.decorate(
  'requireRole',
  (roles: Role[]) => async (request, reply) => {
    await request.jwtVerify()
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Permissão insuficiente' })
    }
  }
)
```

### A distinção 401 vs 403

Pergunta clássica de prova:

- **401 Unauthorized**: "Eu não sei quem você é." (Sem token ou token inválido.)
- **403 Forbidden**: "Eu sei quem você é, mas você não tem permissão." (Token válido, mas role errado.)

Quem confunde os dois leva mal-falando em entrevista.

### A complicação real: regras condicionais

RBAC puro diz "ADMIN pode X, PROFESSOR pode Y". Mas o mundo real tem regras como:

> Professor pode listar alunos, **mas só se filtrar por uma turma** (não pode listar todos).

Isso a gente teve no MS-01 — corrigimos durante o desenvolvimento. A rota `GET /v1/students` agora tem:

```ts
fastify.get<{ Querystring: AlunoQuery }>('/', {
  preHandler: fastify.authenticate  // só valida login, não papel
}, async (request, reply) => {
  const { role } = request.user
  const { turma_id } = request.query

  if (role !== 'ADMIN' && role !== 'PROFESSOR') {
    return reply.code(403).send({ error: 'Permissão insuficiente' })
  }
  if (role === 'PROFESSOR' && !turma_id) {
    return reply.code(403).send({ error: 'Professor deve filtrar por turma_id' })
  }
  // ... segue com a query
})
```

Esse é o limite do RBAC. Quando regras envolvem o **conteúdo** da requisição, precisa de lógica no handler.

### ABAC (mencionar se perguntarem)

Attribute-Based Access Control. Generalização do RBAC. Regras como "usuário pode editar registro se for o autor *ou* se for ADMIN *ou* se estiver no mesmo departamento". A gente não usa ABAC formal, mas faz no-código equivalente quando necessário.

### Frontend também faz gating

Importante: o frontend **também** esconde botões/queries admin-only de não-admins. Não é segurança (qualquer um pode forçar a request via curl), é **UX e redução de erros 403 no console**.

A segurança real está no backend. O frontend gating é cortesia.

```tsx
// frontend/.../TeacherDetail.tsx
const isAdmin = user?.role === 'ADMIN'
// ...
{isAdmin && (
  <button onClick={openScheduleModal}>Adicionar Horário</button>
)}
```

---

# Parte IV — Padrões e princípios aplicados

## 16. SOLID com exemplos do nosso código

SOLID são cinco princípios de design orientado a objetos (Robert Martin, "Uncle Bob"). Vão certamente cair perguntas. Vamos com exemplos do código.

### S — Single Responsibility Principle

> Uma classe/módulo deve ter um único motivo para mudar.

**Exemplo no projeto.** O cálculo de média bimestral fica isolado:

```ts
// MS-04/src/services/nota.service.ts
export async function recalcularMedia(prisma, alunoId, disciplinaId, bimestre, anoLetivo) {
  const notas = await prisma.nota.findMany({ where: { ... } })
  if (notas.length === 0) return
  const soma = notas.reduce((acc, n) => acc + Number(n.valor), 0)
  const valorCalculado = Number((soma / notas.length).toFixed(2))
  // ... upsert em media_bimestral
}
```

A rota POST `/v1/grades` **não** sabe calcular média. Ela só insere a nota e chama `recalcularMedia(...)`. Se um dia a regra de cálculo mudar (peso por avaliação, descarte da menor nota, etc.), você só mexe nessa função.

**Antes do refator do frontend, o `api.ts` violava SRP.** Tinha 9 serviços diferentes no mesmo arquivo de 163 linhas. Cada mudança em qualquer um deles forçava a editar esse arquivo gigante. Quebramos em 9 arquivos.

### O — Open/Closed Principle

> Aberto para extensão, fechado para modificação.

**Exemplo no projeto.** O sistema de roles. Para adicionar um novo role (digamos COORDENADOR), você:

1. Adiciona no enum `usuario_role` no Prisma.
2. Decora as rotas relevantes com `requireRole(['ADMIN', 'COORDENADOR'])`.

Você **não** mexe na função `requireRole` em si. Ela foi escrita aberta a aceitar qualquer lista de roles. Extensível sem modificação.

**Anti-exemplo.** Se a gente tivesse hardcoded `if (role === 'ADMIN') ...` em 50 lugares, adicionar um role seria mexer em 50 lugares.

### L — Liskov Substitution Principle

> Subtipos devem ser substituíveis pelo tipo base sem quebrar nada.

**Menos exemplos diretos no nosso código** (porque usamos pouco OOP), mas o princípio aparece:

- Todos os componentes UI compartilhados (`<Field>`, `<GradeBadge>`, `<StatusBadge>`, `<TabNav>`) respeitam suas props declaradas. Você pode trocar implementações sem quebrar os consumidores.
- Os `services/*Service.ts` no frontend têm assinaturas consistentes (`list()`, `getById()`, `create()`, `update()`, `remove()`). Quem usa o `studentsService` pode esperar a mesma interface no `teachersService`.

### I — Interface Segregation Principle

> Clientes não devem ser forçados a depender de interfaces que não usam.

**Exemplo no projeto.** Antes do refator, todo componente que precisava chamar uma API importava `services/api.ts` inteiro:

```ts
import { studentsService } from '../../services/api'  // mas api.ts tem 9 outros
```

Mesmo importando só `studentsService`, o módulo `api.ts` carrega tudo. Em runtime, tree-shaking ajuda. Em manutenção, todo mundo que mexe em `api.ts` afeta todos os consumidores.

Após refator: `httpClient.ts`, `studentsService.ts`, `teachersService.ts`, etc. Cada um pode evoluir independente. `api.ts` virou um *barrel* — só re-exporta.

### D — Dependency Inversion Principle

> Dependa de abstrações, não de implementações concretas.

**Exemplo no projeto.** As funções de service no MS-04 recebem `prisma` como parâmetro:

```ts
export async function recalcularMedia(
  prisma: PrismaClient,  // recebe injetado
  alunoId, disciplinaId, bimestre, anoLetivo
)
```

Em vez de a função importar `prisma` direto, ela recebe. Isso a deixa testável (você pode passar um mock) e desacoplada.

**Anti-exemplo no nosso código (pra ser honesto).** Vários services do frontend usam `axios` diretamente via instâncias importadas. Para testar, seria difícil mockar. Em produção, talvez injetássemos via Context API. Pro escopo, é OK.

---

## 17. Clean Code aplicado

Clean Code (Robert Martin) é uma coleção de heurísticas para código legível.

### Nomes que dizem a intenção

```ts
// Ruim
const x = students.filter(s => s.status === 'ATIVO')

// Bom (do nosso código)
const alunosAtivos = students.filter(s => s.status === 'ATIVO')
```

No projeto, nomes são em **português para domínio** (`aluno`, `professor`, `nota`, `media_bimestral`) e **inglês para conceitos técnicos** (`service`, `client`, `interceptor`). Trade-off consciente: pessoas do domínio leem o código de negócio; programadores de infra leem o código técnico.

### Funções pequenas, uma responsabilidade

A função `recalcularMedia` faz exatamente uma coisa. Tem 30 linhas, mas todas pertencem ao mesmo conceito.

**Sinal de função muito grande:** quando você precisa scrollar pra entender. Quebrar em subfunções com nomes descritivos.

### DRY — Don't Repeat Yourself

Do nosso refator recente: identificamos funções duplicadas em vários componentes (`getInitials`, `formatDate`, `gradeBadge`, `statusBadge`). Movemos para:

- `frontend/src/utils/formatters.ts` (funções puras)
- `frontend/src/components/ui/Field.tsx`, `GradeBadge.tsx`, `StatusBadge.tsx` (componentes)

Antes: a mesma função copiada em 4 arquivos. Mudança = 4 lugares. Risco de divergir.
Depois: uma fonte. Mudança = 1 lugar. Consistência garantida.

### KISS — Keep It Simple, Stupid

Quando perguntarem por que não usamos GraphQL, ou tRPC, ou microsserviços com Kubernetes:

> "REST + JSON é o padrão mais simples que resolve. Adicionar GraphQL/tRPC só faria sentido se tivéssemos um problema concreto que justifique (over-fetching crônico, ou compartilhamento de tipos cross-service). Não temos."

### YAGNI — You Aren't Gonna Need It

Não construir features "por garantia". Exemplo no projeto: não temos sistema de logs estruturados, métricas Prometheus, distributed tracing. Tudo isso seria útil em produção, mas não é necessário pra demonstrar a arquitetura.

O contrário também vale: existe um *over-engineering* clássico — montar abstração genérica antes de ter 3 casos de uso. A gente quase caiu nisso ao criar a função `createClient(baseURL)` no `httpClient.ts`:

```ts
function createClient(baseURL: string) {
  const client = axios.create({ baseURL })
  client.interceptors.request.use(...)   // injeta JWT
  client.interceptors.response.use(...)  // refresh em 401
  return client
}

export const ms01 = createClient(SERVICES.ms01)
export const ms02 = createClient(SERVICES.ms02)
// ...
```

Aqui temos 6 instâncias — abstração justificada. Se tivéssemos só uma, era over-engineering.

---

## 18. Outros padrões: Service Layer, DTOs, Barrel Files

### Service Layer

A camada de "lógica de negócio" entre rotas (HTTP) e modelos (banco).

**Exemplo no MS-04:** `routes/notas.ts` é o controller (recebe HTTP, valida, chama service). `services/nota.service.ts` tem a lógica (`recalcularMedia`). `prisma.nota.create(...)` é o modelo.

**Por que separar?** Você pode chamar `recalcularMedia` de um job batch, de outra rota, de um teste — sem precisar simular uma request HTTP.

**Quem ainda mistura.** No frontend, alguns componentes têm muita lógica que devia estar em hook customizado ou em service. Refator futuro.

### DTOs (Data Transfer Objects)

Objetos que representam dados em trânsito. No nosso projeto, as **interfaces TypeScript** (`AlunoBody`, `NotaBody`, `LoginBody`) atuam como DTOs.

**Por que importam.** Eles definem o **contrato** entre cliente e servidor. Se mudar o DTO sem versionar, quebra clientes.

### Barrel Files

Um arquivo que re-exporta de vários arquivos vizinhos, para simplificar imports.

**Exemplo no projeto:** o `frontend/src/services/api.ts` virou um barrel após o refator:

```ts
export { authApi, ms01, ms02, ms03, ms04, ms05 } from './httpClient'
export { authService } from './authService'
export { studentsService } from './studentsService'
// ...
```

Agora você pode escrever `import { studentsService } from '../../services/api'` e funciona. **Sem precisar mudar nada nos consumidores existentes.**

**Cuidado.** Barrels grandes podem prejudicar tree-shaking. Em projetos enormes, alguns optam por imports diretos (`from '../../services/studentsService'`). No nosso, o barrel ajuda na DX e o overhead é desprezível.

---

# Parte V — Cada microsserviço por dentro

Esta parte é mais "guia turístico" de cada MS. Para cada um: o que ele faz, quais rotas oferece, decisões interessantes, pegadinhas.

## 19. Auth Service

**Porta:** 3000.
**Responsabilidade:** autenticar usuários, emitir e renovar tokens JWT.

### Modelo de dados

```prisma
model usuario {
  id            String       @id @db.Char(36)
  email         String       @unique
  senha_hash    String
  role          usuario_role     // ADMIN | PROFESSOR | ALUNO
  referencia_id String?          // FK pro aluno/professor real
  ativo         Boolean      @default(true)
  ...
}
```

**Decisão importante:** `referencia_id` é nullable. Para ADMIN, fica null (admin não é um aluno nem professor). Para PROFESSOR, aponta pro registro em `professor`. Para ALUNO, aponta pra `aluno`.

### Rotas

| Método | Rota | Quem pode | O que faz |
|---|---|---|---|
| POST | `/v1/auth/login` | público | Email+senha → tokens |
| POST | `/v1/auth/refresh` | público | refreshToken → novo accessToken |
| GET | `/v1/auth/validate` | autenticado | "Esse token ainda é válido?" (utilitário) |

### O fluxo de login em detalhe

1. Cliente manda `POST /v1/auth/login` com email+senha.
2. Servidor busca `usuario` no banco.
3. Se não existe ou está inativo → 401.
4. `bcrypt.compare(senha, usuario.senha_hash)`. Se diferente → 401.
5. Monta payload:
   ```ts
   { sub: usuario.id, role: usuario.role, referenciaId: usuario.referencia_id, turmaId: usuario.aluno?.turma_atual_id ?? null }
   ```
6. Assina access (15 min) e refresh (7 dias).
7. Devolve `{ accessToken, refreshToken, role }`.

**Por que `turmaId` no JWT?** Otimização. Quando aluno faz uma request, o backend sabe imediatamente em qual turma ele está, sem precisar consultar o banco. Trade-off: se o aluno trocar de turma, o JWT antigo continua com a turma anterior até expirar (15 min).

### Por que não há cadastro de usuário público

Cadastro é responsabilidade do **MS-01** (admin cadastra aluno → MS-01 cria registro em `aluno` E em `usuario`). Não temos `/v1/auth/register` público porque não queremos auto-registro num sistema escolar.

---

## 20. MS-01 Gestão de Alunos

**Porta:** 3001.
**Responsabilidade:** cadastro de alunos, frequência, histórico escolar.

### Rotas principais

| Método | Rota | Quem | O que |
|---|---|---|---|
| GET | `/v1/students` | ADMIN, PROFESSOR (com turma_id) | Lista alunos (paginado) |
| GET | `/v1/students/count` | ADMIN | Conta total |
| GET | `/v1/students/me` | ALUNO | Próprio perfil |
| GET | `/v1/students/:id` | ADMIN ou próprio aluno | Detalhe |
| POST | `/v1/students` | ADMIN | Cadastrar |
| PUT | `/v1/students/:id` | ADMIN | Editar |
| DELETE | `/v1/students/:id` | ADMIN | Soft delete (status = INATIVO) |
| POST | `/v1/students/:id/frequency` | PROFESSOR, ADMIN | Lançar presença |
| GET | `/v1/students/:id/frequency` | ADMIN ou próprio aluno | Consultar |
| GET | `/v1/students/:id/history` | ADMIN ou próprio aluno | Histórico acadêmico |

### A correção recente (importante!)

`GET /v1/students` era ADMIN-only. Mas o **professor precisa listar alunos da turma** pra:
1. Fazer chamada (telas de Frequência).
2. Lançar notas (tela de Notas).

Solução: liberamos para PROFESSOR, **mas** ele é obrigado a filtrar por `turma_id`. ADMIN pode listar tudo.

```ts
if (role === 'PROFESSOR' && !turma_id) {
  return reply.code(403).send({ error: 'Professor deve filtrar por turma_id' })
}
```

**Por que essa restrição.** Limita o escopo de leitura do professor — ele só vê alunos de turmas (qualquer turma). Idealmente, restringiríamos pra turmas que ele realmente dá aula (cross-reference com MS-02), mas é refator maior.

### Soft delete

`DELETE /v1/students/:id` não apaga o registro. Atualiza `status = 'INATIVO'`. Por quê:
- Auditoria: histórico de notas/frequência precisa do aluno mesmo após "sair".
- Reversibilidade: aluno pode voltar.
- Integridade referencial: deletar de verdade quebraria FKs.

---

## 21. MS-02 Gestão de Professores e Grade

**Porta:** 3002.
**Responsabilidade:** professores, grade horária, substituições, eventos de grade (Outbox).

### Modelo de dados

- `professor`: igual ao `aluno` mas sem turma.
- `grade_horaria`: combinação (professor, turma, disciplina, dia, horário).
- `substituicao_professor`: registro de substituições temporárias.
- `evento_grade`: tabela Outbox (eventos que MS-05 consome).

### Rotas

| Método | Rota | Quem | O que |
|---|---|---|---|
| GET | `/v1/teachers` | ADMIN | Lista (paginado) |
| GET | `/v1/teachers/me` | PROFESSOR | Próprio perfil |
| GET | `/v1/teachers/:id` | autenticado | Detalhe |
| POST/PUT/DELETE | `/v1/teachers[/:id]` | ADMIN | CRUD |
| GET | `/v1/teachers/:id/schedule` | ADMIN ou próprio professor | Grade |
| POST | `/v1/teachers/:id/schedule` | ADMIN | Adicionar entrada na grade |
| POST | `/v1/teachers/:id/schedule/:gradeId/substitution` | ADMIN | Substituição |
| GET | `/v1/teachers/schedule/changes/recent` | (público!) | Endpoint pra MS-05 worker |

### O endpoint sem auth (`/schedule/changes/recent`)

Esse endpoint não tem `preHandler: fastify.authenticate`. Por quê? Porque o worker do MS-05 (rodando em container separado) precisa consultá-lo sem ter um token de usuário.

**Decisão consciente, com trade-off.** Em produção, daríamos um token de serviço (service-to-service auth, M2M tokens). Para o escopo, deixar aberto é aceitável porque:
- A rede do Docker Compose é interna.
- O endpoint só lê, não escreve.
- Não expõe dados sensíveis (só eventos de grade).

Quem perguntar "por que esse endpoint é público?" — sabe a resposta.

### A tabela `evento_grade` é a outbox

Cada vez que admin altera a grade (POST/PUT schedule, POST substitution), insere uma linha em `evento_grade`:

```ts
await fastify.prisma.evento_grade.create({
  data: {
    grade_horaria_id: grade.id,
    tipo: 'CRIACAO' | 'EDICAO' | 'SUBSTITUICAO',
    descricao: '...',
    processado: false
  }
})
```

O MS-05 polla esse endpoint. Quando processa, marca (na memória, infelizmente — limitação atual) que aquele ID já foi processado.

---

## 22. MS-03 Turmas, Disciplinas e Calendário

**Porta:** 3003.
**Responsabilidade:** estrutura organizacional da escola — turmas, disciplinas oferecidas, calendário do ano letivo, alocação de alunos em turmas.

### Modelo de dados

- `turma`: ano letivo, turno, código.
- `disciplina`: nome, carga horária.
- `calendario_evento`: feriados, recessos, eventos especiais.
- `alocacao_aluno`: liga aluno a turma (com data de matrícula).

### Rotas

A maioria CRUD direto. Decisão interessante: `GET /v1/classes` é apenas authenticate (qualquer logado pode ver lista de turmas). Por quê: vários consumidores precisam (frontend do professor pra escolher turma, MS-05 worker, etc.).

Mas `POST/PUT/DELETE` são ADMIN-only. Só admin altera a estrutura.

### Por que `alocacao_aluno` é uma tabela separada

Em vez de só `aluno.turma_atual_id`, temos uma tabela `alocacao_aluno`. Razão: **histórico**. Quando o aluno troca de turma (mudou de série, mudou de período), queremos manter o registro de quando estava em qual turma.

`aluno.turma_atual_id` é cache pra acesso rápido à turma atual. `alocacao_aluno` é o histórico completo.

---

## 23. MS-04 Avaliações e Notas

**Porta:** 3004.
**Responsabilidade:** avaliações, notas, médias bimestrais, prova final, configuração da média mínima.

### O domínio mais complexo

Esse é o MS com mais lógica de negócio. Tem regras matemáticas, máquina de estados (prova final), e propagação de mudanças (lançar nota recalcula média).

### Modelo de dados

- `avaliacao`: o que vai ser avaliado (prova, trabalho, etc.). Tem `disciplina_id`, `bimestre`, `peso_na_media`, `tipo`.
- `nota`: nota de um aluno numa avaliação. Tem `valor` (Decimal), `substituida` (boolean), `professor_id`.
- `media_bimestral`: média calculada de um aluno em uma disciplina+bimestre+ano. Tem `valor_calculado` (Decimal), `recuperacao_aplicada` (boolean).
- `prova_final`: registro de prova final por aluno+disciplina+ano. Status: `EM_CURSO`, `APROVADO_PF`, `REPROVADO_NOTA`.
- `configuracao_avaliacao`: a média mínima vigente (ex.: 7.0). Histórico de mudanças.

### Fluxo: lançar uma nota

1. Professor manda `POST /v1/grades` com `{ avaliacao_id, aluno_id, valor }`.
2. MS-04 cria registro em `nota`.
3. Busca a `avaliacao` correspondente.
4. **Se** o tipo for `RECUPERACAO`:
   - Busca a `media_bimestral` correspondente.
   - Se a nota de recuperação for maior que a média atual, **substitui** a média.
5. **Senão** (avaliação normal):
   - Chama `recalcularMedia(prisma, aluno_id, disciplina_id, bimestre, ano_letivo)`.
   - A função soma todas as notas válidas do bimestre, divide pela quantidade, e atualiza (ou cria) `media_bimestral`.
6. Retorna 201.

**Por que recuperação tem lógica diferente.** Recuperação não entra no cálculo da média (`tipo: { not: 'RECUPERACAO' }`). Ela **substitui** a média se for melhor. Regra de negócio escolar comum.

### Fluxo: prova final

Prova final só faz sentido se o aluno **reprovou** no ano (média < mínima). Por isso:

1. Professor tenta lançar prova final (`POST /v1/grades/prova-final`).
2. MS-04 calcula a média anual a partir das 4 médias bimestrais.
3. Se a média anual >= mínima: erro "aluno já aprovado, prova final não aplicável".
4. Senão, cria `prova_final` com `status: EM_CURSO` e `media_anual`.
5. Calcula `media_final = (media_anual + nota_prova_final) / 2`.
6. Se `media_final >= mínima`: `status = APROVADO_PF`. Senão: `status = REPROVADO_NOTA`.

### Decimal vs Number — a pegadinha

`valor`, `valor_calculado`, `media_anual`, etc. são `Decimal` no MySQL. Prisma retorna como **string** (precisão).

```ts
// ERRADO — vai dar runtime error
const soma = notas.reduce((acc, n) => acc + n.valor, 0)  // string concat!

// CERTO
const soma = notas.reduce((acc, n) => acc + Number(n.valor), 0)
```

Acontece em vários lugares. Procura por `Number(...)` no código pra ver os locais.

---

## 24. MS-05 Comunicação Escolar

**Porta:** 3005.
**Responsabilidade:** comunicados, destinatários, notificações externas, preferências de notificação. Também tem **dois workers** em background.

### Modelo de dados

- `comunicado`: título, conteúdo, remetente, `publico_alvo` (GERAL, TURMA_ESPECIFICA, TODOS_PROFESSORES, LISTA_MANUAL).
- `destinatario_comunicado`: liga `comunicado` a um `usuario_id`, com `lido` e `data_leitura`.
- `notificacao_externa`: registro de envio por email/WhatsApp (status: PENDENTE, ENVIADA, FALHA).
- `preferencia_usuario`: o que cada usuário aceita receber por qual canal.

### Por que separar `comunicado` de `destinatario_comunicado`

Um comunicado pode ter centenas de destinatários (toda a turma). Em vez de duplicar o conteúdo N vezes, temos um `comunicado` e N linhas em `destinatario_comunicado` que apontam pra ele. Cada destinatário tem seu próprio estado de leitura.

Classic 1:N. Normalização básica.

### Os dois workers

#### gradeWorker — escuta mudanças de grade do MS-02

Polling de 30s no endpoint `GET /v1/teachers/schedule/changes/recent` do MS-02.

Para cada evento novo:
1. Cria um `comunicado` automático (remetente = "sistema").
2. Busca alunos da turma via MS-03.
3. Cria registros de `destinatario_comunicado` e `notificacao_externa`.

Tudo dentro de uma transação Prisma.

#### notificacaoWorker — processa notificações pendentes

(Existe no código mas é mais simples — basicamente loop que marca PENDENTE → ENVIADA. Em produção, integraria com SendGrid/Twilio.)

### Listagem com filtro por role

```ts
fastify.get('/', { preHandler: fastify.authenticate }, async (request, reply) => {
  const user = request.user

  if (user.role === 'ADMIN') {
    return all comunicados
  }

  if (user.role === 'PROFESSOR') {
    return where: { OR: [ remetente_id: user.sub, destinatarios contém user.sub ] }
  }

  // ALUNO
  return where: { OR: [ publico_alvo: 'GERAL', destinatarios contém user.sub ] }
})
```

Mostra a regra: a query depende do role. Não dá pra implementar isso só com `requireRole` — precisa da lógica no handler.

---

# Parte VI — Frontend

## 25. Estrutura de pastas e por quê

```
frontend/src/
├── components/
│   ├── layout/        → AppLayout, Sidebar, Topbar (chrome da aplicação)
│   └── ui/            → Field, Modal, GradeBadge, ... (componentes genéricos)
├── pages/
│   ├── Dashboard/     → AdminDashboard, ProfessorDashboard, AlunoDashboard
│   ├── students/      → StudentList, StudentDetail, StudentForm
│   ├── teachers/      → TeacherList, TeacherDetail
│   ├── classes/       → ClassList, ClassDetail
│   ├── disciplines/   → DisciplineList
│   ├── calendar/      → CalendarPage
│   ├── assessments/   → AssessmentList
│   ├── grades/        → GradeLaunch, Boletim, Frequency
│   ├── communications/→ CommunicationsPage
│   ├── settings/      → SettingsPage
│   └── errors/        → NotFound, Unauthorized
├── services/
│   ├── httpClient.ts        → fábrica do Axios com interceptors
│   ├── authService.ts       → endpoints do auth-service
│   ├── studentsService.ts   → endpoints do MS-01
│   ├── teachersService.ts   → endpoints do MS-02
│   ├── classesService.ts    → endpoints do MS-03 (turmas)
│   ├── disciplinesService.ts→ endpoints do MS-03 (disciplinas)
│   ├── calendarService.ts   → endpoints do MS-03 (calendário)
│   ├── assessmentsService.ts→ endpoints do MS-04 (avaliações)
│   ├── gradesService.ts     → endpoints do MS-04 (notas, config)
│   ├── communicationsService.ts → endpoints do MS-05
│   └── api.ts               → barrel (re-exporta tudo)
├── store/
│   └── authStore.ts   → Zustand para autenticação
├── utils/
│   └── formatters.ts  → formatDate, formatGrade, getInitials
├── types/
│   └── index.ts       → interfaces TypeScript do domínio
├── App.tsx
├── main.tsx
├── router.tsx         → react-router-dom config
├── index.css          → Tailwind base + @layer components
└── vite-env.d.ts
```

### Princípios

- **Por feature, depois por tipo.** `pages/students/` agrupa tudo sobre alunos. Dentro, separa por componente. Alternativa "por tipo primeiro" (`pages/`, `components/`, todos misturados) escala mal.
- **`components/ui` vs `components/layout`.** UI são átomos genéricos (Modal, Field). Layout são partes únicas da aplicação (Sidebar, Topbar).
- **`services/` mapeia 1:1 ao backend.** Para cada MS, um arquivo. Encontrar onde chamamos um endpoint é fácil.

---

## 26. Padrão de Services e o split do api.ts

Antes do refator, `services/api.ts` tinha 163 linhas com **9 services diferentes**. Violava SRP claramente.

Hoje:

- `httpClient.ts` (45 linhas): fábrica do Axios + interceptors. **Uma responsabilidade.**
- `studentsService.ts` (20 linhas): só endpoints de alunos.
- `teachersService.ts` (20 linhas): só endpoints de professores.
- etc.
- `api.ts` (10 linhas): barrel — re-exporta tudo. Permite que código antigo (`import { studentsService } from '../../services/api'`) continue funcionando.

### Por que o barrel ajuda

Sem ele, todos os ~30 arquivos que importavam de `api.ts` precisariam mudar pra `from '../../services/studentsService'`. Com ele, refactor invisível pros consumidores.

### O padrão de cada service

```ts
// studentsService.ts
import { ms01 } from './httpClient'

export const studentsService = {
  list: (params?) => ms01.get('/v1/students', { params }),
  count: () => ms01.get('/v1/students/count'),
  me: () => ms01.get('/v1/students/me'),
  getById: (id) => ms01.get(`/v1/students/${id}`),
  create: (data) => ms01.post('/v1/students', data),
  update: (id, data) => ms01.put(`/v1/students/${id}`, data),
  remove: (id) => ms01.delete(`/v1/students/${id}`),
}
```

Consistência: todo service tem `list`, `getById`, `create`, `update`, `remove` quando aplicável. Métodos extras pra cada domínio.

---

## 27. Componentes UI compartilhados

Antes do refator, várias páginas tinham:
- Sua própria função `getInitials(name)`.
- Sua própria função `formatDate(str)`.
- Sua própria função `gradeBadge(value)` retornando JSX.
- Seu próprio componente `Field` local.
- Sua própria navegação de tabs duplicada 3x.

Hoje:

| Compartilhado | Onde fica | Substituiu |
|---|---|---|
| `formatDate`, `formatGrade`, `getInitials` | `utils/formatters.ts` | 4+ duplicações |
| `<Field label="..." value="..." />` | `components/ui/Field.tsx` | 2 cópias locais |
| `<GradeBadge value={...} />` | `components/ui/GradeBadge.tsx` | 4 versões diferentes |
| `<StatusBadge status={...} />` | `components/ui/StatusBadge.tsx` | 2 implementações |
| `<TabNav tabs={...} active={...} onChange={...} />` | `components/ui/TabNav.tsx` | 3 navegações inline |

**Princípio.** Se você está copiando a 3ª vez, extraia. Antes disso, talvez não — porque você ainda não sabe a forma certa da abstração.

### Componentes pré-existentes (não criados no refator)

- `<Modal>`: dialog/modal genérico.
- `<ConfirmDialog>`: confirmar ação destrutiva.
- `<EmptyState>`: estado vazio com CTA.
- `<Pagination>`: paginação.

---

## 28. State global vs server state

Vamos cimentar a distinção (Cap. 8) com casos concretos.

### "Lista de alunos" — server state — React Query

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['students', { search, status, page, limit }],
  queryFn: () => studentsService.list({ ... }).then((r) => r.data),
})
```

**Por que React Query e não Zustand.** A lista vem do servidor. Pode mudar (admin adiciona aluno). Precisa de cache (várias páginas mostram). Precisa de loading/error states. React Query dá tudo.

### "Usuário logado" — client state — Zustand

```ts
const { user } = useAuthStore()
const isAdmin = user?.role === 'ADMIN'
```

**Por que Zustand e não React Query.** Não vem de uma chamada periódica. Persiste no localStorage. Vive durante a sessão inteira. Vários componentes leem.

### Invalidação após mutação

Quando criamos um aluno:

```tsx
const createMutation = useMutation({
  mutationFn: (data) => studentsService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] })  // refetch
  },
})
```

`invalidateQueries` marca como stale. Queries ativas refazem. Queries inativas serão refetched quando alguém escutar.

**Por que não atualizar localmente.** Atualização otimista funciona, mas não garante que servidor concorda. Refetch é simples e correto.

---

## 29. Roteamento e guards por role

Usamos `react-router-dom` (v6).

```tsx
// router.tsx
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'students', element: <StudentListPage /> },
      // ...
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
```

### O guard `RequireAuth`

Olha o Zustand. Se `isAuthenticated === false`, redireciona pra `/login`. Senão, renderiza filhos.

### Por que não temos `RequireRole`

A gente faz role gating **dentro** dos componentes:

```tsx
const isAdmin = user?.role === 'ADMIN'
{isAdmin && <button>Editar</button>}
```

**Razão:** muitas páginas são acessíveis a múltiplos roles, com UI ligeiramente diferente. Um guard `RequireRole` em cima da rota seria binário (entra ou não entra). Granularidade dentro do componente é mais flexível.

**Trade-off:** se um role abre uma URL que não deveria, a página renderiza vazia/quebrada. Não redireciona. Em produção, faríamos `<NotAuthorized>` ou redirect baseado em role.

### Sidebar diferente por role

```tsx
// Sidebar.tsx
const adminItems = [Dashboard, Alunos, Professores, Turmas, ...]
const professorItems = [Dashboard, Meu Perfil, Frequência, Avaliações, Notas, Comunicados]
const alunoItems = [Dashboard, Meu Perfil, Boletim, Frequência, Comunicados]

const items = role === 'ADMIN' ? adminItems : role === 'PROFESSOR' ? professorItems : alunoItems
```

Cada role tem menu próprio. O aluno **não vê** o link pra `/students`, mesmo que a rota exista.

Isso é **proteção de descoberta**, não de segurança. Mesmo sem o link, ele pode digitar `/students` no browser. A segurança real está no backend (que retorna 403).

---

## 30. Persistência da sessão e o bug do refresh

Esse foi um bug recente. Vale entender.

### O Zustand inicial

```ts
const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      // ... setters
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)
```

### O bug

Olha o `partialize`: persiste **só** `accessToken` e `refreshToken`. Não persiste `user` nem `isAuthenticated`.

Quando o usuário recarrega a página:
1. Zustand inicia com valores default: `user = null`, `isAuthenticated = false`.
2. O middleware `persist` lê do localStorage e popula `accessToken` e `refreshToken`.
3. **Mas `isAuthenticated` continua `false`.**
4. `RequireAuth` vê `false` e redireciona pra `/login`.

Resultado: o usuário é "deslogado" no F5, mesmo tendo token válido.

### Por que `partialize` foi escrito assim

`user` é derivado do JWT — não precisa persistir, dá pra parsear de novo. Quem escreveu original queria manter o storage enxuto.

### A correção

Usamos o callback `onRehydrateStorage` do middleware. Ele roda **após** o storage carregar:

```ts
onRehydrateStorage: () => (state) => {
  if (!state?.accessToken) return
  const user = parseJWT(state.accessToken)
  if (!user || (isExpired(user) && !state.refreshToken)) {
    // limpa tudo — sem volta
    state.accessToken = null
    state.refreshToken = null
    state.user = null
    state.isAuthenticated = false
    return
  }
  state.user = user
  state.isAuthenticated = true
}
```

A lógica:
- Sem `accessToken` no storage: nada a fazer.
- Com token: parseia.
- Token expirado E sem refresh: deslogue.
- Caso contrário: popule `user` e `isAuthenticated = true`.

### Por que ainda funciona com token expirado (se tem refresh)

Se o `accessToken` expirou mas o `refreshToken` existe, deixamos `isAuthenticated = true`. Quando a próxima request der 401, o interceptor do Axios faz refresh transparente. Usuário não percebe.

Se ambos expiraram, aí sim deslogamos.

---

# Parte VII — Fluxos de ponta a ponta

Vamos seguir alguns fluxos importantes do clique do usuário até o efeito final, atravessando todas as camadas.

## 31. Fluxo de login

1. **Usuário** acessa `http://localhost`. Nginx serve `index.html`. React inicializa.
2. **RequireAuth** vê `isAuthenticated = false`, redireciona pra `/login`.
3. **LoginPage** renderiza form. Usuário preenche e submete.
4. **Form handler** chama `authService.login(email, senha)`.
5. **authService.login** faz `POST http://localhost:3000/v1/auth/login` com `{ email, senha }`.
6. **auth-service** recebe, busca `usuario`, valida senha com bcrypt, monta payload JWT, assina, devolve `{ accessToken, refreshToken, role }`.
7. **Form handler** recebe, chama `authStore.setTokens(...)`.
8. **Zustand** parseia o JWT, atualiza `user` e `isAuthenticated = true`. Persist middleware grava tokens no localStorage.
9. **Navegação** redireciona pra `/dashboard`.
10. **DashboardPage** olha `user.role`, decide qual dashboard mostrar (Admin/Professor/Aluno).
11. **Os componentes do dashboard** disparam queries (`useQuery`) pro backend, cada uma com `Authorization: Bearer ${accessToken}` injetado pelo interceptor do Axios.

Pronto. Usuário logado, tela renderizada.

---

## 32. Fluxo de lançamento de nota (e o recálculo de média)

Cenário: professor está na tela `/grades` (GradeLaunch).

1. **Professor seleciona** uma avaliação no dropdown.
2. **GradeLaunch** dispara `useQuery` pra listar alunos da turma: `studentsService.list({ turma_id })`. Como a rota agora aceita PROFESSOR + turma_id, retorna a lista.
3. **Professor preenche** as notas em inputs.
4. **Clica "Salvar Tudo"**. O handler chama `saveMutation.mutate(...)` que para cada aluno faz `gradesService.create({ avaliacao_id, aluno_id, valor, professor_id })`.
5. **MS-04 recebe** `POST /v1/grades`. Valida JWT, valida role (PROFESSOR ou ADMIN). Valida body schema (`valor` entre 0 e 10).
6. **Cria registro em `nota`.**
7. **Busca a `avaliacao`** correspondente.
8. **Se tipo for RECUPERACAO**: lógica de substituição de média. **Senão**: chama `recalcularMedia(...)`.
9. **`recalcularMedia`** busca todas as notas (excluindo recuperação), calcula média, faz upsert em `media_bimestral`.
10. **Retorna 201**.
11. **Front recebe**, mostra toast "Notas salvas!". Invalida `['grades']` no queryClient → próxima vez que algum componente listar notas, refetch.

**Onde tem race condition.** Se dois professores lançam notas simultaneamente pro mesmo aluno+disciplina+bimestre, ambos chamam `recalcularMedia` ao mesmo tempo. Podem ler o estado intermediário do outro e gravar uma média inconsistente.

Em produção, usaríamos lock otimista ou pessimista no `media_bimestral`. Pro escopo, aceitamos a janela.

---

## 33. Fluxo de alteração de grade e o comunicado automático

Cenário: admin altera horário de aula de uma turma.

1. **Admin** abre TeacherDetail, clica "Adicionar Horário", preenche e submete.
2. **Front** chama `teachersService.addSchedule(professor_id, { ... })`.
3. **MS-02** recebe `POST /v1/teachers/:id/schedule`. Valida JWT+role (ADMIN). Valida body.
4. **Cria registro em `grade_horaria`.**
5. **Cria registro em `evento_grade`** com `tipo: 'CRIACAO'`, `processado: false`.
6. **Retorna 201**. Front mostra "Horário adicionado!".

**Até aqui, o aluno não foi notificado.** O comunicado ainda vai chegar — só não imediatamente.

7. **(30 segundos depois)** — o **gradeWorker** do MS-05 roda.
8. **Polla** `GET http://ms02:3002/v1/teachers/schedule/changes/recent`.
9. **MS-02** retorna a lista de eventos não processados (incluindo o novo).
10. **gradeWorker** itera. Para cada evento:
   1. Cria `comunicado` (remetente "sistema", título "Novo Horário Adicionado").
   2. Chama `resolveAlunosDaTurma(turma_id)` → faz `fetch(http://ms03:3003/v1/classes/:id)`.
   3. MS-03 retorna a turma com `alocacao_aluno` (lista de aluno_ids).
   4. Cria registros em `destinatario_comunicado` (um por aluno).
   5. Cria registros em `notificacao_externa` (um por aluno, canal EMAIL, status PENDENTE).
   6. Tudo em uma `prisma.$transaction`.
   7. Marca evento como processado (em memória, no `Set` local).
11. **Aluno**, no front, ao recarregar `/communications`, vê o comunicado novo.
12. **(Outro worker)** — notificacaoWorker processaria as `notificacao_externa` enviando email/WhatsApp. (Stub no nosso código — só marca como ENVIADA.)

**Aqui temos um ponto fraco honesto.** O `Set` de processados é em memória. Se o MS-05 reiniciar, ele vai re-processar os eventos antigos do MS-02 — criando comunicados duplicados.

Soluções (não implementadas): marcar `processado = true` no MS-02 (mas isso precisaria de um endpoint), ou tabela `processed_events` no MS-05.

---

## 34. Fluxo de prova final

Cenário: aluno terminou o 4º bimestre com média 5.5 em uma disciplina. Mínima é 7.0. Professor vai aplicar prova final.

1. **Professor** lança a nota da prova final via UI (não tem tela específica no projeto atual, mas a API existe).
2. **MS-04** recebe `POST /v1/grades/prova-final` com `{ aluno_id, disciplina_id, ano_letivo, nota_prova_final }`.
3. **Busca** se já existe registro `prova_final` para (aluno, disciplina, ano).
4. **Se não existe**:
   - Busca todas as `media_bimestral` do aluno na disciplina/ano.
   - Calcula `media_anual = soma / qtde`.
   - **Se `media_anual >= mínima`**: erro 400 "aluno já aprovado, prova final não aplicável".
   - **Senão**: cria `prova_final` com status `EM_CURSO`, `media_anual`.
5. **Calcula** `media_final = (media_anual + nota_prova_final) / 2`.
6. **Determina status**:
   - `media_final >= mínima` → `APROVADO_PF`.
   - Senão → `REPROVADO_NOTA`.
7. **Atualiza** `prova_final` com `nota_prova_final`, `media_final`, `status`.
8. **Retorna o registro**.

Aluno depois vê no boletim: "Prova Final: 6.5 — Aprovado por PF". A informação fica em `prova_final` separado de `media_bimestral` porque são conceitos distintos.

---

## 35. Fluxo de chamada (frequência) e a brecha de auth que corrigimos

Cenário: professor entra na tela `/frequency`.

1. **Frequency.tsx** renderiza `ProfessorFrequency` (subcomponente).
2. **Professor seleciona** turma e disciplina nos dropdowns.
3. **`useQuery`** dispara `studentsService.list({ turma_id, limit: 200 })`.

**Antes do fix**, o MS-01 rejeitava com 403 (só ADMIN podia). Resultado: dropdown vazio, professor não conseguia fazer chamada.

**Depois do fix**, o MS-01 verifica:
```ts
if (role === 'PROFESSOR' && !turma_id) {
  return 403  // sem turma_id, recusa
}
// caso contrário, lista
```

Como o front sempre manda `turma_id`, retorna a lista.

4. **Professor** marca presença/ausência de cada aluno.
5. **Clica "Salvar Frequência"**. Loop chama `studentsService.addFrequency(aluno_id, { disciplina_id, bimestre, data_aula, presente })`.
6. **MS-01** valida, cria registro em `frequencia_*`.
7. **Próxima visualização** do aluno no boletim mostra a frequência atualizada (via `studentsService.frequency(id)`).

Esse fluxo é didático porque mostra:
- Por que rules complexas (PROFESSOR pode listar mas só com filtro) ficam **dentro** do handler, não no `requireRole`.
- Como uma brecha de auth pode quebrar UX inteira sem dar erro visível (silencioso 403, tela vazia).
- A importância de validar com cada role na prática.

---

# Parte VIII — Trade-offs honestos

## 36. O que decidimos sabendo do trade-off

Lista honesta de escolhas e o que pagamos:

| Decisão | Benefício | Custo |
|---|---|---|
| Microsserviços em vez de monolito | Aprendizado, decoupling | Complexidade operacional alta |
| Banco compartilhado em vez de db-per-service | Simplicidade de infra | Acoplamento por schema |
| Polling em vez de mensageria | Sem RabbitMQ/Kafka pra rodar | Latência de até 30s, possível dup |
| JWT em vez de session no banco | Stateless, multi-MS | Não dá pra invalidar token antes do exp |
| Tailwind com semantic layer | Velocidade + organização | Curva de aprendizado da convenção |
| React Query + Zustand (dois state) | Cada um no que é bom | Duas APIs pra aprender |
| Soft delete em alunos | Auditoria, reversibilidade | Queries têm que filtrar `status` |
| Service local no MS-05 acessar MS-02 sem auth | Worker sem ter token de usuário | Endpoint exposto na rede interna |

---

## 37. O que faríamos diferente hoje

Refletindo, se fôssemos começar do zero:

- **Database per service real.** Mesmo MySQL, mas cada MS num schema separado (`ms01_db`, `ms02_db`, etc.). Mantém pureza arquitetural quase sem custo extra.
- **Service-to-service auth.** Token de serviço dedicado pro worker do MS-05, não endpoints abertos.
- **Outbox com marca de processamento persistente.** Coluna `processado` no `evento_grade` que é atualizada por API quando o worker do MS-05 confirma. Resolve o problema da dup ao reiniciar.
- **Logging estruturado.** `pino` (já vem com Fastify) emitindo JSON com `trace-id` cruzando MSs. Hoje cada MS log em formato livre.
- **Health checks reais.** `GET /health` em cada MS, com check de banco. Compose usaria pra `healthcheck:` real.
- **Tests automatizados.** Hoje temos diagnósticos manuais. Em produção, vitest + supertest cobrindo as rotas principais.
- **CI/CD.** GitHub Actions buildando imagens e rodando os testes.

---

## 38. O que precisaria para escalar

Se essa escola virasse uma rede com 100 escolas e 1M alunos:

- **Banco separado por MS** ou **read replicas**. Lendo o boletim de 1M alunos na divulgação satura uma única instância MySQL.
- **Mensageria real (Kafka/RabbitMQ).** Polling de 30s vira pesadelo com volume.
- **Cache.** Redis na frente de queries de leitura quentes (boletim, frequência).
- **CDN para o frontend.** Bundle servido de edge locations.
- **Load balancer** na frente dos MSs com 2+ instâncias cada.
- **Kubernetes** em vez de Docker Compose.
- **Observabilidade**: Prometheus + Grafana + Sentry + distributed tracing (Jaeger/OpenTelemetry).
- **Multi-tenancy**: schema por escola, ou tenant_id em todas as tabelas.

Quando a banca perguntar "isso roda com 1M usuários?" — a resposta honesta: "Não nessa arquitetura. Pra isso a gente precisaria de X, Y, Z. Foi projetado pro contexto de uma escola; pra rede de escolas seria refator significativo."

Maturidade técnica é admitir.

---

# Parte IX — Preparando-se para a apresentação

## 39. Como pensar sobre qualquer pergunta técnica

A pior coisa é decorar respostas. Quando a pergunta muda 5%, você trava.

A melhor estratégia: **sempre estruture a resposta em 3 partes**:

1. **O que** — declare o fato. ("Usamos JWT para autenticação.")
2. **Por quê** — justifique. ("Porque precisamos de auth stateless que funcione em todos os MSs sem compartilhar storage.")
3. **Trade-off** — mostre que você conhece o lado ruim. ("O custo é não poder invalidar tokens antes do exp. Mitigamos com expiração curta de 15 min.")

Quem responde nesses 3 níveis demonstra entendimento, não decoreba.

### Outras boas práticas

- **Se não souber, diga.** "Não sei especificamente esse detalhe, mas posso explicar como descobriria." É infinitamente melhor que inventar.
- **Use exemplos do código.** "Sim, no MS-04 a função `recalcularMedia` faz exatamente isso. Posso mostrar." Concretiza.
- **Faça analogias.** Quando explicar Outbox: "É como uma caixa de saída de email — você 'envia' (escreve na tabela), e um carteiro (worker) coleta e entrega quando puder."
- **Saiba comparar.** "Optamos por X em vez de Y porque..." mostra que você considerou alternativas.

---

## 40. Perguntas que provavelmente vão cair

Para cada uma, está a **abordagem**, não a resposta pronta. Pratique elaborando.

### Sobre arquitetura

**P: Por que microsserviços e não monolito?**
A: Capítulo 3 inteiro. Tem benefícios reais (escala independente, decoupling, falha isolada) e custos reais (complexidade operacional, consistência eventual). No nosso caso, foi parcialmente por requisito acadêmico.

**P: Vocês têm banco compartilhado, isso é correto em microsserviços?**
A: Capítulo 13. Reconheça que a "forma correta" é db-per-service. Justifique pragmaticamente. Mostre o que vocês fizeram pra mitigar (schema por MS).

**P: Como os serviços se comunicam entre si?**
A: Capítulo 12. Dois padrões: síncrono HTTP (MS-05 → MS-03 pra buscar alunos) e assíncrono Outbox/polling (MS-02 → MS-05 pra notificar mudança de grade). Saiba dar exemplo concreto de cada.

**P: O que acontece se o MS-X cair?**
A: Depende qual. Cair o auth-service: ninguém faz login novo, mas quem está logado continua até token expirar. Cair o MS-04: boletim e notas indisponíveis, resto OK. Cair o banco: tudo para. Demonstra que você pensou em modos de falha.

### Sobre tecnologia

**P: Por que Fastify e não Express?**
A: Capítulo 5. Performance, schema validation, plugin system. Express continua sendo escolha válida — não é "errado", é menos moderno.

**P: Por que Prisma e não TypeORM/Sequelize/SQL puro?**
A: Capítulo 6. Schema declarativo, tipos perfeitos, migrations. Para o escopo, mata todas as alternativas.

**P: Por que React e não Vue/Angular?**
A: Capítulo 7. Familiaridade do time, ecossistema, declarativo. Vue seria igualmente válido.

**P: Por que Tailwind?**
A: Capítulo 7. Velocidade + organização via semantic classes em `@layer components`.

### Sobre código

**P: O que é SOLID? Dê exemplos no projeto.**
A: Capítulo 16. SRP no `nota.service.ts`. OCP no `requireRole`. Tenha um exemplo concreto pra cada letra (mesmo que pra L e I sejam fracos — admita).

**P: O que é Outbox Pattern?**
A: Capítulo 14. Persistir o evento na mesma transação que a mudança. Worker consome assíncrono. Exemplo no MS-02 → MS-05.

**P: O que faz aquele bcrypt no login?**
A: Capítulo 9. Hash deliberadamente lento. Compara hash com senha digitada (não compara strings).

**P: Por que JWT em vez de session cookies?**
A: Capítulo 9. Stateless, cada MS valida sozinho. Custo: não dá pra invalidar.

### Sobre segurança

**P: O que impede um usuário comum de chamar uma rota admin?**
A: Capítulo 15. `requireRole` no preHandler do Fastify. Frontend também esconde botões mas é cortesia — segurança real é no back.

**P: Por que dois tokens (access + refresh)?**
A: Capítulo 9. Access curto (15 min) limita estrago em vazamento. Refresh longo (7 dias) evita re-login. Refresh fica menos exposto.

**P: O JWT é seguro de armazenar no localStorage?**
A: Não 100%. Vulnerável a XSS (script malicioso pode ler). Em produção alta-segurança, refresh token em HttpOnly cookie. Pro escopo, localStorage é aceitável.

### Sobre banco

**P: Por que MySQL e não MongoDB?**
A: Capítulo 6. Dados altamente relacionais. JOINs por todo lado.

**P: O que é Decimal e por que vira string no Prisma?**
A: Capítulo 6. MySQL `DECIMAL` é preciso (não tem problemas de floating point). Prisma representa como string para não perder precisão. Solução: `Number(value)` ao operar.

**P: O que é uma migration?**
A: Versão de mudança de schema. Cada alteração (adicionar coluna, criar tabela) vira um arquivo de migration. `prisma migrate dev` aplica.

### Sobre Docker

**P: Por que containerizar?**
A: Capítulo 10. Reprodutibilidade entre máquinas. Empacotar tudo (OS, Node, deps, código) numa imagem.

**P: O que é multi-stage build?**
A: Capítulo 10. Stage 1 instala tudo e compila. Stage 2 copia só o build + runtime deps. Imagem final menor.

**P: O que é `try_files $uri $uri/ /index.html` no nginx?**
A: Capítulo 10. SPA routing. Sem isso, refresh em qualquer rota dá 404.

### Sobre o domínio

**P: Como calcula a média final do aluno?**
A: Capítulo 23. Soma das notas válidas (excluindo recuperação), divide. Recuperação substitui a média se for maior. Prova final é (média_anual + nota_pf) / 2.

**P: O que acontece quando admin altera grade horária?**
A: Capítulo 33. Vira evento na tabela `evento_grade`. Worker do MS-05 polla a cada 30s, gera comunicado e notificações.

**P: Como o aluno vê seu boletim?**
A: Capítulo 31 + service. `GET /v1/grades/:alunoId/boletim` retorna `medias_bimestrais` e `provas_final`. Front agrupa por disciplina e mostra.

---

## 41. Armadilhas e erros comuns ao apresentar

- **Não falar "é simples", "é fácil", "é trivial".** Subestima a banca e empurra a próxima pergunta a ser difícil.
- **Não inventar.** Se não sabe, diga.
- **Não vender o que não fez.** "Implementamos service mesh com Istio" — quando não usaram nada disso — destrói credibilidade ao primeiro questionamento técnico.
- **Não dar resposta de uma palavra.** "Usamos Fastify." Só? Por quê? Em vez de quê?
- **Não fugir do trade-off.** "Sim, esse banco compartilhado tem custos. Aqui vai o que aceitamos e por quê." Madura.
- **Não treinar só uma vez.** Cada um do grupo deve saber explicar todas as partes. Vão perguntar pra qualquer um.

---

# Parte X — Referência rápida

## 42. Glossário técnico

| Termo | Significado |
|---|---|
| **API REST** | Estilo arquitetural onde recursos (alunos, notas) são manipulados via HTTP (GET, POST, PUT, DELETE). |
| **Axios** | Cliente HTTP do JavaScript. Usamos no frontend pra chamar os MSs. |
| **bcrypt** | Algoritmo de hash de senha deliberadamente lento. |
| **Bounded Context** | DDD. Área conceitualmente coesa que vira um microsserviço. |
| **CORS** | Cross-Origin Resource Sharing. Browser bloqueia chamadas entre origens diferentes; servidor deve liberar via headers. |
| **CRUD** | Create, Read, Update, Delete — operações básicas de persistência. |
| **DTO** | Data Transfer Object — objeto que carrega dados entre camadas. Nossas interfaces `*Body` no Fastify. |
| **Idempotente** | Operação que pode ser repetida sem efeito adicional. PUT é idempotente; POST geralmente não. |
| **JWT** | JSON Web Token — token auto-contido com header/payload/signature. |
| **Middleware/Plugin** | Função que roda entre o request e o handler. Ex.: `requireRole`. |
| **Migration** | Arquivo versionado descrevendo mudança de schema do banco. |
| **ORM** | Object-Relational Mapper. Traduz objetos do código para SQL. |
| **Outbox Pattern** | Persistir evento na mesma transação da mudança, processar via worker assíncrono. |
| **Polling** | Pedir periodicamente "tem novidade?" ao invés de receber push. |
| **RBAC** | Role-Based Access Control. Permissão por papel (ADMIN, PROFESSOR, ALUNO). |
| **SPA** | Single-Page Application. Uma só página HTML, JavaScript controla a navegação. |
| **Stateless** | Servidor não guarda estado entre requests. Cada request tem tudo que precisa (ex.: JWT). |
| **Tree-shaking** | Bundler remove código não usado da saída final. |
| **Worker** | Processo em background, separado do servidor HTTP. Ex.: `gradeWorker` do MS-05. |
| **Zustand** | Biblioteca de state management minimalista para React. |

---

## 43. Mapa de portas, URLs e endpoints

| Serviço | Porta local | Endpoint base | Schema próprio |
|---|---|---|---|
| Frontend (nginx) | 80 | http://localhost | — |
| auth-service | 3000 | http://localhost:3000/v1/auth/* | usuario |
| MS-01 Alunos | 3001 | http://localhost:3001/v1/students/* | aluno, frequencia_*, historico |
| MS-02 Professores | 3002 | http://localhost:3002/v1/teachers/* | professor, grade_horaria, evento_grade |
| MS-03 Turmas | 3003 | http://localhost:3003/v1/classes/*, /v1/disciplines/*, /v1/calendar/* | turma, disciplina, calendario_evento, alocacao_aluno |
| MS-04 Notas | 3004 | http://localhost:3004/v1/grades/*, /v1/assessments/* | avaliacao, nota, media_bimestral, prova_final, configuracao_avaliacao |
| MS-05 Comunicação | 3005 | http://localhost:3005/v1/communications/*, /v1/notifications/* | comunicado, destinatario_comunicado, notificacao_externa |

Todos compartilham o mesmo MySQL (`raphaelestrella`) — schemas separados no Prisma.

---

## 44. Comandos úteis

### Subir tudo
```bash
docker-compose up -d --build
```

### Subir só o frontend (após mudança)
```bash
docker-compose up -d --build frontend
```

### Sem cache (quando docker teima em usar build antigo)
```bash
docker-compose build --no-cache <serviço>
docker-compose up -d <serviço>
```

### Ver logs de um serviço
```bash
docker-compose logs -f ms04-notas
```

### Parar tudo
```bash
docker-compose down
```

### Resetar volumes (cuidado, apaga dados se houver volume)
```bash
docker-compose down -v
```

### Type check local (sem build completo)
```bash
cd frontend && npx tsc --noEmit
cd MS01_gestao_de_alunos && npx tsc --noEmit  # idem nos outros
```

### Acessar o banco
```bash
# Se MySQL tiver porta exposta no host:
mysql -h localhost -P 3306 -u root -p raphaelestrella

# Ou via Prisma Studio (em qualquer MS):
cd MS01_gestao_de_alunos && npx prisma studio
```

### Gerar Prisma Client (após mudar schema.prisma)
```bash
cd <MS>
npx prisma generate
```

### Testar uma rota manualmente
```bash
# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"senha123"}'

# Usando o token
curl http://localhost:3001/v1/students \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

# Encerramento

Se chegou até aqui, você tem o modelo mental completo. Releia os capítulos da Parte IX (perguntas) algumas vezes pra praticar o estilo de resposta.

**Lembre-se: a apresentação não é teste de memória, é teste de entendimento.** Se você consegue explicar **por que** uma decisão foi tomada e qual o trade-off envolvido, você está pronto pra qualquer pergunta variante.

Boa apresentação.
