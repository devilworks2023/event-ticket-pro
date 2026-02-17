# Build stage
FROM oven/bun:1 AS build
WORKDIR /app

# Nota: en algunos despliegues el lockfile puede no estar presente.
# Para evitar fallos de build, instalamos sin requerir bun.lock.
COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

# Runtime stage
FROM nginx:alpine

# SPA routing
RUN printf "server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n" > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
