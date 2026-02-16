# Backend (API) + PostgreSQL

Este backend es un esqueleto mínimo para auto-hosting (Ubuntu 24.04 / IONOS).

## Ejecutar con Docker Compose

```bash
cp .env.example .env
# edita POSTGRES_PASSWORD y DATABASE_URL si quieres

docker compose -f docker-compose.full.yml up -d --build

curl http://localhost:3001/health
```
