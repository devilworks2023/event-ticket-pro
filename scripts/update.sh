#!/usr/bin/env bash
set -euo pipefail

echo "Actualizando repo…"
git pull

echo "Rebuild + restart…"
docker compose up -d --build

echo "OK"
