# Backend (API) + PostgreSQL

Este backend es un esqueleto mínimo para auto-hosting (Ubuntu 24.04 / IONOS).

Incluye un **instalador** para inicializar el esquema en PostgreSQL.

## Ejecutar con Docker Compose

```bash
cp .env.example .env
# IMPORTANTE: cambia POSTGRES_PASSWORD

docker compose -f docker-compose.full.yml up -d --build

curl http://localhost:3001/health
```

## Instalador (setup)

### Estado

```bash
curl http://localhost:3001/setup/status
```

### Inicializar DB (y crear admin opcional)

```bash
curl -X POST http://localhost:3001/setup/run \
  -H 'content-type: application/json' \
  -d '{"adminEmail":"admin@example.com","adminDisplayName":"Admin","adminPassword":"change-me"}'
```
