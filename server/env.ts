import dotenv from 'dotenv'

dotenv.config({ path: process.env.DOTENV_PATH || '.env' })

type Env = {
  PORT: number
  DATABASE_URL: string
}

export function getEnv(): Env {
  const port = Number(process.env.PORT || 3001)
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL')
  }

  return {
    PORT: port,
    DATABASE_URL: databaseUrl,
  }
}
