import type { FastifyInstance } from 'fastify'
import { randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPool } from '../db'

type SetupStatusResponse = {
  ok: true
  initialized: boolean
}

type SetupRunBody = {
  adminEmail?: string
  adminDisplayName?: string
  adminPassword?: string
}

type SetupRunResponse =
  | { ok: true; initialized: true; adminUserId?: string }
  | { ok: false; error: string }

function getScriptsDir(): string {
  // Works in ESM under Bun
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  return path.resolve(__dirname, '../../scripts')
}

function hashPassword(password: string): string {
  const salt = randomUUID().replace(/-/g, '')
  const key = scryptSync(password, salt, 32)
  return `scrypt$${salt}$${key.toString('hex')}`
}

// (future use) kept for completeness
export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hex] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hex) return false
  const key = scryptSync(password, salt, 32)
  return timingSafeEqual(Buffer.from(hex, 'hex'), key)
}

async function isInitialized(): Promise<boolean> {
  const pool = getPool()
  const r = await pool.query(
    `select 1 as ok
     from information_schema.tables
     where table_schema='public' and table_name='users'
     limit 1`,
  )
  return r.rowCount > 0
}

async function ensureSchema(): Promise<void> {
  const pool = getPool()
  const schemaPath = path.join(getScriptsDir(), 'postgres-schema.sql')
  const sql = await readFile(schemaPath, 'utf8')

  await pool.query('begin')
  try {
    await pool.query(sql)

    // Ensure password column exists (installer can create admin with password)
    await pool.query(`alter table users add column if not exists password_hash text`)

    await pool.query('commit')
  } catch (e) {
    await pool.query('rollback')
    throw e
  }
}

async function createAdminUser(args: {
  email: string
  displayName?: string
  password?: string
}): Promise<string> {
  const pool = getPool()
  const id = `usr_${randomUUID()}`

  const passwordHash = args.password ? hashPassword(args.password) : null

  await pool.query(
    `insert into users (id, email, display_name, role, password_hash)
     values ($1, $2, $3, 'admin', $4)
     on conflict (id) do nothing`,
    [id, args.email, args.displayName || null, passwordHash],
  )

  return id
}

export async function registerSetupRoutes(app: FastifyInstance) {
  app.get<{ Reply: SetupStatusResponse }>('/setup/status', async () => {
    const initialized = await isInitialized()
    return { ok: true, initialized }
  })

  app.post<{ Body: SetupRunBody; Reply: SetupRunResponse }>('/setup/run', async (req) => {
    try {
      const already = await isInitialized()
      if (already) return { ok: true, initialized: true }

      await ensureSchema()

      const { adminEmail, adminDisplayName, adminPassword } = req.body || {}
      if (adminEmail) {
        const adminUserId = await createAdminUser({
          email: adminEmail,
          displayName: adminDisplayName,
          password: adminPassword,
        })

        return { ok: true, initialized: true, adminUserId }
      }

      return { ok: true, initialized: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Setup failed' }
    }
  })
}
