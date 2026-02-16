import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { FUNCTION_URLS } from '../lib/function-urls'

type OrderResponse =
  | { ready: false }
  | {
      ready: true
      buyerEmail: string
      eventTitle: string | null
      codes: Array<{ qrCode: string; status: string }>
    }

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export function SuccessPage() {
  const query = useQuery()
  const sessionId = query.get('session_id')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = async () => {
    if (!sessionId) {
      setError('Falta session_id. Vuelve a intentarlo desde el checkout.')
      setLoading(false)
      return
    }

    if (!FUNCTION_URLS.getOrder) {
      setError('El backend de pedidos no está desplegado aún.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(FUNCTION_URLS.getOrder, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = (await res.json()) as OrderResponse
      if (!res.ok) throw new Error((data as any)?.error || 'Error cargando pedido')

      setOrder(data)
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-primary p-10 text-white text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-5" />
          <h1 className="text-3xl font-bold">Pago completado</h1>
          <p className="opacity-80 mt-2">Estamos generando tus entradas y enviándolas por email.</p>
        </div>

        <CardContent className="p-8 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground py-10">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando tu compra…
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchOrder} className="w-full">
                Reintentar
              </Button>
            </div>
          ) : order?.ready ? (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6">
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Evento</p>
                <p className="text-lg font-bold mt-1">{order.eventTitle || '—'}</p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">Códigos QR</p>
                <div className="space-y-2">
                  {order.codes.map((c) => (
                    <div key={c.qrCode} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border">
                      <span className="font-mono font-bold tracking-tight">{c.qrCode}</span>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4 text-left p-4 bg-primary/5 rounded-xl border border-primary/10">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Entrada enviada por email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hemos enviado una copia a <strong>{order.buyerEmail}</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full font-bold h-12 rounded-xl" asChild>
                  <Link to="/events">Explorar más eventos</Link>
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                  <Link to="/" className="flex items-center justify-center">
                    Volver al inicio <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tu pago está confirmado, pero el pedido aún se está procesando (webhook). Puedes refrescar en unos segundos.
              </p>
              <Button variant="outline" onClick={fetchOrder} className="w-full">
                Actualizar estado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
