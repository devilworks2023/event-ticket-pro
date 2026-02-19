#!/usr/bin/env bash
set -euo pipefail

echo "Actualizando repo…"
git pull

echo "Rebuild + restart…"

# Por defecto usamos el stack completo (web + api + postgres)
# Si solo quieres frontend, ejecuta: docker compose -f docker-compose.yml up -d --build
COMPOSE_FILE="docker-compose.full.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
  COMPOSE_FILE="docker-compose.yml"
fi

docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

echo "OK"
