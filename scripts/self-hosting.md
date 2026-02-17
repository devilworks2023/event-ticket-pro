# Self-hosting (VPS / servidor propio)

Este repo puede funcionar de 2 formas:

- **Modo 1 (simple): Solo frontend** (Vite SPA) y usas Blink (Auth/DB/Functions) como backend.
- **Modo 2 (tipo “WordPress installer”): Frontend + API + PostgreSQL** en tu servidor. Incluye un instalador web en **`/setup`** para inicializar el esquema y (opcionalmente) crear un admin.

> Nota importante: en Vite, las variables `VITE_*` se inyectan **en el build**. El instalador web inicializa la **DB del backend**, pero no puede “guardar” variables del frontend sin un backend adicional.

---

## 0) Qué vas a necesitar

- Un VPS con **Ubuntu 24.04 limpio**
- Un dominio (recomendado) apuntando al VPS (A/AAAA)
- Acceso SSH como usuario con sudo

Puertos recomendados:
- 22 (SSH)
- 80/443 (HTTP/HTTPS)
- (opcional) 8080 / 3001 / 5432 si quieres acceder directo sin proxy (no recomendado en prod)

---

## 1) Preparar el servidor (Ubuntu 24.04 desde cero)

### 1.1 Actualizar sistema

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl git ufw
```

### 1.2 Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 1.3 Instalar Docker + Compose

Ubuntu 24.04 ya trae paquetes, pero lo más estable suele ser Docker Engine (repo oficial):

```bash
# Repo oficial Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
```

Opcional: usar Docker sin sudo (relogin necesario):

```bash
sudo usermod -aG docker $USER
# cierra sesión y vuelve a entrar por SSH
```

Comprueba:

```bash
docker --version
docker compose version
```

---

## 2) Desplegar el proyecto (recomendado: Modo 2 con instalador)

### 2.1 Clonar el repo

```bash
cd ~
# si usas GitHub:
# git clone https://github.com/devilworks2023/event-ticket-pro.git
# cd event-ticket-pro

git clone <TU_REPO>
cd <CARPETA_DEL_REPO>
```

### 2.2 Crear variables del backend (Postgres)

El compose “full” usa `.env` para Postgres/API.

```bash
cp .env.example .env
nano .env
```

Cambia al menos:
- `POSTGRES_PASSWORD` (obligatorio)
- opcionalmente `POSTGRES_DB`, `POSTGRES_USER`

### 2.3 Variables del frontend (Blink)

Crea `.env.local` para el build del frontend (Vite):

```bash
nano .env.local
```

Contenido (ejemplo):

```bash
VITE_BLINK_PROJECT_ID=event-ticket-app-ympgl1kq
VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_vcRA1MB0Q3Q99vOyByYAYTm_TpSVSjko
```

> Si tu frontend seguirá usando Blink para Auth/DB/Functions, estas 2 variables son obligatorias.

### 2.4 Levantar contenedores (API + Postgres + Web)

```bash
docker compose -f docker-compose.full.yml up -d --build
```

Comprobar:

```bash
curl -s http://localhost:3001/health
```

### 2.5 Ejecutar el instalador web (tipo WordPress)

Si no tienes reverse proxy todavía, abre en el navegador:

- `http://TU_IP:8080/setup`

En la pantalla:
1) En “URL de la API” usa `http://TU_IP:3001` (o `http://localhost:3001` si estás dentro del VPS con túnel)
2) Pulsa **Comprobar estado**
3) Rellena el admin (opcional) y pulsa **Inicializar base de datos**

Alternativa por terminal:

```bash
curl http://localhost:3001/setup/status

curl -X POST http://localhost:3001/setup/run \
  -H 'content-type: application/json' \
  -d '{"adminEmail":"admin@tu-dominio.com","adminDisplayName":"Admin","adminPassword":"cambia-esto"}'
```

---

## 3) Ponerlo “como WordPress” (un solo dominio con HTTPS)

Objetivo:
- Web: `https://TU_DOMINIO/`
- Instalador: `https://TU_DOMINIO/setup`
- API: `https://TU_DOMINIO/api/...` (sin puertos)

Hay dos formas:

### Opción 3A (rápida y profesional): Caddy como reverse proxy (recomendado)

1) Instala Caddy:

```bash
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt -y install caddy
```

2) Crea `/etc/caddy/Caddyfile`:

```caddy
TU_DOMINIO {
  # Web (contenedor nginx del servicio web en :8080)
  reverse_proxy 127.0.0.1:8080

  # API como /api (contenedor api en :3001)
  handle_path /api/* {
    reverse_proxy 127.0.0.1:3001
  }
}
```

3) Reinicia Caddy:

```bash
sudo systemctl reload caddy
```

Caddy te gestionará HTTPS automáticamente (Let’s Encrypt).

En el instalador (`/setup`), pon la API URL como:
- `https://TU_DOMINIO/api`

### Opción 3B: Nginx + Certbot

Si prefieres Nginx, necesitas configurar server block + Certbot. Si me dices tu dominio, te dejo el `server {}` exacto para tu caso.

---

## 4) Operación diaria

### Logs

```bash
docker compose -f docker-compose.full.yml logs -f --tail=200
```

### Actualizar versión

```bash
git pull
docker compose -f docker-compose.full.yml up -d --build
```

### Reiniciar

```bash
docker compose -f docker-compose.full.yml restart
```

### Reset completo (borra DB)

⚠️ Esto borra toda la DB Postgres.

```bash
docker compose -f docker-compose.full.yml down
# elimina el volumen
docker volume rm postgres_data
# vuelve a levantar y repite /setup
docker compose -f docker-compose.full.yml up -d --build
```

---

## 5) Checklist de verificación rápida

- `https://TU_DOMINIO/` carga el frontend
- `https://TU_DOMINIO/setup` abre el instalador
- `https://TU_DOMINIO/api/health` responde `{ ok: true, ... }`
- En el instalador, “Estado: Inicializado”