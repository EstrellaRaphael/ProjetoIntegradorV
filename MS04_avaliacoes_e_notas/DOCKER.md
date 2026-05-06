# Executando o MS04 com Docker

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Estar na rede da faculdade (ou VPN)

---

## Passo 1 — Criar o arquivo .env

```env
PORT=3004
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_carlossoares"
JWT_SECRET="change_this_secret_in_production_auth"
```

---

## Passo 2 — Construir a imagem

```bash
docker build -t ms04-avaliacoes-notas .
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name ms04 \
  --env-file .env \
  -p 3004:3004 \
  ms04-avaliacoes-notas
```

---

## Passo 4 — Verificar

```bash
curl http://localhost:3004/health
# {"status":"ok","service":"ms04-avaliacoes-e-notas"}
```

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver logs | `docker logs ms04` |
| Logs em tempo real | `docker logs -f ms04` |
| Parar | `docker stop ms04` |
| Iniciar novamente | `docker start ms04` |
| Remover | `docker stop ms04 && docker rm ms04` |

## Reconstruir após alterar o código

```bash
docker stop ms04 && docker rm ms04
docker build -t ms04-avaliacoes-notas .
docker run -d --name ms04 --env-file .env -p 3004:3004 ms04-avaliacoes-notas
```

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Can't reach database server` | Fora da rede da faculdade | Conecte ao Wi-Fi ou VPN |
| `port is already allocated` | Porta 3004 em uso | Use `-p 3005:3004` ou encerre o processo |
| Container cai imediatamente | Erro de configuração | Veja `docker logs ms04` |
