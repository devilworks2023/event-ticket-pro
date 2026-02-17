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

#### Inicialización de la base de datos (setup)

La API expone un instalador simple para crear el esquema de PostgreSQL y (opcionalmente) un usuario administrador.

1) Ver estado:
```bash
curl -s http://localhost:3001/setup/status
# → {"ok":true,"initialized":false}
```

2) Ejecutar inicialización (crea esquema + admin opcional):
```bash
curl -s -X POST http://localhost:3001/setup/run \
  -H 'content-type: application/json' \
  -d '{"adminEmail":"admin@tu-dominio.com","adminDisplayName":"Admin","adminPassword":"cambia-esto"}'
# → {"ok":true,"initialized":true,"adminUserId":"usr_..."}
```

Notas importantes:
- Si `initialized` ya es `true`, `/setup/run` responde `ok:true` sin volver a ejecutar.
- En producción, ejecuta el setup **solo una vez** y no lo dejes expuesto públicamente.

Notas generales:
- `docker-compose.full.yml` levanta:
  - Web: `:8080`
  - API: `:3001`
  - PostgreSQL: `:5432`
- El instalador web también está en `/setup` (UI).
