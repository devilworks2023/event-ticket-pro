import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import toast from 'react-hot-toast'

type SetupStatus = { ok: true; initialized: boolean }

type RunResponse =
  | { ok: true; initialized: true; adminUserId?: string }
  | { ok: false; error: string }

async function safeJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { ok: false, error: text || 'Invalid response' }
  }
}

export function SetupPage() {
  const defaultApiUrl = useMemo(() => {
    // If web+api are behind same domain, allow relative proxy (/api)
    return `${window.location.protocol}//${window.location.hostname}:3001`
  }, [])

  const [apiUrl, setApiUrl] = useState(defaultApiUrl)
  const [checking, setChecking] = useState(true)
  const [initialized, setInitialized] = useState<boolean | null>(null)

  const [adminEmail, setAdminEmail] = useState('')
  const [adminDisplayName, setAdminDisplayName] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [running, setRunning] = useState(false)

  const checkStatus = async (baseUrl: string) => {
    setChecking(true)
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/setup/status`)
      const data = (await safeJson(res)) as SetupStatus
      if (!data?.ok) throw new Error('No se pudo leer el estado del instalador')
      setInitialized(Boolean(data.initialized))
    } catch (e: any) {
      setInitialized(null)
      toast.error(e?.message || 'No se pudo conectar con la API')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus(apiUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSetup = async () => {
    setRunning(true)
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/setup/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, adminDisplayName, adminPassword }),
      })

      const data = (await safeJson(res)) as RunResponse
      if (!data.ok) throw new Error(data.error)

      toast.success('Base de datos inicializada')
      setInitialized(true)
    } catch (e: any) {
      toast.error(e?.message || 'Error ejecutando instalador')
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Instalación · Event Ticket Pro</h1>
          <p className="text-muted-foreground mt-2">
            Configura la base de datos del backend self-hosted y crea (opcionalmente) el usuario administrador.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>1) Conectar con la API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL de la API</Label>
                <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://localhost:3001" />
                <p className="text-xs text-muted-foreground">
                  En Docker Compose suele ser <code>http://localhost:3001</code>.
                </p>
              </div>
              <Button variant="outline" onClick={() => checkStatus(apiUrl)} disabled={checking}>
                {checking ? 'Comprobando…' : 'Comprobar estado'}
              </Button>

              <div className="rounded-xl border p-4 text-sm">
                <p className="font-medium">Estado</p>
                {checking ? (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Spinner size="sm" />
                    <span>Consultando…</span>
                  </div>
                ) : initialized === null ? (
                  <p className="mt-2 text-destructive">No conectado</p>
                ) : initialized ? (
                  <p className="mt-2 text-primary">Inicializado</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">Pendiente de inicializar</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>2) Crear admin (opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email admin</Label>
                  <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@tu-dominio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={adminDisplayName} onChange={(e) => setAdminDisplayName(e.target.value)} placeholder="Administrador" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contraseña (se guarda hasheada)</Label>
                <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" />
                <p className="text-xs text-muted-foreground">
                  Si lo dejas vacío, se crea el admin sin contraseña.
                </p>
              </div>

              <Button onClick={runSetup} disabled={running || checking || initialized === true}>
                {running ? 'Inicializando…' : 'Inicializar base de datos'}
              </Button>

              {initialized && (
                <p className="text-xs text-muted-foreground">
                  La base de datos ya está inicializada. Si necesitas reiniciar, borra el volumen de Postgres y vuelve a ejecutar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
