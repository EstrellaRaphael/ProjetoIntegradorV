# Executando o Auth Service com Docker

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Estar na rede da faculdade (ou VPN) para acessar o banco remoto

---

## Passo 1 — Criar o arquivo .env

```env
PORT=3000
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_raphaelestrella"
JWT_SECRET="change_this_secret_in_production_auth"
JWT_REFRESH_SECRET="change_this_refresh_secret_in_production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

---

## Passo 2 — Construir a imagem

```bash
docker build -t auth-service .
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name auth \
  --env-file .env \
  -p 3000:3000 \
  auth-service
```

---

## Passo 4 — Verificar

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"auth-service"}
```

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver logs | `docker logs auth` |
| Logs em tempo real | `docker logs -f auth` |
| Parar | `docker stop auth` |
| Iniciar novamente | `docker start auth` |
| Remover | `docker stop auth && docker rm auth` |

## Reconstruir após alterar o código

```bash
docker stop auth && docker rm auth
docker build -t auth-service .
docker run -d --name auth --env-file .env -p 3000:3000 auth-service
```

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Can't reach database server` | Fora da rede da faculdade | Conecte ao Wi-Fi da instituição ou VPN |
| `port is already allocated` | Porta 3000 em uso | Use `-p 3001:3000` ou encerre o processo |
| Container cai imediatamente | Erro de configuração | Veja `docker logs auth` |
