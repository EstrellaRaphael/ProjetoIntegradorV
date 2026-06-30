# Guia Técnico Completo — Sistema de Gestão Escolar
## Projeto Integrador V — SENAC RJ · 2026/1

> **Para quem é este documento?**
> Para qualquer membro do grupo que precise entender — de verdade — tudo que foi construído, por que cada decisão foi tomada, e como responder qualquer pergunta técnica em uma apresentação. Não é preciso ter experiência prévia em programação para entender a maioria das seções.

---

## Sumário

1. [O que o sistema faz (visão de produto)](#1-o-que-o-sistema-faz)
2. [A grande decisão: por que microserviços?](#2-a-grande-decisão-por-que-microserviços)
3. [A stack tecnológica — por que cada ferramenta](#3-a-stack-tecnológica)
4. [O banco de dados — decisões e estrutura](#4-o-banco-de-dados)
5. [Autenticação e segurança — JWT, bcrypt e tokens](#5-autenticação-e-segurança)
6. [O Auth Service — o porteiro do sistema](#6-o-auth-service)
7. [MS-01 — Gestão de Alunos](#7-ms-01--gestão-de-alunos)
8. [MS-02 — Gestão de Professores](#8-ms-02--gestão-de-professores)
9. [MS-03 — Turmas e Disciplinas](#9-ms-03--turmas-e-disciplinas)
10. [MS-04 — Avaliações e Notas](#10-ms-04--avaliações-e-notas)
11. [MS-05 — Comunicação Escolar](#11-ms-05--comunicação-escolar)
12. [Como os serviços conversam entre si](#12-como-os-serviços-conversam-entre-si)
13. [O Frontend — a interface do usuário](#13-o-frontend)
14. [Docker — o que é e por que usamos](#14-docker)
15. [Os trade-offs — o que ganhamos e o que perdemos](#15-os-trade-offs)
16. [Perguntas e respostas para a apresentação](#16-perguntas-e-respostas)

---

## 1. O que o sistema faz

### 1.1 O problema que estamos resolvendo

Uma escola precisa gerenciar muitas coisas ao mesmo tempo: cadastro de alunos, registro de professores, organização de turmas, lançamento de notas, controle de frequência e comunicação entre a administração, professores e alunos. Sem um sistema digital, tudo isso é feito em papel, planilhas espalhadas, e-mails informais — um caos que gera erros, retrabalho e falta de visibilidade.

Nosso sistema centraliza tudo isso em uma aplicação web acessível pelo navegador.

### 1.2 Os três perfis de usuário

O sistema tem três tipos de usuário, cada um com permissões diferentes:

| Perfil | Quem é | O que pode fazer |
|---|---|---|
| **ADMIN** | Direção/secretaria | Tudo: cadastrar alunos e professores, ver todos os dados, configurar o sistema |
| **PROFESSOR** | Professor da escola | Lançar notas e frequência das suas turmas, ver sua grade, enviar comunicados |
| **ALUNO** | Aluno matriculado | Ver seu próprio boletim, sua frequência, comunicados recebidos |

### 1.3 Os módulos do sistema

O sistema é dividido em módulos, cada um resolvendo uma parte do problema:

- **Autenticação** — login, controle de acesso, segurança
- **Alunos** — cadastro, matrícula, histórico escolar
- **Professores** — cadastro, grade horária, substituições
- **Turmas e Disciplinas** — organização do calendário e da grade curricular
- **Avaliações e Notas** — provas, trabalhos, cálculo de médias, prova final
- **Comunicação** — comunicados internos e notificações automáticas

---

## 2. A grande decisão: por que microserviços?

### 2.1 O que são microserviços (explicação simples)

Imagine que você tem uma padaria. Uma maneira de organizar seria ter **um funcionário que faz tudo**: atende o caixa, assa o pão, limpa o salão, faz as entregas. Se esse funcionário adoece, a padaria para. Se tem muita demanda no caixa, o pão queima porque ninguém está tomando conta do forno.

A outra maneira é dividir em **funcionários especializados**: um só no caixa, um só no forno, um só nas entregas. Se o caixa adoece, o pão continua sendo assado. Cada um pode ser treinado e melhorado de forma independente.

Microserviços são a segunda abordagem aplicada ao software. Em vez de um programa gigantesco que faz tudo (chamado de **monolito**), temos vários programas menores, cada um responsável por uma parte do sistema.

### 2.2 Como o projeto se encaixa nessa ideia

Cada integrante do grupo ficou responsável por **um microserviço**:

| Integrante | Serviço | Responsabilidade |
|---|---|---|
| Raphael Estrella | MS-01 | Alunos, frequência, histórico |
| Gabriel Christino | MS-02 | Professores, grade, substituições |
| André Sousa | MS-03 | Turmas, disciplinas, calendário |
| Carlos Eduardo | MS-04 | Avaliações, notas, médias |
| Otávio Brito | MS-05 | Comunicados, notificações |

Isso significa que cada um podia trabalhar no seu serviço sem interferir no trabalho do outro. Enquanto Carlos desenvolvia o cálculo de médias, Otávio podia estar desenvolvendo o sistema de comunicados — sem conflito.

### 2.3 Por que não fizemos um monolito?

Poderíamos ter feito um único projeto com tudo junto. Isso teria sido **mais simples inicialmente**. Mas escolhemos microserviços porque:

1. **Divisão de responsabilidade clara** — cada integrante "dono" de uma parte
2. **Deploy independente** — se mudar algo no MS-01, não precisa redeployar o MS-04
3. **Escalabilidade futura** — se o módulo de alunos receber muito mais tráfego, pode ser escalado separadamente
4. **Aprendizado de arquitetura distribuída** — é a arquitetura usada em empresas reais como Netflix, Uber e iFood
5. **Requisito do projeto** — o Projeto Integrador V pede explicitamente essa arquitetura

### 2.4 O custo de ser microserviços

Nada é de graça. Microserviços trazem complexidade que um monolito não teria:

- **Todos os serviços precisam estar rodando ao mesmo tempo** para o sistema funcionar completo
- **Comunicação pela rede** — quando o MS-05 precisa saber quais alunos estão numa turma, ele tem que fazer uma requisição HTTP para o MS-03. Isso pode falhar, ser lento, etc.
- **Configuração mais trabalhosa** — cada serviço tem seu `.env`, seu Dockerfile, seu banco
- **Debug mais difícil** — se algo dá errado, o erro pode estar em qualquer dos 6 serviços

Aceitamos esses custos conscientemente para os benefícios que listamos acima.

---

## 3. A Stack Tecnológica

Aqui explicamos cada tecnologia usada, por que foi escolhida, e quais eram as alternativas.

### 3.1 Node.js — o motor do backend

**O que é:** Node.js é um ambiente que permite executar JavaScript (a linguagem dos navegadores) no servidor. Antes do Node.js, JavaScript só funcionava dentro do navegador; com ele, você usa a mesma linguagem tanto no frontend quanto no backend.

**Por que usamos:** É a plataforma mais popular para backends de microserviços modernos. É extremamente eficiente para lidar com muitas conexões simultâneas porque usa um modelo **assíncrono** (não-bloqueante): enquanto espera o banco de dados responder, o servidor pode atender outra requisição.

**Versão:** 22 (LTS mais recente em 2026)

**Alternativas que não escolhemos:**
- Java/Spring Boot — muito mais verboso, curva de aprendizado maior
- Python/Django — ótimo, mas menos performático para APIs de alta concorrência
- Go — excelente performance, mas sintaxe nova para o grupo

### 3.2 TypeScript — JavaScript com superpoderes

**O que é:** TypeScript é JavaScript com **tipagem estática**. "Tipagem estática" significa que você declara o tipo de cada variável (texto, número, objeto com tais campos) e o compilador te avisa antes de rodar o código se você estiver usando algo errado.

**Exemplo sem TypeScript (JavaScript puro):**
```javascript
function calcularMedia(notas) {
  return notas.reduce((acc, n) => acc + n.valor, 0) / notas.length
  // Se 'notas' vier como null, isso explode em produção sem aviso prévio
}
```

**Com TypeScript:**
```typescript
interface Nota { valor: number }

function calcularMedia(notas: Nota[]): number {
  return notas.reduce((acc, n) => acc + n.valor, 0) / notas.length
  // Se tentar passar null aqui, o compilador reclama ANTES de rodar
}
```

**Por que usamos:** Projetos sem tipagem acumulam bugs difíceis de encontrar. TypeScript pega boa parte desses bugs na fase de desenvolvimento, não em produção. No nosso caso, foi essencial para lidar com os tipos do Prisma (ORM) que retornam campos `Decimal` como strings — sem tipagem, isso causaria crashes silenciosos.

**Configuração:** `strict: true` — a configuração mais rigorosa, que maximiza a detecção de erros.

**Trade-off:** Adiciona uma etapa de compilação (`tsc`). Em desenvolvimento usamos `tsx` que executa TypeScript diretamente sem compilar. Em produção, compilamos com `tsc` gerando uma pasta `dist/` com JavaScript puro.

### 3.3 Fastify — o framework HTTP

**O que é:** Um framework HTTP é uma biblioteca que facilita criar APIs web. Ele cuida das partes chatas: parsear o JSON que chega, rotear a URL para a função certa, enviar a resposta no formato correto, etc.

**Por que Fastify e não Express?**

Express é o framework mais famoso do Node.js. Usamos Fastify porque:

1. **Performance**: Fastify é até 2-3x mais rápido que Express em benchmarks, graças à serialização JSON otimizada e ao compilador de schemas JSON interno
2. **Schema validation nativo**: Fastify valida automaticamente o body das requisições contra um schema JSON. Se alguém mandar um `valor` de nota como texto em vez de número, o Fastify rejeita antes mesmo de chegar ao seu código
3. **Plugins encapsulados**: O sistema de plugins do Fastify isola funcionalidades de forma limpa. O plugin do Prisma, por exemplo, fica disponível em toda a aplicação via `fastify.prisma`
4. **TypeScript nativo**: Fastify foi reescrito com tipagem TypeScript de primeira classe na versão 5

**Como funciona um handler Fastify:**
```typescript
fastify.post<{ Body: NotaBody }>('/', {
  preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN']),  // autenticação/autorização
  schema: {
    body: {
      type: 'object',
      required: ['valor'],
      properties: {
        valor: { type: 'number', minimum: 0, maximum: 10 }  // validação automática
      }
    }
  }
}, async (request, reply) => {
  // Aqui já sabemos que body.valor é um número entre 0 e 10
  const nota = await fastify.prisma.nota.create({ data: { ... } })
  return reply.code(201).send(nota)
})
```

### 3.4 Prisma — o ORM

**O que é ORM:** ORM significa *Object-Relational Mapping*. É uma camada que traduz entre o mundo dos objetos JavaScript e o mundo das tabelas SQL. Em vez de escrever:

```sql
SELECT * FROM nota WHERE aluno_id = 'abc-123' AND substituida = false
```

Você escreve:
```typescript
const notas = await prisma.nota.findMany({
  where: { aluno_id: 'abc-123', substituida: false }
})
```

O Prisma gera o SQL correto por baixo dos panos.

**Por que Prisma e não SQL puro?**
- **Segurança**: O Prisma protege automaticamente contra SQL Injection (um dos ataques mais comuns a bancos de dados). Com SQL puro, você pode esquecer de escapar uma variável e ter uma brecha de segurança grave
- **Autocomplete e tipagem**: O Prisma gera tipos TypeScript a partir do schema do banco. Você sabe exatamente quais campos existem numa tabela
- **Produtividade**: Operações complexas como JOIN com includes ficam legíveis

**Uma limitação importante — Prisma e campos Decimal:**

O MySQL tem um tipo chamado `DECIMAL` para números com casas decimais precisas (como notas: 8.50, 7.25). O Prisma, por razões de precisão matemática, retorna esses campos **como strings** em JavaScript em vez de números.

Isso causou um bug que tivemos que corrigir no frontend: chamadas como `nota.valor.toFixed(1)` quebravam porque `valor` chegava como `"8.5"` (string) em vez de `8.5` (número). A solução foi sempre envolver com `Number()`:

```typescript
Number(nota.valor).toFixed(1)  // ✅ funciona
nota.valor.toFixed(1)          // ❌ quebra — "8.5".toFixed não existe
```

**Como o Prisma conhece o banco:** Como não temos permissão para criar tabelas (o professor da instituição criou via SQL), usamos `prisma db pull` que **lê o banco existente** e gera o arquivo `schema.prisma` automaticamente. Depois usamos `prisma generate` para gerar o cliente TypeScript.

### 3.5 MySQL — o banco de dados

**O que é:** MySQL é um banco de dados relacional. "Relacional" significa que os dados são organizados em **tabelas** que se relacionam entre si. É o banco de dados mais usado no mundo.

**Por que MySQL:** Imposição da instituição — o servidor remoto é MySQL (MariaDB). Não tivemos escolha aqui.

**MySQL vs PostgreSQL (a comparação clássica):**
- PostgreSQL tem mais recursos avançados (arrays, JSON nativo, extensões)
- MySQL é mais simples e amplamente suportado
- Para nossa aplicação, as diferenças são irrelevantes — fazemos operações padrão

**Limitação crítica do nosso ambiente:** O usuário de banco que temos **não tem permissão de DDL** (não pode criar tabelas, índices, etc.). Isso significa que o Prisma não pode usar `prisma migrate` — o fluxo normal de criação de tabelas automaticamente. As tabelas foram criadas manualmente pelo professor a partir dos nossos scripts SQL.

### 3.6 React — o framework do frontend

**O que é:** React é uma biblioteca JavaScript para construir interfaces de usuário. A ideia central é **componentes**: pedaços reutilizáveis de interface que gerenciam seu próprio estado.

Em vez de manipular o HTML diretamente (como fazíamos com jQuery), você descreve **como a interface deve parecer** dado um estado, e o React cuida de atualizar o DOM quando o estado muda.

**Exemplo simples:**
```tsx
function BotaoPresente({ presente, onClick }: { presente: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={presente ? 'bg-green-500' : 'bg-red-500'}
    >
      {presente ? 'Presente' : 'Ausente'}
    </button>
  )
}
```

Quando `presente` muda, React automaticamente atualiza a cor e o texto do botão.

**Por que React e não Vue/Angular/Svelte?**
- React é o mais usado no mercado (maior empregabilidade)
- Ecossistema enorme (mais bibliotecas, mais tutoriais, mais Stack Overflow)
- Vue e Svelte seriam igualmente válidos; Angular é mais pesado para projetos desse porte

**SPA (Single Page Application):** O frontend é uma SPA. Isso significa que quando você navega entre as páginas (de `/dashboard` para `/students`, por exemplo), o **navegador não faz uma nova requisição ao servidor**. O JavaScript já está carregado e simplesmente troca o conteúdo exibido. A velocidade de navegação é muito maior que um site tradicional.

**Desvantagem da SPA:** O servidor (nginx) precisa estar configurado para redirecionar todas as URLs para o `index.html`, porque a "rota" `/students` não é um arquivo real no servidor — é uma rota do React Router. Sem essa configuração, atualizar a página em qualquer rota diferente de `/` retorna 404. Corrigimos isso com o arquivo `frontend/nginx.conf`.

### 3.7 Vite — o bundler

**O que é:** Um "bundler" pega todos os seus arquivos TypeScript, CSS, imagens, etc., e os empacota em arquivos otimizados para o navegador. O Vite é o bundler mais moderno e rápido disponível.

**Por que não Create React App (CRA)?** O CRA era o padrão por anos, mas está obsoleto — sem manutenção desde 2023. O Vite é 10-100x mais rápido na inicialização do servidor de desenvolvimento e no build.

**O que o Vite faz no desenvolvimento:** Usa ES Modules nativos do navegador — não precisa empacotar tudo antes de exibir. Apenas transforma o arquivo que você editou, então as atualizações aparecem em frações de segundo (Hot Module Replacement).

**O que faz no build para produção:** Usa Rollup por baixo para criar arquivos minificados e otimizados — o `dist/` que é copiado para dentro do nginx.

### 3.8 TanStack Query — gerenciamento de dados assíncronos

**O problema que resolve:** Toda vez que você precisa buscar dados de uma API no React, você precisa lidar com: estado de carregamento (`isLoading`), estado de erro (`isError`), cache dos dados, quando re-buscar, invalidar o cache quando algo muda. Sem uma biblioteca, esse código se repete em todo componente.

**Como funciona:**
```typescript
const { data: alunos, isLoading } = useQuery({
  queryKey: ['students'],           // chave única para esse dado
  queryFn: () => studentsService.list().then(r => r.data),
})

// Quando salvar um aluno:
const mutation = useMutation({
  mutationFn: (data) => studentsService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] })  // limpa o cache → re-busca
    toast.success('Aluno cadastrado!')
  }
})
```

**Por que é melhor que `useEffect` + `useState`:**
- **Cache automático**: a lista de alunos não é rebuscada se você voltar para a mesma tela em menos de 5 minutos
- **Deduplicação**: se dois componentes pedem os mesmos dados, só uma requisição HTTP é feita
- **Re-fetch inteligente**: rebusca automaticamente quando a janela volta a ter foco
- **Menos código**: elimina centenas de linhas de código repetitivo

### 3.9 Zustand — estado global

**O problema:** O token JWT do usuário logado precisa estar disponível em todo o frontend — no Topbar (para mostrar o nome), em cada requisição Axios (para enviar no header), em cada página (para saber as permissões). Como compartilhar essa informação entre todos os componentes?

**Solução**: Zustand é uma biblioteca de estado global minimalista. Cria uma "store" acessível de qualquer componente:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        const user = parseJWT(accessToken)  // decodifica o JWT para extrair role, etc.
        set({ accessToken, refreshToken, user, isAuthenticated: true })
      },

      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }  // persiste no localStorage automaticamente
  )
)
```

**`persist` middleware**: salva automaticamente os tokens no `localStorage` do navegador. Isso significa que se você fechar o navegador e abrir de novo, continua logado (até o refresh token expirar em 7 dias).

**Por que Zustand e não Redux?** Redux é poderoso mas extremamente verboso para casos simples. Para gerenciar apenas autenticação, Zustand é mais que suficiente e requer 10x menos código.

### 3.10 React Router v7 — navegação

**O que faz:** Gerencia a navegação dentro da SPA. Quando você clica em "Alunos" na sidebar, o React Router intercepta a navegação, impede que o navegador carregue uma nova página, e renderiza o componente correto para `/students`.

**O guard `RequireAuth`:**
```typescript
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

Esse componente envolve todas as rotas protegidas. Se o usuário não está autenticado e tenta acessar `/dashboard` diretamente na URL, é redirecionado para `/login` instantaneamente, sem nem chegar ao servidor.

### 3.11 Tailwind CSS — estilização

**O que é:** Tailwind é um framework CSS que fornece utilitários atômicos. Em vez de escrever CSS separado, você aplica classes diretamente no HTML/JSX:

```html
<!-- CSS tradicional: você escreve .btn-primary { background: blue; padding: 8px; ... } -->
<button class="btn-primary">Salvar</button>

<!-- Tailwind: as classes JÁ são o CSS -->
<button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Salvar</button>
```

**Por que Tailwind:** Elimina a necessidade de criar e nomear classes CSS. O resultado final é menor porque o Tailwind remove automaticamente (tree-shake) todas as classes não usadas no build final.

**Trade-off:** O HTML fica mais "verboso" com muitas classes. Compensamos criando classes abstratas no `globals.css` (como `btn-primary`, `card-padded`) que agrupam as classes Tailwind mais usadas.

### 3.12 Axios — cliente HTTP

**O que é:** Biblioteca para fazer requisições HTTP no browser. Embora o browser já tenha o `fetch` nativo, o Axios oferece:

- **Interceptors**: código que roda automaticamente em toda requisição/resposta. Usamos para:
  - Injetar o `Authorization: Bearer <token>` em toda requisição
  - Detectar erros 401 e tentar renovar o token automaticamente antes de redirecionar para login
- **Configuração de base URL**: `ms01.get('/v1/students')` automaticamente vira `http://localhost:3001/v1/students`
- **Cancelamento de requisição**: mais fácil que com `fetch`

---

## 4. O Banco de Dados

### 4.1 Um banco por serviço (database-per-service)

Em microserviços, o padrão recomendado é cada serviço ter seu próprio banco de dados isolado. Em produção real, isso seria um servidor MySQL diferente para cada serviço. No nosso caso, por limitação do ambiente acadêmico, temos **um servidor MySQL com schemas separados** (um banco por serviço dentro do mesmo servidor).

| Serviço | Schema |
|---|---|
| Auth + MS-01 | `20261_prjint5_raphaelestrella` |
| MS-02 | `20261_prjint5_gabrielsantos` |
| MS-03 | `20261_prjint5_andrebezerra` |
| MS-04 | `20261_prjint5_carlossoares` |
| MS-05 | `20261_prjint5_otaviosilva` |

**Por que Auth e MS-01 compartilham o mesmo schema?** Porque o servidor da instituição não permite criar novos schemas — há um schema por aluno. O Raphael ficou responsável por tanto o Auth quanto o MS-01. A tabela `usuario` (do Auth) e as tabelas de alunos (MS-01) coexistem no mesmo schema. Isso é uma **limitação do ambiente**, não uma decisão de design ideal.

### 4.2 O problema de não ter FK entre schemas

No MySQL, não é possível criar uma Foreign Key (chave estrangeira que garante integridade referencial) entre tabelas de schemas diferentes. Quando o Auth Service armazena `referencia_id` apontando para um professor no schema do MS-02, não há nenhum constraint no banco garantindo que esse ID existe.

Isso significa que a **integridade referencial é responsabilidade da aplicação**, não do banco. É um trade-off que aceitamos por limitação do ambiente.

### 4.3 Tipos importantes do MySQL que usamos

**UUID vs auto-increment:** Todos os IDs do sistema são UUIDs (ex: `a3f7b2c1-4d8e-4f9a-b3c2-1e5d7f8a9b0c`). Poderíamos ter usado números auto-incrementáveis (1, 2, 3...). UUIDs são preferidos em microserviços porque:
- São únicos globalmente — não há colisão entre serviços diferentes
- Podem ser gerados pelo código antes de salvar no banco, sem round-trip
- Não expõem o volume de dados (um invasor não sabe quantos alunos tem pelo ID)

**DECIMAL vs FLOAT:** Notas são armazenadas como `DECIMAL(5,2)` (máximo 999.99, com 2 casas decimais). Nunca como `FLOAT`. Isso porque `FLOAT` tem imprecisão: `0.1 + 0.2` em float pode dar `0.30000000000000004`. Para notas e médias, precisamos de precisão exata.

**ENUM:** Campos como `role` (`ADMIN`, `PROFESSOR`, `ALUNO`) e tipo de avaliação (`PROVA`, `TRABALHO`, `RECUPERACAO`, `PROVA_FINAL`) são armazenados como ENUM no MySQL. Isso garante que só valores válidos entrem no banco.

### 4.4 Soft delete (exclusão lógica)

O sistema não apaga fisicamente registros de alunos e professores. Em vez disso, tem um campo `ativo: Boolean`. Quando um aluno é "excluído", o sistema apenas seta `ativo = false`.

**Por que:** Histórico e auditoria. Se um aluno saiu da escola, seus registros de frequência e notas dos anos anteriores ainda precisam existir. Apagar o registro físico quebraria toda essa relação.

---

## 5. Autenticação e Segurança

Essa seção explica como garantimos que apenas pessoas autorizadas acessam o sistema, e como as senhas são protegidas.

### 5.1 O problema de segurança fundamental

Quando um usuário faz login, como cada microserviço sabe que uma requisição que chega é legítima? O MS-04 recebe um pedido para lançar uma nota — como ele sabe que quem mandou é mesmo um professor autorizado, e não alguém fingindo ser um professor?

A resposta é **JWT (JSON Web Token)**.

### 5.2 O que é um JWT

Um JWT é um texto codificado que contém informações verificáveis. Parece assim:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMtMTIzIiwicm9sZSI6IlBST0ZFU1NPUiIsImlhdCI6MTc0OTEzMjgwMCwiZXhwIjoxNzQ5MTMzNzAwfQ.k5Vz8k2mQJXnR4r2vSxLsOPtM9PqHlZcbYfGuW1tR8E
```

Parece lixo, mas na verdade são 3 partes separadas por pontos:

1. **Header** (algoritmo usado): `{"alg": "HS256", "typ": "JWT"}`
2. **Payload** (dados): `{"sub": "abc-123", "role": "PROFESSOR", "iat": 1749132800, "exp": 1749133700}`
3. **Signature** (assinatura): resultado de assinar o header+payload com uma chave secreta

**A mágica:** Qualquer serviço que conhece a chave secreta (`JWT_SECRET`) pode **verificar** que a assinatura é válida — ou seja, que o token não foi fabricado ou modificado. Não é preciso consultar o banco de dados a cada requisição.

**O payload do nosso JWT:**
```json
{
  "sub": "uuid-do-usuario",
  "role": "PROFESSOR",
  "referenciaId": "uuid-do-professor-no-ms02",
  "turmaId": null,
  "iat": 1749132800,
  "exp": 1749133700
}
```

- `sub` (subject) — ID do usuário na tabela `usuario`
- `role` — nível de acesso
- `referenciaId` — ID do aluno ou professor no microserviço correspondente
- `turmaId` — para alunos, a turma atual (para filtrar dados automaticamente)
- `iat` (issued at) — quando foi emitido (timestamp Unix)
- `exp` (expiration) — quando expira

### 5.3 Access Token vs Refresh Token

Usamos dois tipos de token:

| Token | Duração | Segredo | Finalidade |
|---|---|---|---|
| **Access Token** | 15 minutos | `JWT_SECRET` | Autoriza cada requisição às APIs |
| **Refresh Token** | 7 dias | `JWT_REFRESH_SECRET` (diferente!) | Obtém um novo access token sem pedir senha de novo |

**O fluxo completo:**

```
1. Usuário digita email+senha → POST /v1/auth/login
2. Auth Service verifica → retorna accessToken (15min) + refreshToken (7 dias)
3. Frontend salva os dois tokens no localStorage
4. Para cada requisição: frontend manda o accessToken no header
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
5. Cada microserviço verifica a assinatura do token com JWT_SECRET
   → Se válido: processa a requisição
   → Se expirado: retorna 401
6. Frontend intercepta o 401 → usa o refreshToken para pedir novo accessToken
   POST /v1/auth/refresh { refreshToken: "..." }
7. Auth Service valida o refreshToken → retorna novo accessToken
8. Frontend refaz a requisição original com o novo token
9. Se o refreshToken também expirou (7 dias) → faz logout e pede login novamente
```

**Por que não fazer o access token durar mais?** Se alguém roubar seu access token (por exemplo, em um ataque XSS), eles têm acesso por apenas 15 minutos. Com um token de 7 dias, teriam acesso por muito mais tempo.

**Por que os segredos são diferentes?** Para que um refresh token não possa ser usado no lugar de um access token (e vice-versa). São chaves criptográficas diferentes.

### 5.4 Como as senhas são protegidas (bcrypt)

Nunca armazenamos senhas em texto puro. Isso seria catastrófico — qualquer pessoa com acesso ao banco teria as senhas de todos.

Usamos **bcrypt** com custo 10:

```typescript
// Ao criar o usuário (ou trocar a senha):
const hash = await bcrypt.hash('Admin@123', 10)
// Resultado: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LFiyFb0YTdy"
// Esse hash é salvo no banco, nunca a senha original

// No login:
const senhaCorreta = await bcrypt.compare(senhaDigitada, hashDosBanco)
// Retorna true ou false
```

**Por que bcrypt?** O hash de bcrypt é deliberadamente **lento** (custo 10 = 1024 iterações). Para um humano fazendo login, é instantâneo (millisegundos). Mas para um atacante que tem o banco e quer testar milhões de senhas ("ataque de força bruta"), seria demorar anos.

**Uma propriedade importante:** Dois hashes da mesma senha são diferentes. `bcrypt.hash('Admin@123', 10)` rodado duas vezes gera dois hashes diferentes porque o bcrypt adiciona um "salt" aleatório. Isso impede ataques de "rainbow table" (tabela pré-calculada de hash → senha).

### 5.5 Autorização por role (RBAC)

Cada microserviço tem um decorator `requireRole` que verifica o token e garante que apenas os perfis corretos acessam cada endpoint:

```typescript
// Apenas ADMIN e PROFESSOR podem lançar notas
fastify.post('/grades', {
  preHandler: fastify.requireRole(['PROFESSOR', 'ADMIN'])
}, async (request, reply) => { ... })

// ALUNO só pode ver o próprio boletim
fastify.get('/:alunoId/boletim', {
  preHandler: fastify.authenticate  // qualquer um autenticado pode tentar
}, async (request, reply) => {
  if (request.user.role === 'ALUNO' && request.user.referenciaId !== alunoId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }
  // ...
})
```

---

## 6. O Auth Service

O Auth Service (porta 3000) é o "porteiro" do sistema. Ele não pertence a nenhum microserviço de negócio específico — é infraestrutura compartilhada.

### 6.1 O que ele faz

- Recebe login (email + senha)
- Verifica no banco se o usuário existe e se a senha está correta (bcrypt.compare)
- Para alunos: busca a `turma_atual_id` para incluir no token
- Emite o accessToken (15min) e o refreshToken (7 dias)
- Endpoint `/refresh` para renovar o access token
- Endpoint `/validate` utilitário (cada MS valida o JWT localmente com o `JWT_SECRET` compartilhado)

### 6.2 Por que os microserviços não consultam o Auth a cada requisição

Quando o MS-04 recebe uma requisição com um token, ele **não liga para o Auth Service para perguntar "esse token é válido?"**. Ele mesmo verifica a assinatura usando o `JWT_SECRET`.

Isso é fundamental para a performance e disponibilidade. Imagina se o Auth Service ficar fora do ar — toda a aplicação pararia se cada microserviço dependesse dele para validar tokens.

Com JWT, cada serviço é autônomo na validação. O Auth Service só é necessário para **emitir** tokens (login) e **renovar** (refresh).

### 6.3 A relação com o MS-01

Por limitação do banco (o Auth compartilha o schema do MS-01), quando um aluno faz login, o Auth Service consegue fazer um JOIN entre `usuario` e `aluno` para incluir o `turma_atual_id` no token. Isso evita que o frontend precise fazer uma chamada extra ao MS-01 apenas para saber a turma do aluno.

---

## 7. MS-01 — Gestão de Alunos

**Responsável:** Raphael Estrella | **Porta:** 3001

### 7.1 O que gerencia

- CRUD completo de alunos (criar, ler, atualizar, desativar)
- Registro de presença/falta (frequência)
- Consulta consolidada de frequência por disciplina e bimestre
- Override de frequência (decisão administrativa)
- Histórico escolar (resultados dos anos anteriores)

### 7.2 As tabelas do banco

**`aluno`** — Dados cadastrais do aluno:
- Identificação: nome, CPF, email, data de nascimento
- Contato: telefone
- Endereço: CEP, logradouro, bairro, cidade, UF
- Vínculo: `turma_atual_id` (referência lógica ao MS-03)
- `ativo`: soft delete

**`registro_frequencia`** — Uma linha por aula por aluno:
- Quem estava: `aluno_id`
- Em qual disciplina: `disciplina_id`
- Em qual data: `data_aula`
- Estava presente: `presente` (boolean)
- Em qual bimestre: `bimestre`

**`frequencia_consolidada`** — Resumo calculado automaticamente:
- Total de aulas, total de presenças, percentual
- Uma linha por aluno × disciplina × bimestre
- Atualizada toda vez que uma presença é registrada

**`override_frequencia`** — Decisão administrativa que altera a frequência calculada com justificativa formal.

**`historico_escolar`** e **`resultado_disciplina`** — Dados imutáveis de anos letivos anteriores.

### 7.3 O cálculo de frequência

A cada novo registro de presença:
1. O POST `/students/:id/frequency` salva o `registro_frequencia`
2. Imediatamente chama `recalcularFrequencia()` (service layer)
3. O service busca todos os registros daquele aluno + disciplina + bimestre
4. Conta total de aulas e total de presenças
5. Calcula `percentual = (total_presencas / total_aulas) * 100`
6. Faz UPSERT na `frequencia_consolidada` (cria se não existe, atualiza se existe)

A frequência mínima é 75% (constante `FREQUENCIA_MINIMA_PERCENTUAL = 75` no código).

### 7.4 A regra de acesso do aluno

Um aluno só pode ver sua própria frequência e seu próprio histórico. O código verifica:
```typescript
if (role === 'ALUNO' && referenciaId !== params.id) {
  return reply.code(403).send({ error: 'Acesso negado' })
}
```
`referenciaId` vem do JWT — é o `id` do aluno na tabela `aluno`. Esse valor é comparado com o `id` da URL solicitada.

### 7.5 Listagem para PROFESSOR — recorte obrigatório por turma

O endpoint `GET /v1/students` historicamente era exclusivo do ADMIN. Como o portal do professor precisa carregar a lista de alunos de uma turma para fazer a chamada de frequência e para lançar notas, o handler passou a aceitar tokens PROFESSOR — **desde que a query inclua `turma_id`**:

```typescript
if (role === 'PROFESSOR' && !turma_id) {
  return reply.code(403).send({ error: 'Professor deve filtrar por turma_id' })
}
```

O ADMIN continua podendo listar sem restrição; o ALUNO segue bloqueado nessa rota (ele consulta seu próprio cadastro via `GET /v1/students/me` ou `GET /v1/students/:id`). Esse desenho garante que o professor enxergue apenas o recorte das suas turmas, sem expor a base completa.

---

## 8. MS-02 — Gestão de Professores

**Responsável:** Gabriel Christino | **Porta:** 3002

### 8.1 O que gerencia

- CRUD de professores
- Grade horária (horários de aulas por professor)
- Registro de substituições (quando um professor substitui outro)
- Outbox de eventos (para notificar o MS-05 sobre mudanças na grade)

### 8.2 A grade horária

A grade horária é a tabela de horários de aulas de cada professor. É organizada por:
- Dia da semana (SEGUNDA, TERÇA, ..., SEXTA)
- Horário de início e fim
- Turma e disciplina que será lecionada
- Bimestre de vigência

**O Outbox Pattern:** Quando uma entrada na grade horária é criada ou modificada, o MS-02 insere um registro na tabela `evento_grade` com `processado = false`. O MS-05 tem um worker que periodicamente lê essa tabela e cria comunicados automáticos para os alunos afetados.

### 8.3 Por que Outbox Pattern e não chamada direta?

Poderíamos ter o MS-02 fazer uma requisição HTTP direta ao MS-05 ao modificar a grade. O problema: e se o MS-05 estiver fora do ar naquele momento? A modificação da grade seria perdida.

Com o Outbox Pattern:
- MS-02 salva na mesma transação de banco: grade alterada + evento pendente
- Se o MS-05 estiver fora do ar, não importa — o evento fica guardado no banco
- Quando o MS-05 voltar, o worker processa todos os eventos pendentes

Isso é chamado de **comunicação assíncrona garantida**.

---

## 9. MS-03 — Turmas e Disciplinas

**Responsável:** André Sousa | **Porta:** 3003

### 9.1 O que gerencia

- CRUD de disciplinas (Matemática, Português, etc.)
- Calendário escolar (feriados, eventos, períodos de prova)
- CRUD de turmas (3A, 2B, etc.)
- Alocação de professores nas turmas (`alocacao_professor`)
- Alocação de alunos nas turmas (`alocacao_aluno`)

### 9.2 Por que MS-03 existe?

MS-03 é o "núcleo organizacional" — todos os outros serviços dependem das entidades que ele gerencia. Para lançar uma nota, precisa existir uma avaliação, que pertence a uma disciplina e turma. Para registrar frequência, precisa existir um vínculo aluno-turma-disciplina. Para criar comunicados por turma, precisa saber quais alunos estão naquela turma.

Isso significa que MS-03 é o serviço que mais é consultado por outros serviços.

### 9.3 O calendário escolar

Eventos do calendário têm tipos definidos:
- `AULA` — dia normal de aula
- `FERIADO` — sem aula
- `RECESSO` — recesso escolar
- `EVENTO` — evento especial (feira de ciências, formatura, etc.)
- `PROVA` — período de avaliações

---

## 10. MS-04 — Avaliações e Notas

**Responsável:** Carlos Eduardo | **Porta:** 3004

### 10.1 O que gerencia

É o "motor de avaliação acadêmica" — parte mais complexa do sistema em termos de regras de negócio.

- Avaliações: provas, trabalhos, recuperações, prova final
- Lançamento de notas
- Cálculo automático de médias bimestrais
- Lógica de recuperação (nota maior substitui média)
- Lógica de prova final
- Configuração da média mínima de aprovação (padrão: 6,0)

### 10.2 O fluxo de uma nota

Quando um professor lança uma nota (`POST /v1/grades`):

1. Cria o registro de `nota` na tabela
2. Busca os dados da avaliação para saber o tipo, disciplina, bimestre, ano
3. Se for `RECUPERACAO`:
   - Busca a `media_bimestral` daquele aluno/disciplina/bimestre
   - Se a nota da recuperação for maior que a média bimestral, substitui
4. Se for qualquer outro tipo (`PROVA`, `TRABALHO`):
   - Chama `recalcularMedia()` do service layer
   - O service busca todas as notas não-substituídas daquele aluno/disciplina/bimestre/ano
   - Exclui avaliações do tipo `RECUPERACAO` do cálculo
   - Calcula média simples: `soma_das_notas / quantidade_de_notas`
   - Faz UPSERT na `media_bimestral`

### 10.3 O service layer (separação de responsabilidades)

A lógica de cálculo de média está isolada no arquivo `services/nota.service.ts`, não dentro da rota. Isso é princípio **SRP (Single Responsibility Principle)** — cada módulo tem uma única responsabilidade.

Benefícios:
- A lógica pode ser reutilizada em diferentes rotas (criação e edição de nota usam o mesmo `recalcularMedia`)
- É mais fácil testar unitariamente (testa-se o service isolado, sem HTTP)
- Fica mais claro onde cada coisa está

### 10.4 A prova final

A prova final é lançada via `POST /v1/grades/prova-final`. O fluxo:
1. Verifica se o aluno tem médias bimestrais para aquela disciplina
2. Calcula a média anual (média das médias bimestrais)
3. Verifica se o aluno está na faixa de prova final (abaixo da média mínima, mas acima do limite de reprovação por nota)
4. Salva a nota da prova final
5. Calcula a `media_final = (media_anual + nota_prova_final) / 2`
6. Determina status: `APROVADO_PF` ou `REPROVADO_NOTA`

### 10.5 O campo Decimal e o problema no frontend

As médias e notas são armazenadas como `DECIMAL(5,2)` no MySQL. O Prisma retorna esses campos como **strings JavaScript** para evitar imprecisão numérica de ponto flutuante.

Isso causou o bug `e.valor.toFixed is not a function` no frontend — o código tentava chamar `.toFixed()` (método de Number) em uma string. A correção foi envolver todos esses campos com `Number()` antes de operar:

```typescript
Number(nota.valor).toFixed(1)  // ✅
```

E tipamos os campos como `string | number` no TypeScript para refletir essa realidade.

### 10.6 A configuração de média mínima

A média mínima de aprovação é configurável pelo ADMIN via UI (Settings). O valor padrão é 6,0 mas pode ser alterado. Cada alteração cria um novo registro em `configuracao_avaliacao` com `ativa = true`, desativando o anterior. Isso mantém **histórico de todas as configurações** — sabe-se quando mudou e quem mudou.

---

## 11. MS-05 — Comunicação Escolar

**Responsável:** Otávio Brito | **Porta:** 3005

### 11.1 O que gerencia

- Comunicados internos (do admin para professores/alunos/todos)
- Controle de leitura por destinatário
- Notificações externas (e-mail/WhatsApp — em modo mock)
- Workers assíncronos que monitoram eventos dos outros serviços

### 11.2 Os destinatários de um comunicado

Quando o admin cria um comunicado, ele escolhe:
- `GERAL` — todos os usuários do sistema
- `TODOS_PROFESSORES` — apenas professores
- `TURMA_ESPECIFICA` — apenas alunos de uma turma
- `LISTA_MANUAL` — IDs específicos

Para `TURMA_ESPECIFICA`, o MS-05 precisa saber quais alunos estão naquela turma. Ele faz uma chamada HTTP ao MS-03:

```typescript
async function resolveAlunosDaTurma(turmaId: string): Promise<string[]> {
  const res = await fetch(`${ms03Url}/v1/classes/${turmaId}`)
  const turma = await res.json()
  return turma.alocacao_aluno.map(a => a.aluno_id)
}
```

Isso é **comunicação síncrona entre serviços** — MS-05 espera a resposta do MS-03 para continuar.

### 11.3 Os workers assíncronos

O MS-05 tem dois workers que executam a cada 30 segundos:

**gradeWorker:** Monitora a tabela `evento_grade` do MS-02. Para cada evento não processado, cria um comunicado automático: "Novo horário de aula adicionado" ou "Horário alterado".

**notificacaoWorker:** Processa a fila `notificacao_externa`. Tenta enviar e-mails e WhatsApp. Em produção real, integraria com um serviço SMTP e a API do WhatsApp Business. Em desenvolvimento, os envios são **mock** (simulados) — imprime no console o que seria enviado.

### 11.4 A tabela de leitura por destinatário

Cada comunicado tem uma tabela `destinatario_comunicado` com uma linha por destinatário, incluindo o campo `lido`. Quando um aluno clica num comunicado no frontend, o sistema marca aquela linha como `lido = true` e atualiza `lido_em` com o timestamp.

O badge de "não lidos" na Topbar conta quantas linhas dessa tabela têm `lido = false` para o usuário atual.

---

## 12. Como os Serviços Conversam Entre Si

### 12.1 Comunicação síncrona (REST HTTP)

Alguns serviços precisam de resposta imediata de outros:

| Quem chama | Quem responde | Por quê |
|---|---|---|
| MS-05 | MS-03 | Para saber quais alunos estão numa turma ao criar comunicado |
| MS-05 | MS-02 | Para listar todos os professores ao criar comunicado TODOS_PROFESSORES |
| Frontend | Auth Service | Login e refresh de token |
| Frontend | MS-01 a MS-05 | Todas as operações CRUD |

**Problema da comunicação síncrona:** Se o MS-03 estiver fora do ar quando o MS-05 tentar criar um comunicado para uma turma, a operação falha. O código tem um `try/catch` que retorna uma lista vazia nesses casos — degradando graciosamente em vez de quebrar com erro 500.

### 12.2 Comunicação assíncrona (Outbox Pattern)

Para situações onde a resposta imediata não é necessária — como notificar alunos sobre mudanças de grade — usamos o Outbox Pattern:

```
MS-02 (ao modificar grade):
  1. UPDATE grade_horaria SET ... (em transação)
  2. INSERT INTO evento_grade (tipo, ..., processado=false) (mesma transação)

MS-05 (worker, a cada 30s):
  3. SELECT * FROM evento_grade WHERE processado = false
  4. Para cada evento: cria comunicado + marca evento.processado = true
```

Esse padrão garante que o evento nunca se perde, mesmo que MS-05 esteja temporariamente indisponível.

### 12.3 Por que não usamos RabbitMQ ou Kafka?

Em sistemas de produção maiores, comunicação assíncrona entre serviços geralmente usa uma fila de mensagens como **RabbitMQ** ou **Kafka**. Não usamos porque:

1. **Complexidade operacional**: exigiria mais um servidor para manter
2. **Curva de aprendizado**: adicionaria horas de estudo ao projeto
3. **Escala**: para o volume de dados da nossa aplicação, o polling a cada 30 segundos é mais que suficiente
4. **Ambiente acadêmico**: o servidor da instituição não teria essa infraestrutura

O Outbox Pattern com polling é uma alternativa simples e funcional para volumes baixos.

---

## 13. O Frontend

### 13.1 Arquitetura geral

O frontend é uma **Single Page Application** (SPA) construída em React. Toda a lógica de navegação acontece no JavaScript do browser — o servidor (nginx) serve apenas o `index.html` e os arquivos estáticos (JS, CSS, imagens).

```
Usuário acessa localhost → nginx serve index.html
                                     ↓
                              React carrega
                                     ↓
                     React Router lê a URL atual
                                     ↓
                    Renderiza o componente correto
                                     ↓
                 Componente faz requests ao backend
                           (MS-01 a MS-05)
```

### 13.2 Estrutura de pastas do frontend

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx     ← Estrutura geral: sidebar + topbar + conteúdo
│   │   ├── Sidebar.tsx       ← Menu lateral (muda conforme o role do usuário)
│   │   └── Topbar.tsx        ← Barra superior: nome do usuário, sino, avatar
│   └── ui/
│       ├── Modal.tsx          ← Modal reutilizável
│       ├── ConfirmDialog.tsx  ← Diálogo de confirmação ("Tem certeza?")
│       ├── EmptyState.tsx     ← Estado vazio padronizado
│       ├── Pagination.tsx     ← Componente de paginação
│       ├── Field.tsx          ← Par label + valor para telas de detalhe
│       ├── GradeBadge.tsx     ← Badge colorido por faixa de nota (≥7 verde, ≥5 amarelo, <5 vermelho)
│       ├── StatusBadge.tsx    ← Badge de status do aluno (ATIVO/INATIVO/TRANSFERIDO)
│       └── TabNav.tsx         ← Navegação por abas usada em telas de detalhe
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard/
│   │   ├── index.tsx          ← Escolhe qual dashboard renderizar pelo role
│   │   ├── AdminDashboard.tsx
│   │   ├── ProfessorDashboard.tsx
│   │   └── AlunoDashboard.tsx
│   ├── students/
│   │   ├── StudentList.tsx
│   │   ├── StudentDetail.tsx
│   │   └── StudentForm.tsx
│   ├── teachers/
│   ├── classes/
│   ├── disciplines/
│   ├── calendar/
│   ├── assessments/
│   ├── grades/
│   │   ├── GradeLaunch.tsx   ← Professor lança notas em lote
│   │   ├── Boletim.tsx       ← Aluno vê boletim
│   │   └── Frequency.tsx     ← Professor registra / Aluno consulta
│   ├── communications/
│   ├── settings/
│   └── errors/
│
├── services/
│   ├── httpClient.ts           ← Factory de Axios (1 client por MS) + JWT + refresh 401
│   ├── authService.ts          ← login, refresh, validate
│   ├── studentsService.ts      ← MS-01
│   ├── teachersService.ts      ← MS-02
│   ├── classesService.ts       ← MS-03 turmas
│   ├── disciplinesService.ts   ← MS-03 disciplinas
│   ├── calendarService.ts      ← MS-03 calendário
│   ├── assessmentsService.ts   ← MS-04 avaliações
│   ├── gradesService.ts        ← MS-04 notas / boletim / prova final
│   ├── communicationsService.ts ← MS-05
│   └── api.ts                  ← Barrel re-export (preserva imports antigos)
│
├── utils/
│   └── formatters.ts           ← formatDate, formatGrade, getInitials (utilitários compartilhados)
│
├── store/
│   └── authStore.ts           ← Estado global de autenticação (Zustand)
│                                 (com onRehydrateStorage que volta a parsear o JWT
│                                  ao carregar a página — evita logout falso no F5)
│
├── types/
│   └── index.ts               ← Interfaces TypeScript de todos os domínios
│
└── router.tsx                 ← Definição de rotas + guard RequireAuth
```

> **Refactor recente — services e utils:** o que antes era um `services/api.ts` monolítico de ~160 linhas foi quebrado em uma factory (`httpClient.ts`) mais um arquivo por domínio (`*Service.ts`). O `api.ts` continua existindo apenas como *barrel re-export*, então todos os imports antigos do tipo `import { studentsService } from '../../services/api'` continuam funcionando. Funções que estavam duplicadas em várias páginas (`getInitials`, `formatDate`, badges de nota/status, componentes `Field` locais) foram consolidadas em `utils/formatters.ts` e em `components/ui/` (Field, GradeBadge, StatusBadge, TabNav).

### 13.3 Como o login funciona (passo a passo)

1. Usuário digita email e senha em `Login.tsx`
2. Clica em "Entrar" → chama `authService.login(email, senha)`
3. Axios envia `POST http://localhost:3000/v1/auth/login`
4. Auth Service valida → retorna `{ accessToken, refreshToken, role }`
5. Frontend chama `useAuthStore.setTokens(accessToken, refreshToken)`
6. O Zustand:
   - Decodifica o JWT com `parseJWT()` (base64 decode do payload)
   - Salva `user` (com `sub`, `role`, `referenciaId`, `turmaId`)
   - Seta `isAuthenticated: true`
   - Persiste `accessToken` e `refreshToken` no `localStorage`
7. React Router redireciona para `/dashboard`
8. O Dashboard verifica `user.role` e renderiza o dashboard correto

### 13.4 Como o token é enviado em cada requisição

A factory `createClient(baseURL)` em `services/httpClient.ts` (reutilizada por todos os clients de MS) registra um "interceptor de requisição" no Axios:

```typescript
function createClient(baseURL: string) {
  const client = axios.create({ baseURL })

  // Antes de CADA requisição: injeta o token
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Depois de CADA resposta: detecta 401 e tenta renovar
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = useAuthStore.getState().refreshToken
        try {
          const { data } = await authApi.post('/v1/auth/refresh', { refreshToken })
          useAuthStore.getState().setAccessToken(data.accessToken)
          // Refaz a requisição original com o novo token
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return client(error.config)
        } catch {
          useAuthStore.getState().logout()
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}
```

O usuário nunca percebe que o token expirou e foi renovado — acontece automaticamente.

### 13.5 O componente Dashboard — renderização condicional por role

```typescript
// pages/Dashboard/index.tsx
export default function DashboardPage() {
  const { user } = useAuthStore()

  if (user?.role === 'ADMIN') return <AdminDashboard />
  if (user?.role === 'PROFESSOR') return <ProfessorDashboard />
  return <AlunoDashboard />
}
```

Cada dashboard mostra informações relevantes para aquele perfil. O AdminDashboard mostra estatísticas gerais, notas recentes e ações rápidas. O AlunoDashboard mostra o boletim resumido e próximas avaliações. O ProfessorDashboard mostra as aulas do dia e pendências.

### 13.6 A Sidebar e o controle de menus por role

A Sidebar renderiza itens de menu diferentes para cada perfil. Um aluno não vê "Alunos", "Professores", "Turmas". Um professor não vê "Configurações". Isso é feito com renderização condicional:

```tsx
{user?.role === 'ADMIN' && (
  <>
    <NavItem href="/students" icon={...} label="Alunos" />
    <NavItem href="/teachers" icon={...} label="Professores" />
    <NavItem href="/settings" icon={...} label="Configurações" />
  </>
)}
```

Além do menu, as rotas em si têm proteção no backend. Mesmo que alguém force a navegação para `/settings` como professor, a API retornará 403.

### 13.7 O nginx e o problema do SPA

Quando o frontend está rodando dentro do Docker, é servido pelo nginx. O problema da SPA:

- O nginx recebe `GET /students` → procura o arquivo `/usr/share/nginx/html/students`
- Esse arquivo não existe → retorna 404 ❌

A solução é o arquivo `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`try_files $uri $uri/ /index.html` significa: "tente servir o arquivo exato; se não existir, tente como diretório; se não existir, sirva o `index.html`". O React Router então lida com a rota `/students` no JavaScript.

---

## 14. Docker

### 14.1 O problema que o Docker resolve

"Na minha máquina funciona" é uma frase famosa e frustrante no desenvolvimento de software. Um programa pode funcionar na máquina do desenvolvedor e não funcionar no servidor porque as versões do Node.js são diferentes, porque uma variável de ambiente está faltando, porque um pacote do sistema operacional tem versão diferente.

Docker resolve isso com **containers**: pacotes que incluem o código e tudo que ele precisa para rodar (Node.js, dependências, configurações). Um container funciona identicamente em qualquer máquina que tenha o Docker instalado.

### 14.2 O que é um container (analogia)

Imagine um navio cargueiro. Antigamente, cada produto era carregado de forma diferente: bananas num engradado, parafusos num saco, televisores numa caixa frágil. O processo de carga e descarga era caótico.

Os containers de navio padronizaram tudo: qualquer coisa vai dentro de um container de tamanho padrão. O navio não precisa saber o que está dentro — só sabe carregar e descarregar containers.

Os containers Docker são a mesma ideia: o servidor de produção não precisa saber que tipo de aplicação está rodando — só precisa saber rodar containers.

### 14.3 O Dockerfile (a receita)

Cada serviço tem um `Dockerfile` que é como uma receita de como construir o container:

```dockerfile
# ── Estágio 1: Builder (compila o TypeScript) ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build          # tsc → gera dist/

# ── Estágio 2: Production (apenas o necessário) ────────────────────────────
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production    # sem devDependencies
COPY --from=builder /app/dist ./dist  # copia apenas o dist/ compilado
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Multi-stage build:** O build tem dois estágios. O primeiro instala tudo (incluindo TypeScript, tsx, etc.) e compila. O segundo estágio copia apenas o resultado compilado e as dependências de produção. O resultado é uma imagem muito menor (não inclui TypeScript, tipos, etc.).

### 14.4 O Docker Compose (orquestração local)

Gerenciar 7 containers individualmente seria tedioso. O `docker-compose.yml` na raiz do projeto define todos os serviços e como eles se relacionam:

```yaml
services:
  auth-service:
    build: ./auth-service
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=...
      - JWT_SECRET=...

  ms01-alunos:
    build: ./MS01_gestao_de_alunos
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=...
      - JWT_SECRET=...   # mesmo segredo do auth!

  frontend:
    build: ./frontend
    ports:
      - "80:80"         # nginx na porta 80

  # ... todos os outros serviços
```

Com um único comando `docker compose up -d`, todos os 7 serviços sobem.

### 14.5 O frontend no Docker (nginx)

O frontend usa um Dockerfile diferente dos backends — usa **dois estágios diferentes**:

```dockerfile
# Estágio 1: Build do React
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build     # Vite → gera dist/ com HTML/JS/CSS otimizados

# Estágio 2: Servir com nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

O resultado final é apenas nginx + HTML/JS/CSS estáticos. Não tem Node.js no container de produção do frontend.

---

## 15. Os Trade-offs

Todo projeto tem decisões que envolvem trocar uma coisa por outra. Aqui são os principais trade-offs do nosso projeto.

### 15.1 Microserviços vs Monolito

**Ganhamos:**
- Desenvolvimento paralelo independente
- Responsabilidade clara por serviço
- Escalabilidade futura por módulo

**Perdemos:**
- Complexidade: precisamos de 7 processos rodando ao mesmo tempo
- Debugging mais difícil: um erro pode estar em qualquer serviço
- Comunicação por rede pode falhar

### 15.2 JWT stateless vs Sessão no servidor

**Ganhamos:**
- Cada microserviço valida o token de forma independente (sem depender do Auth)
- Alta performance — sem round-trip ao banco para validar

**Perdemos:**
- Impossível revogar um token antes de expirar (se alguém roubar o access token, tem 15 minutos de acesso)
- Para resolver isso, precisaria de uma blacklist de tokens no Redis — não implementamos

### 15.3 Polling (worker a cada 30s) vs WebSockets vs Fila de mensagens

**Polling (o que usamos):**
- Simples de implementar
- Não precisa de infraestrutura adicional
- Funciona bem para volumes baixos (comunicados escolares não são criados a cada segundo)

**WebSockets** (comunicação em tempo real bidirecional):
- Notificações instantâneas
- Muito mais complexo de implementar corretamente
- Requer gerenciamento de conexões persistentes

**RabbitMQ/Kafka** (fila de mensagens):
- Garantia de entrega, escalabilidade massiva
- Complexidade operacional alta
- Requer servidor adicional

Para uma escola com centenas de alunos (não milhões), polling a cada 30 segundos é totalmente adequado.

### 15.4 ORM (Prisma) vs SQL puro

**Prisma:**
- Produtividade alta, proteção contra SQL Injection automática, tipagem
- Não temos controle total sobre o SQL gerado
- Migrations bloqueadas (sem permissão DDL)
- Campos Decimal retornam como string (causa bugs se não tratado)

**SQL puro com `$queryRawUnsafe`:**
- Controle total
- Usado apenas onde necessário (ex: consultas cross-schema entre serviços)
- Risco de SQL Injection se não sanitizado corretamente

### 15.5 Banco compartilhado vs banco por serviço real

**O que temos:** Um servidor MySQL com schemas separados (os serviços compartilham a mesma instância do servidor).

**O que seria ideal:** Um servidor MySQL por serviço, completamente isolados.

**Por quê não fizemos o ideal:** Limitação do ambiente acadêmico — cada aluno tem apenas um schema no servidor da instituição.

**Impacto:** Em caso de falha do servidor MySQL, todos os serviços ficam offline simultaneamente. Em microserviços reais, falha do banco do MS-03 não afetaria o MS-01.

### 15.6 Frontend sem testes automatizados

Não implementamos testes de unidade ou integração no frontend (React Testing Library, Cypress, etc.). Isso é uma dívida técnica consciente — priorizamos a funcionalidade e o tempo era limitado.

**Risco:** Mudanças no código podem quebrar funcionalidades existentes sem que percebamos imediatamente. Compensamos testando manualmente as principais funcionalidades após cada mudança.

### 15.7 Autenticação sem blacklist de tokens

Se um usuário for desativado no banco (`ativo = false`), os tokens que ele já tem continuam válidos por até 15 minutos (duração do access token). Para revogar instantaneamente, precisaríamos de uma blacklist de tokens (normalmente em Redis).

Não implementamos. Para uso acadêmico, isso é aceitável.

---

## 16. Perguntas e Respostas

Esta seção cobre as perguntas mais prováveis em uma apresentação técnica.

---

### Sobre Arquitetura

**"Por que usaram microserviços em vez de um monolito?"**

Resposta: Microserviços foram escolhidos por três razões principais: (1) o próprio requisito do Projeto Integrador V pede essa arquitetura; (2) permitiu que cada integrante desenvolvesse seu módulo de forma independente e paralela, sem conflitos de merge; (3) replica a arquitetura usada em empresas de tecnologia reais (Netflix, Uber, iFood), sendo um aprendizado valioso. O trade-off é maior complexidade operacional — precisamos de 7 processos rodando simultaneamente.

---

**"Como os microserviços se comunicam?"**

Resposta: De duas formas. Sincrona: chamadas HTTP REST diretas (por exemplo, MS-05 chama MS-03 para saber quais alunos estão numa turma ao enviar um comunicado). Assíncrona: via Outbox Pattern — quando a grade horária muda no MS-02, ele grava um evento no banco; o MS-05 tem um worker que verifica esses eventos a cada 30 segundos e cria comunicados automáticos. Esse padrão garante que eventos não se percam mesmo que o MS-05 esteja temporariamente indisponível.

---

**"E se um microserviço cair? O sistema todo para?"**

Resposta: Depende de qual serviço. Se o MS-01 (alunos) cair, as telas de alunos no frontend mostrarão erro, mas você ainda consegue acessar notas, comunicados, etc. Se o Auth Service cair, nenhum login novo funciona (mas usuários já logados com token válido continuam tendo acesso pelas próximas 15 minutos). Se o banco de dados cair, tudo para — mas isso é uma limitação do ambiente acadêmico onde compartilhamos um servidor. Em produção real, cada serviço teria seu banco isolado.

---

**"Por que não usaram uma API Gateway?"**

Resposta: Por escopo. Uma API Gateway seria um serviço extra que receberia todas as requisições do frontend e as distribuiria para o serviço correto, centralizando rate limiting, logs e autenticação. Para o nosso cenário acadêmico — frontend único, sem necessidade de rate limiting agressivo e com cada MS já validando JWT localmente — o ganho não justificava a complexidade. O frontend mantém um cliente Axios por microserviço e a configuração de URLs fica centralizada em `services/httpClient.ts`. Em um cenário de produção real com clientes externos, adicionaríamos um Gateway (Kong, Nginx, ou um Fastify dedicado).

---

### Sobre Segurança

**"Como as senhas são protegidas?"**

Resposta: Com bcrypt, custo 10. Nunca armazenamos a senha em texto puro. O bcrypt é um algoritmo de hash que: (1) é unidirecional — dado o hash, não dá para recuperar a senha; (2) usa um "salt" aleatório, então dois hashes da mesma senha são diferentes (previne ataques de rainbow table); (3) é deliberadamente lento (1024 iterações), tornando ataques de força bruta inviáveis mesmo com hardware potente.

---

**"Como funciona o controle de acesso?"**

Resposta: Via JWT com roles. Quando o usuário faz login, recebe um token JWT que contém o campo `role` (ADMIN, PROFESSOR ou ALUNO). Cada requisição ao backend envia esse token no header. O backend verifica a assinatura do token (sem consultar banco) e extrai o role. Cada endpoint tem um `requireRole` que rejeita com 403 se o role não for autorizado. Além disso, mesmo que um aluno tente acessar dados de outro aluno (enviando o ID de outro na URL), o código compara o `referenciaId` do token com o ID da URL e bloqueia.

---

**"O que acontece se alguém roubar o access token?"**

Resposta: Teriam acesso por no máximo 15 minutos (a duração do access token). Não implementamos blacklist de tokens (que exigiria Redis), então não há como revogar antes do prazo. Para uma escola, esse risco é aceitável. Em um sistema financeiro, por exemplo, precisaríamos de revogação instantânea.

---

### Sobre o Banco de Dados

**"Por que um schema por serviço e não um banco separado?"**

Resposta: Limitação do ambiente — o servidor da instituição não nos permite criar novos schemas ou novos servidores. Cada aluno tem um schema. Como o Raphael é responsável pelo Auth e pelo MS-01, ambos compartilham seu schema. Os demais usam um schema cada. Em produção real, cada serviço teria seu próprio servidor de banco.

---

**"O que é o Prisma? Por que não usaram SQL puro?"**

Resposta: Prisma é um ORM (Object-Relational Mapper) — uma camada que traduz entre objetos JavaScript e tabelas SQL. Escolhemos porque: (1) protege automaticamente contra SQL Injection; (2) gera tipos TypeScript a partir do schema do banco, detectando erros de acesso a campos inexistentes em tempo de compilação; (3) torna o código mais legível. Usamos SQL puro apenas em consultas especiais que cruzam schemas (via `$queryRawUnsafe`), onde tomamos cuidado extra com segurança.

---

**"Por que o campo de nota retorna como string e não como número?"**

Resposta: As notas são armazenadas como `DECIMAL(5,2)` no MySQL — um tipo de número com precisão exata para casas decimais. O JavaScript nativo usa ponto flutuante (IEEE 754), que tem imprecisão: `0.1 + 0.2` em JavaScript não é exatamente `0.3`. Para preservar a precisão do banco, o Prisma retorna campos DECIMAL como strings. No frontend, convertemos explicitamente com `Number()` antes de operar com esses valores.

---

### Sobre o Frontend

**"O que é uma SPA? Por que usaram essa abordagem?"**

Resposta: SPA (Single Page Application) é uma aplicação onde o navegador carrega apenas uma página HTML e toda a navegação subsequente é feita por JavaScript, sem recarregar a página. Vantagens: navegação instantânea (sem round-trip ao servidor a cada clique), experiência mais próxima de um aplicativo nativo, estado da aplicação preservado durante a navegação. A desvantagem é que requer configuração especial no servidor (nginx com `try_files`) para que atualizar a página funcione corretamente.

---

**"O que é o TanStack Query?"**

Resposta: É uma biblioteca de gerenciamento de dados assíncronos para React. Resolve o problema de buscar dados de APIs: lida automaticamente com estados de carregamento e erro, faz cache dos dados (evita re-buscar se os dados ainda são recentes), invalida o cache quando dados mudam, e deduplica requisições idênticas. Sem ela, cada componente precisaria implementar manualmente `useState` + `useEffect` + tratamento de erro — muito código repetitivo.

---

**"Por que usaram Zustand e não Redux?"**

Resposta: Redux é poderoso para gerenciamento de estado complexo, mas exige muito código repetitivo (actions, reducers, selectors, etc.) para casos simples. No nosso frontend, o único estado verdadeiramente global é a autenticação (tokens e dados do usuário). Zustand resolve isso em ~50 linhas de código, com a mesma persistência no localStorage. Para projetos maiores com estado mais complexo, Redux ou Redux Toolkit seria mais adequado.

---

**"Como o frontend sabe qual dashboard mostrar para cada tipo de usuário?"**

Resposta: O JWT retornado no login contém o campo `role`. O Zustand decodifica o JWT (é um base64 público) e armazena o `role` no estado global. O componente Dashboard lê esse `role` e renderiza o componente correto (AdminDashboard, ProfessorDashboard ou AlunoDashboard). A sidebar também usa o `role` para mostrar apenas os links permitidos para aquele perfil.

---

### Sobre o Docker

**"O que é Docker e por que usaram?"**

Resposta: Docker é uma plataforma de containerização. Um container empacota o código e tudo que ele precisa para rodar (runtime Node.js, dependências, configurações) em uma unidade isolada que funciona identicamente em qualquer máquina. Usamos porque: (1) resolve o "na minha máquina funciona" — qualquer pessoa pode rodar `docker compose up -d` e ter o sistema completo funcionando em minutos; (2) simula melhor o ambiente de produção; (3) isola os serviços entre si.

---

**"O que é multi-stage build?"**

Resposta: É uma técnica para criar imagens Docker menores. O Dockerfile tem dois estágios: o primeiro ("builder") instala todas as dependências de desenvolvimento e compila o TypeScript. O segundo estágio copia apenas o resultado compilado (`dist/`) e instala apenas as dependências de produção (sem TypeScript, tipos, etc.). O resultado é uma imagem significativamente menor — não inclui o compilador TypeScript que foi usado apenas para construir.

---

**"Por que o frontend usa nginx e não Node.js em produção?"**

Resposta: O frontend em produção é composto apenas de arquivos estáticos: HTML, JavaScript e CSS. Não há código sendo executado no servidor — tudo roda no navegador do usuário. nginx é um servidor web extremamente eficiente para servir arquivos estáticos, muito mais leve e rápido que rodar um servidor Node.js. Node.js é necessário apenas para o build (compilar React para arquivos estáticos), não para servir.

---

### Sobre Decisões de Negócio/Produto

**"Como funciona o cálculo de média?"**

Resposta: Quando uma nota é lançada, o MS-04 automaticamente recalcula a `media_bimestral` daquele aluno naquela disciplina e bimestre. A média é a soma de todas as notas dividida pela quantidade de notas (média simples), excluindo avaliações do tipo RECUPERACAO. Se o aluno fizer recuperação e tirar nota maior que a média bimestral, a média é substituída pela nota da recuperação. A prova final é calculada como (média anual + nota da prova final) / 2.

---

**"O que é o Outbox Pattern? Por que usaram?"**

Resposta: É um padrão para comunicação assíncrona confiável entre serviços. Quando o MS-02 modifica a grade horária de um professor, ele precisa notificar os alunos da turma via MS-05. Mas e se o MS-05 estiver fora do ar naquele momento? Com chamada HTTP direta, a notificação seria perdida. Com o Outbox Pattern, MS-02 salva um "evento pendente" na mesma transação de banco que a modificação da grade. O MS-05 tem um worker que verifica esses eventos a cada 30 segundos. Mesmo que o MS-05 fique fora do ar por horas, ao voltar, processará todos os eventos pendentes.

---

**"Por que a frequência mínima é 75%?"**

Resposta: É o requisito legal brasileiro para aprovação escolar definido pela LDB (Lei de Diretrizes e Bases da Educação Nacional). Essa constante está definida no código do MS-01: `FREQUENCIA_MINIMA_PERCENTUAL = 75`. É configurável no código mas não via interface de usuário (diferente da média mínima de aprovação, que é configurável pelo admin).

---

**"O que acontece se o professor editar uma nota já lançada?"**

Resposta: A nota é atualizada e a média bimestral é recalculada automaticamente. O registro antigo não é mantido em histórico (não implementamos auditoria de edições de notas). O campo `editada_em` da nota é atualizado com o timestamp da edição.

---

**"Como funciona o refresh automático do token?"**

Resposta: O Axios tem um "interceptor de resposta" — código que roda automaticamente depois de cada resposta HTTP. Quando detecta um erro 401 (não autorizado), tenta buscar um novo access token usando o refresh token (`POST /v1/auth/refresh`). Se conseguir, refaz a requisição original com o novo token — de forma completamente transparente para o usuário. Se o refresh token também falhar (expirou em 7 dias), faz logout automático e redireciona para a tela de login.

---

*Este documento foi criado para a apresentação do Projeto Integrador V — SENAC RJ, 2026/1.*
*Grupo 1: Raphael Estrella, Gabriel Christino, André Sousa, Carlos Eduardo Gonçalves, Otávio Brito.*
