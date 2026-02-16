FROM oven/bun:1 AS deps
WORKDIR /app

# Install deps (uses root package.json)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY package.json ./package.json

EXPOSE 3001
CMD ["bun", "server/index.ts"]
