# Self-hosting (VPS / servidor propio) — Guía paso a paso (Ubuntu limpio)

Esta guía está escrita para alguien que **no programa**. Copia/pega los comandos tal cual.

## Resumen (qué vamos a conseguir)

Al final tendrás:
- Tu web en: `https://TU_DOMINIO/`
- El instalador en: `https://TU_DOMINIO/setup`
- La API en: `https://TU_DOMINIO/api/health`

**Recomendado**: despliegue con **Docker Compose** (más fácil de mantener) + **Caddy** (HTTPS automático).

---

## Antes de empezar (2 cosas IMPORTANTES)

1) **Necesitas un dominio** apuntando a tu servidor
- En tu proveedor de dominio (IONOS/Cloudflare/etc.), crea un registro **A**:
  - Nombre: `@` (o vacío)
  - Valor: `LA_IP_DE_TU_SERVIDOR`
- (Opcional) otro A para `www` apuntando a la misma IP.

2) **Entra por SSH**
- En Windows puedes usar *PuTTY* o *Windows Terminal*.
- En Mac/Linux: Terminal.

Ejemplo:
```bash
ssh TU_USUARIO@TU_IP
```

---

## 0) Qué modo de self-hosting vas a usar

Este repo puede funcionar de 2 formas:

- **Modo 1 (solo frontend)**: subes la web y sigues usando Blink (Auth/DB/Functions) como backend.
- **Modo 2 (recomendado para servidor propio “todo en uno”)**: web + API + PostgreSQL en tu servidor. Incluye instalador web en **`/setup`**.

En esta guía haremos **Modo 2**.

> Nota (importante pero simple): el instalador `/setup` crea la **base de datos del servidor**. El frontend sigue necesitando sus variables `VITE_*` en el build.

---

## 1) Preparar el servidor (Ubuntu 24.04 desde cero)

### 1.1 Actualizar Ubuntu e instalar herramientas

Copia/pega:
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl git ufw nano
```

### 1.2 Activar firewall (UFW)

Copia/pega:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

Si ves `Status: active` está bien.

### 1.3 Instalar Docker + Docker Compose

Copia/pega **tal cual**:
```bash
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

Verificación:
```bash
docker --version
docker compose version
```

### 1.4 (Opcional, recomendado) Usar Docker sin escribir sudo

```bash
sudo usermod -aG docker $USER
```

Luego **cierra la sesión SSH y vuelve a entrar**.

---

## 2) Descargar la app (clonar el repo)

Ve a tu carpeta “home” y clona:
```bash
cd ~

git clone https://github.com/devilworks2023/event-ticket-pro.git
cd event-ticket-pro
```

Si tu repo es privado y te pide contraseña, dímelo y te guío para crear una *Deploy Key* o usar token.

---

## 3) Configurar variables (muy importante)

Aquí hay 2 archivos distintos:
- `.env` → lo usa **Postgres + API** (Docker Compose)
- `.env.local` → lo usa el **frontend Vite** (se “mete” en el build)

### 3.1 Backend: `.env`

```bash
cp .env.example .env
nano .env
```

Cambia como mínimo:
- `POSTGRES_PASSWORD=` → pon una contraseña larga (guárdala)

### 3.2 Frontend: `.env.local`

Crea el archivo:
```bash
nano .env.local
```

Pega esto (ya lo dejo listo con tu proyecto):
```bash
VITE_BLINK_PROJECT_ID=event-ticket-app-ympgl1kq
VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_vcRA1MB0Q3Q99vOyByYAYTm_TpSVSjko
```

Guardar en nano:
- Ctrl+O, Enter
- Ctrl+X

---

## 4) Arrancar la app (API + DB + Web)

**Importante**: este repo tiene 2 archivos de compose:
- `docker-compose.yml` → **solo web** (frontend)
- `docker-compose.full.yml` → **web + api + postgres** (recomendado)

Ejecuta (modo recomendado):
```bash
docker compose -f docker-compose.full.yml up -d --build --remove-orphans
```

Esto puede tardar 2–5 min la primera vez.

### 4.1 Comprobar que la API está viva

```bash
curl -s http://localhost:3001/health
```

Si te sale:
- `curl: (7) Failed to connect...` → la API **no está levantada**. Casi siempre es porque ejecutaste el compose equivocado (usa el de arriba con `-f docker-compose.full.yml`).

Para ver contenedores y logs:
```bash
docker ps

docker compose -f docker-compose.full.yml logs -f --tail=200 api
```

Deberías ver algo como:
```json
{"ok":true,"db":true}
```

### 4.2 Abrir el instalador /setup

Sin HTTPS todavía, prueba en tu navegador:
- `http://TU_IP:8080/setup`

Dentro de “URL de la API” usa:
- `http://TU_IP:3001`

Pulsa:
1) **Comprobar estado**
2) **Inicializar base de datos**

> Alternativa por terminal (si no puedes abrir navegador):
```bash
curl http://localhost:3001/setup/status
curl -X POST http://localhost:3001/setup/run \
  -H 'content-type: application/json' \
  -d '{"adminEmail":"admin@tu-dominio.com","adminDisplayName":"Admin","adminPassword":"cambia-esto"}'
```

---

## 5) Poner dominio + HTTPS (recomendado: Caddy)

### 5.1 Instalar Caddy

```bash
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt -y install caddy
```

### 5.2 Crear el Caddyfile (cambia TU_DOMINIO)

```bash
sudo nano /etc/caddy/Caddyfile
```

Pega (cambia `TU_DOMINIO` por tu dominio real).

Ejemplo con tu caso (sin www):
```caddy
tickets.devil-works.com {
  # API como /api
  handle_path /api/* {
    reverse_proxy 127.0.0.1:3001
  }

  # Web
  reverse_proxy 127.0.0.1:8080
}
```

Ejemplo si quieres **usar www también** (recomendado):
```caddy
tickets.devil-works.com, www.tickets.devil-works.com {
  # API como /api
  handle_path /api/* {
    reverse_proxy 127.0.0.1:3001
  }

  # Web
  reverse_proxy 127.0.0.1:8080
}
```

Recarga Caddy:
```bash
sudo systemctl reload caddy
```

### 5.3 Verificación final

En tu navegador:
- `https://TU_DOMINIO/`
- `https://TU_DOMINIO/setup`
- `https://TU_DOMINIO/api/health`

En el instalador (`/setup`), la **URL de la API** ya debe ser:
- `https://TU_DOMINIO/api`

---

## 6) Uso diario (mantenimiento)

### Ver logs (si algo falla)

```bash
cd ~/event-ticket-pro

docker compose -f docker-compose.full.yml logs -f --tail=200
```

### Actualizar a la última versión del repo

```bash
cd ~/event-ticket-pro

git pull

docker compose -f docker-compose.full.yml up -d --build --remove-orphans
```

---

## 7) Problemas típicos (soluciones rápidas)

### A) El dominio no carga / HTTPS no se activa
- Espera 5–30 min (DNS)
- Asegúrate de que el dominio apunta a la IP correcta (registro A)
- Revisa logs de Caddy:
```bash
sudo journalctl -u caddy -n 200 --no-pager
```

### B) `http://TU_IP:8080` no abre
- Revisa que el contenedor web está corriendo:
```bash
docker ps
```

### C) La API da `db:false`
- Significa que Postgres no está listo o la contraseña no coincide.
- Revisa logs:
```bash
docker compose -f docker-compose.full.yml logs -f postgres api --tail=200
```

---

## 8) Checklist (si me dices estos 5 datos, te lo dejo perfecto)

1) Tu dominio (ej: `midominio.com` o `tickets.midominio.com`)
2) La IP del servidor
3) Si el repo es público o privado
4) Si quieres usar `www` o no
5) Si `curl http://localhost:3001/health` te da `db:true`