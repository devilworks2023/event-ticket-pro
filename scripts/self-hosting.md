# Self-hosting (VPS / servidor propio)

Este proyecto es un **frontend Vite (SPA)** que usa Blink como backend (Auth/DB/Functions). Puedes alojarlo en tu servidor como estático (Nginx/Caddy) o con Docker.

## VPS IONOS (Ubuntu 24.04)
Si vas a desplegar en un VPS de IONOS con Ubuntu 24.04, usa la guía paso a paso (Docker + UFW + dominio + HTTPS):
- `scripts/ionos-ubuntu-24-setup.md`

## Requisitos
- Git
- Docker + Docker Compose (recomendado) **o** Node/Bun

## Qué significa “instalar desde el frontend tipo WordPress”
En WordPress, el instalador puede **crear tablas** y **generar configuración** desde el navegador.

Aquí hay 2 piezas:
1) **Backend + DB (self-hosted opcional)**: incluye un instalador web en `/setup` que inicializa Postgres y (opcionalmente) crea un admin.
2) **Frontend Vite**: las variables `VITE_*` se inyectan **en el build** (no se pueden “guardar” desde el navegador sin un backend propio).

➡️ En práctica:
- Primero levantas contenedores/servicios.
- Luego abres `https://TU_DOMINIO/setup` y ejecutas el instalador.

## Variables de entorno (obligatorio)
Vite necesita estas variables en build-time:

- `VITE_BLINK_PROJECT_ID`
- `VITE_BLINK_PUBLISHABLE_KEY`

Crea un archivo `.env.local` en el servidor (o en tu pipeline de CI) antes de compilar.

## Opción A — Docker (recomendado)

### A1) Solo frontend (usa Blink como backend)
```bash
git clone <tu-repo>
cd <tu-repo>

# 1) Configura .env.local
# 2) Build + run
docker compose up -d --build

# App: http://TU_SERVIDOR:8080
```

### A2) Frontend + Backend (B) + PostgreSQL (Ubuntu 24.04 / IONOS)
> Esto levanta **Postgres** + una **API mínima** + el frontend.

```bash
cp .env.example .env
# IMPORTANTE: cambia POSTGRES_PASSWORD

docker compose -f docker-compose.full.yml up -d --build

# Web:  http://TU_SERVIDOR:8080
# API:  http://TU_SERVIDOR:3001/health
# DB:   postgres://... en 5432
```

### Inicializar DB (instalador)

Opción 1 (recomendado): abre el instalador web:
- `http://TU_SERVIDOR:8080/setup`

Opción 2 (por terminal):
```bash
curl http://TU_SERVIDOR:3001/setup/status

curl -X POST http://TU_SERVIDOR:3001/setup/run \
  -H 'content-type: application/json' \
  -d '{"adminEmail":"admin@example.com","adminDisplayName":"Admin","adminPassword":"change-me"}'
```

## (Recomendado) Quitar el puerto de la API con reverse proxy (/api)
Si quieres “experiencia WordPress” (un único dominio sin puertos), configura un reverse proxy:

### Nginx (ejemplo)
Sirve el frontend (dist) y proxyea la API como `/api`:

```nginx
server {
  listen 80;
  server_name TU_DOMINIO;

  root /var/www/event-ticket-pro/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API → contenedor/servicio en :3001
  location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Con esto:
- Instalador: `https://TU_DOMINIO/setup`
- API status: `https://TU_DOMINIO/api/setup/status`

### Caddy (ejemplo)
```caddy
TU_DOMINIO {
  root * /var/www/event-ticket-pro/dist
  file_server

  # SPA fallback
  try_files {path} /index.html

  handle_path /api/* {
    reverse_proxy 127.0.0.1:3001
  }
}
```

## Opción B — Sin Docker (Bun)
```bash
bun install
bun run build

# Sirve la carpeta dist con Nginx/Caddy
```

## Actualizaciones con git pull
```bash
git pull
docker compose up -d --build
```