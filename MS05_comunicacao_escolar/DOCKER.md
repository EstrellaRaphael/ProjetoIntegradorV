# Executando o MS05 com Docker

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Estar na rede da faculdade (ou VPN)
- MS02 rodando na porta 3002 (workers consomem eventos de grade)
- MS03 rodando na porta 3003 (resolução de alunos por turma)

---

## Passo 1 — Criar o arquivo .env

```env
PORT=3005
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_otaviosilva"
JWT_SECRET="change_this_secret_in_production_auth"
MS01_URL="http://localhost:3001"
MS02_URL="http://localhost:3002"
MS03_URL="http://localhost:3003"
```

> As URLs `MS02_URL` e `MS03_URL` são usadas pelos workers em background. Se os outros serviços não estiverem rodando localmente, os workers vão registrar erros de conexão nos logs, mas o serviço continuará funcionando para as rotas de comunicados e preferências.

---

## Passo 2 — Construir a imagem

```bash
docker build -t ms05-comunicacao-escolar .
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name ms05 \
  --env-file .env \
  -p 3005:3005 \
  ms05-comunicacao-escolar
```

---

## Passo 4 — Verificar

```bash
curl http://localhost:3005/health
# {"status":"ok","service":"ms05-comunicacao-escolar"}
```

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver logs | `docker logs ms05` |
| Logs em tempo real | `docker logs -f ms05` |
| Parar | `docker stop ms05` |
| Iniciar novamente | `docker start ms05` |
| Remover | `docker stop ms05 && docker rm ms05` |

## Reconstruir após alterar o código

```bash
docker stop ms05 && docker rm ms05
docker build -t ms05-comunicacao-escolar .
docker run -d --name ms05 --env-file .env -p 3005:3005 ms05-comunicacao-escolar
```

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Can't reach database server` | Fora da rede da faculdade | Conecte ao Wi-Fi ou VPN |
| `port is already allocated` | Porta 3005 em uso | Use `-p 3006:3005` ou encerre o processo |
| Container cai imediatamente | Erro de configuração | Veja `docker logs ms05` |
| Worker: `ECONNREFUSED` nos logs | MS02 ou MS03 não estão acessíveis | Os workers tentarão novamente a cada 30s; inicie os outros serviços |
