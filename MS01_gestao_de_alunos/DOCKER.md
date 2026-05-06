# Executando o MS01 com Docker

> Guia para rodar o serviço de Gestão de Alunos em qualquer PC usando Docker Desktop, sem precisar instalar Node.js ou configurar o ambiente manualmente.

---

## Pré-requisitos

- **Docker Desktop** instalado e rodando (verifique o ícone na bandeja do sistema — deve estar verde)
- O repositório clonado ou copiado para o PC
- Estar na **rede da faculdade** (presencialmente ou via VPN) para acessar o banco de dados remoto

---

## Passo 1 — Criar o arquivo `.env`

Na pasta do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
PORT=3001
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_raphaelestrella"
JWT_SECRET="change_this_secret_in_production_auth"
```

> O arquivo `.env` não vai para o repositório (está no `.gitignore`). Você precisa criá-lo manualmente em cada PC onde for rodar o projeto.

---

## Passo 2 — Construir a imagem Docker

Abra um terminal na pasta do projeto e execute:

```bash
docker build -t ms01-gestao-alunos .
```

O Docker vai:
1. Baixar a imagem base do Node.js 22
2. Instalar as dependências
3. Compilar o TypeScript
4. Gerar o Prisma Client

Na **primeira vez** leva alguns minutos. Nas próximas execuções é muito mais rápido por causa do cache.

**Saída esperada no final:**
```
Successfully built xxxxxxxx
Successfully tagged ms01-gestao-alunos:latest
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name ms01 \
  --env-file .env \
  -p 3001:3001 \
  ms01-gestao-alunos
```

| Flag | O que faz |
|------|-----------|
| `-d` | Roda em segundo plano (não trava o terminal) |
| `--name ms01` | Dá um nome ao container para facilitar os comandos |
| `--env-file .env` | Passa as variáveis de ambiente do arquivo `.env` |
| `-p 3001:3001` | Expõe a porta 3001 do container para o seu PC |

---

## Passo 4 — Verificar se está funcionando

```bash
curl http://localhost:3001/health
```

**Resposta esperada:**
```json
{ "status": "ok", "service": "ms01-gestao-de-alunos" }
```

Ou acesse diretamente no navegador: `http://localhost:3001/health`

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver containers rodando | `docker ps` |
| Ver logs do serviço | `docker logs ms01` |
| Ver logs em tempo real | `docker logs -f ms01` |
| Parar o container | `docker stop ms01` |
| Iniciar novamente | `docker start ms01` |
| Remover o container | `docker stop ms01 && docker rm ms01` |

---

## Reconstruindo após alterar o código

Se você modificou algum arquivo do projeto e quer rodar a versão atualizada:

```bash
docker stop ms01
docker rm ms01
docker build -t ms01-gestao-alunos .
docker run -d --name ms01 --env-file .env -p 3001:3001 ms01-gestao-alunos
```

---

## Solução de problemas

### O container não aparece em `docker ps`

Ele pode ter caído logo após iniciar. Veja os logs para identificar o erro:

```bash
docker logs ms01
```

### Erro de conexão com o banco de dados

```
Can't reach database server at edumysql.acesso.rj.senac.br
```

O container está no ar mas não consegue acessar o MySQL. Causas comuns:

- Você não está na rede da faculdade — conecte-se ao Wi-Fi da instituição ou à VPN
- A senha no `.env` está incorreta — verifique o campo `DATABASE_URL`

### Porta 3001 já em uso

```
Bind for 0.0.0.0:3001 failed: port is already allocated
```

Algum processo já está usando a porta 3001 (talvez o serviço rodando sem Docker). Encerre o processo ou use uma porta diferente:

```bash
docker run -d --name ms01 --env-file .env -p 3002:3001 ms01-gestao-alunos
# O serviço fica acessível em localhost:3002
```

### Docker Desktop não está rodando

Se o comando `docker build` retornar `Cannot connect to the Docker daemon`, abra o Docker Desktop e aguarde ele inicializar completamente antes de tentar novamente.
