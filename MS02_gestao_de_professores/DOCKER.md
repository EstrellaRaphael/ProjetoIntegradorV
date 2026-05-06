# Executando o MS02 com Docker

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Estar na rede da faculdade (ou VPN)

---

## Passo 1 — Criar o arquivo .env

```env
PORT=3002
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_gabrielsantos"
JWT_SECRET="change_this_secret_in_production_auth"
```

---

## Passo 2 — Construir a imagem

```bash
docker build -t ms02-gestao-professores .
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name ms02 \
  --env-file .env \
  -p 3002:3002 \
  ms02-gestao-professores
```

---

## Passo 4 — Verificar

```bash
curl http://localhost:3002/health
# {"status":"ok","service":"ms02-gestao-de-professores"}
```

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver logs | `docker logs ms02` |
| Logs em tempo real | `docker logs -f ms02` |
| Parar | `docker stop ms02` |
| Iniciar novamente | `docker start ms02` |
| Remover | `docker stop ms02 && docker rm ms02` |

## Reconstruir após alterar o código

```bash
docker stop ms02 && docker rm ms02
docker build -t ms02-gestao-professores .
docker run -d --name ms02 --env-file .env -p 3002:3002 ms02-gestao-professores
```

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Can't reach database server` | Fora da rede da faculdade | Conecte ao Wi-Fi ou VPN |
| `port is already allocated` | Porta 3002 em uso | Use `-p 3003:3002` ou encerre o processo |
| Container cai imediatamente | Erro de configuração | Veja `docker logs ms02` |
