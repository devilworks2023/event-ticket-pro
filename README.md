# Event Ticket Pro

Plataforma profesional de ticketing para eventos (Blink + Vite/React). Incluye **frontend** y (opcional) **API + PostgreSQL** para self-hosting.

## Arranque rápido (solo web)

```bash
docker compose up -d --build
# Web: http://localhost:8080
```

## Self-hosting (VPS)

- Guía paso a paso (Ubuntu 24.04): `scripts/self-hosting.md`
- IONOS VPS (Ubuntu 24.04): `scripts/ionos-ubuntu-24-setup.md`

### Modo “todo en uno” (web + api + postgres)

```bash
cp .env.example .env
# IMPORTANTE: cambia POSTGRES_PASSWORD y (si aplica) DATABASE_URL

docker compose -f docker-compose.full.yml up -d --build

curl -s http://localhost:3001/health
# → {"ok":true,"db":true}
```

Notas:
- `docker-compose.full.yml` levanta:
  - Web: `:8080`
  - API: `:3001`
  - PostgreSQL: `:5432`
- El instalador web está en `/setup` (ver guía).
