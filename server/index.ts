import Fastify from 'fastify'
import cors from '@fastify/cors'
import { getEnv } from './env'
import { getPool } from './db'
import { registerSetupRoutes } from './routes/setup'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
})

app.get('/health', async () => {
  const pool = getPool()
  const r = await pool.query('select 1 as ok')
  return { ok: true, db: r.rows?.[0]?.ok === 1 }
})

app.get('/v1/version', async () => {
  return {
    name: 'event-ticket-pro-api',
    runtime: 'bun',
  }
})

await registerSetupRoutes(app)

async function main() {
  const env = getEnv()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
