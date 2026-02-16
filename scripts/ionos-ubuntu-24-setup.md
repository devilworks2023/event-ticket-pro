# IONOS VPS (Ubuntu 24.04) — Guía de despliegue

Esta app es un **frontend Vite (SPA)** que usa **Blink** como backend (Auth/DB/Edge Functions). En el VPS solo necesitas servir el `dist/` (o usar Docker para compilar + servir).

> Recomendación: Docker + Caddy (HTTPS automático) + UFW.

---

## 1) Preparación del servidor

### Actualiza el sistema
```bash
sudo apt update
sudo apt -y upgrade
sudo reboot
```

### Crea usuario (opcional pero recomendado)
```bash
adduser deploy
usermod -aG sudo deploy
```

### Asegura SSH
- En IONOS: añade tu **SSH key**.
- En el VPS: edita `/etc/ssh/sshd_config` (opcional) para desactivar password auth.

---

## 2) Instalar Docker + Compose (Ubuntu 24.04)

```bash
# Dependencias
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# Keyring
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Repo
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir docker sin sudo (re-log requerido)
sudo usermod -aG docker $USER
```

Verifica:
```bash
docker --version
docker compose version
```

---

## 3) Firewall (UFW)

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 4) DNS (dominio)

En tu proveedor DNS crea:
- `A` record: `tu-dominio.com` → IP del VPS
- `A` record: `www.tu-dominio.com` → IP del VPS (opcional)

Espera propagación (puede tardar minutos/hasta 24h).

---

## 5) Deploy con Docker (recomendado)

### 5.1 Clonar repo
```bash
git clone https://github.com/devilworks2023/event-ticket-pro.git
cd event-ticket-pro
```

### 5.2 Configurar `.env.local`
Vite necesita estas variables **en build-time**:
- `VITE_BLINK_PROJECT_ID`
- `VITE_BLINK_PUBLISHABLE_KEY`

Crea el archivo (no lo commitees):
```bash
cat > .env.local << 'EOF'
VITE_BLINK_PROJECT_ID=ympgl1kq
VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_vcRA1MB0Q3Q99vOyByYAYTm_TpSVSjko
EOF
```

### 5.3 Opción A (simple): exponer puerto 8080
```bash
docker compose up -d --build
# App: http://TU_SERVIDOR:8080
```

### 5.4 Opción B (producción): Caddy (HTTPS automático)

1) Crea `Caddyfile`:
```bash
cat > Caddyfile << 'EOF'
tu-dominio.com {
  encode zstd gzip

  # Forward al contenedor web (nginx interno)
  reverse_proxy web:80
}
EOF
```

2) Usa el compose con Caddy (ver sección “docker-compose (con caddy)” abajo):
```bash
docker compose up -d --build
```

---

## 6) docker-compose (con caddy) — ejemplo

Si quieres HTTPS en el mismo `docker compose`, puedes usar este `docker-compose.yml` (ajústalo si ya tienes uno):

```yaml
services:
  web:
    build: .
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web

volumes:
  caddy_data:
  caddy_config:
```

> Nota: Con Caddy no necesitas mapear `8080:80` del servicio `web`.

---

## 7) Actualizar la app

```bash
cd event-ticket-pro

git pull

docker compose up -d --build
```

---

## 8) Troubleshooting rápido

- **Pantalla en blanco**: suele ser `.env.local` ausente o variables `VITE_*` mal.
- **HTTPS no emite certificado**: revisa DNS (A record), puertos 80/443 abiertos, y logs de Caddy.
- Logs:
  ```bash
  docker compose logs -f --tail=200
  ```
