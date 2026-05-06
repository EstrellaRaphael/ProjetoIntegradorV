# Executando o MS03 com Docker

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Estar na rede da faculdade (ou VPN)

---

## Passo 1 — Criar o arquivo .env

```env
PORT=3003
DATABASE_URL="mysql://20261_prjint5_noite:Senac%4020261@edumysql.acesso.rj.senac.br:3306/20261_prjint5_andrebezerra"
JWT_SECRET="change_this_secret_in_production_auth"
```

---

## Passo 2 — Construir a imagem

```bash
docker build -t ms03-turmas-disciplinas .
```

---

## Passo 3 — Rodar o container

```bash
docker run -d \
  --name ms03 \
  --env-file .env \
  -p 3003:3003 \
  ms03-turmas-disciplinas
```

---

## Passo 4 — Verificar

```bash
curl http://localhost:3003/health
# {"status":"ok","service":"ms03-turmas-e-disciplinas"}
```

---

## Comandos úteis

| O que fazer | Comando |
|-------------|---------|
| Ver logs | `docker logs ms03` |
| Logs em tempo real | `docker logs -f ms03` |
| Parar | `docker stop ms03` |
| Iniciar novamente | `docker start ms03` |
| Remover | `docker stop ms03 && docker rm ms03` |

## Reconstruir após alterar o código

```bash
docker stop ms03 && docker rm ms03
docker build -t ms03-turmas-disciplinas .
docker run -d --name ms03 --env-file .env -p 3003:3003 ms03-turmas-disciplinas
```

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Can't reach database server` | Fora da rede da faculdade | Conecte ao Wi-Fi ou VPN |
| `port is already allocated` | Porta 3003 em uso | Use `-p 3004:3003` ou encerre o processo |
| Container cai imediatamente | Erro de configuração | Veja `docker logs ms03` |
