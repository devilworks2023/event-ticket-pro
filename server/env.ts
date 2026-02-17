import dotenv from 'dotenv'

// En Docker/producción solemos pasar variables vía `environment:` (docker compose / orquestador).
// Cargar `.env` en ese caso puede confundir ("injecting env (0)") y no aporta valor.
if (process.env.DOTENV_PATH || process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: process.env.DOTENV_PATH || '.env',
    // Nunca sobreescribir variables ya presentes (p.ej. inyectadas por Docker)
    override: false,
  })
}

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
