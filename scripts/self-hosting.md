# Self-hosting (VPS / servidor propio)

Este proyecto es un **frontend Vite (SPA)** que usa Blink como backend (Auth/DB/Functions). Puedes alojarlo en tu servidor como estático (Nginx/Caddy) o con Docker.

## VPS IONOS (Ubuntu 24.04)
Si vas a desplegar en un VPS de IONOS con Ubuntu 24.04, usa la guía paso a paso (Docker + UFW + dominio + HTTPS):
- `scripts/ionos-ubuntu-24-setup.md`

## Requisitos
- Git
- Docker + Docker Compose (recomendado) **o** Node/Bun

## Variables de entorno (obligatorio)
Vite necesita estas variables en build-time:

- `VITE_BLINK_PROJECT_ID`
- `VITE_BLINK_PUBLISHABLE_KEY`

Crea un archivo `.env.local` en el servidor (o en tu pipeline de CI) antes de compilar.

## Opción A — Docker (recomendado)
```bash
git clone <tu-repo>
cd <tu-repo>

# 1) Configura .env.local
# 2) Build + run
docker compose up -d --build

# App: http://TU_SERVIDOR:8080
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

## Nota sobre “instalador desde frontend”
En Vite, las credenciales (`VITE_*`) se inyectan en el build. Por eso el "setup" real es **configurar `.env.local` y recompilar**. Si quieres, puedo añadir un panel /setup para validar configuración y mostrar checks (pero no puede escribir env vars del servidor desde el navegador).
