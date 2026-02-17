FROM oven/bun:1 AS deps
WORKDIR /app

# Install deps (uses root package.json)
# Nota: en algunos despliegues (p.ej. pull parcial), el lockfile puede no estar presente.
# Para evitar fallos de build, instalamos sin requerir bun.lock.
COPY package.json ./
RUN bun install

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY scripts ./scripts
COPY package.json ./package.json

EXPOSE 3001
CMD ["bun", "server/index.ts"]
