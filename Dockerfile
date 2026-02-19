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
# Avoid nginx to reduce Docker Hub pulls (and TLS handshake timeouts on some servers)
FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY scripts/static-web-server.ts ./static-web-server.ts

EXPOSE 80
CMD ["bun", "static-web-server.ts"]
