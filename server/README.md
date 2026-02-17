# Backend (API) + PostgreSQL

Este backend es un esqueleto mínimo para auto-hosting (Ubuntu 24.04).

Incluye un **instalador** para inicializar el esquema en PostgreSQL.

## Guía completa (Ubuntu 24.04 desde cero)

- `scripts/self-hosting.md` (incluye instalador web `/setup`, reverse proxy y HTTPS)

## Ejecutar con Docker Compose (dev rápido)

```bash
cp .env.example .env
# IMPORTANTE: cambia POSTGRES_PASSWORD

docker compose -f docker-compose.full.yml up -d --build

curl http://localhost:3001/health
```

## Instalador (setup)

### Instalador web (tipo WordPress)

Si también estás levantando el frontend (servicio `web` en `docker-compose.full.yml`), abre:
- `http://localhost:8080/setup`

Ahí puedes:
- comprobar conexión con la API
- inicializar el esquema de Postgres
- crear (opcionalmente) un usuario admin

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

## Recomendado: reverse proxy para /api

Para evitar puertos en producción, expón la API como `/api` con Caddy o Nginx.
Detalles y ejemplos completos: `scripts/self-hosting.md`.
