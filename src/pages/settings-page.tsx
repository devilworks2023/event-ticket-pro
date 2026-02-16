import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { useAuth } from '../hooks/use-auth'
import { blink } from '../lib/blink'
import { toast } from 'react-hot-toast'

type BillingModel = 'commission' | 'subscription'

export function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [displayName, setDisplayName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [billingModel, setBillingModel] = useState<BillingModel>('commission')
  const [subscriptionPlan, setSubscriptionPlan] = useState<'starter' | 'pro'>('starter')
  const [subscriptionActive, setSubscriptionActive] = useState(false)

  const planPrice = useMemo(() => (subscriptionPlan === 'starter' ? 29 : 79), [subscriptionPlan])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        setDisplayName(user.displayName || '')
        setContactEmail(user.email || '')

        const subs = await blink.db.subscriptions.list({
          where: { userId: user.id },
          limit: 1,
          orderBy: { createdAt: 'desc' },
        })

        if (subs.length > 0) {
          const s: any = subs[0]
          if (s.plan === 'commission') {
            setBillingModel('commission')
            setSubscriptionActive(false)
          } else {
            setBillingModel('subscription')
            setSubscriptionPlan(s.plan === 'pro' ? 'pro' : 'starter')
            setSubscriptionActive(s.status === 'active')
          }
        }
      } catch (e) {
        toast.error('No se pudieron cargar los ajustes')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const saveProfile = async () => {
    try {
      await blink.auth.updateMe({ displayName })
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar el perfil')
    }
  }

  const saveBilling = async () => {
    if (!user) return

    try {
      // Upsert-like: we create a new record as the current config snapshot.
      await blink.db.subscriptions.create({
        userId: user.id,
        plan: billingModel === 'commission' ? 'commission' : subscriptionPlan,
        status: billingModel === 'commission' ? 'active' : subscriptionActive ? 'active' : 'inactive',
      })

      toast.success('Ajustes de facturación guardados')
    } catch {
      toast.error('Error al guardar facturación')
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando ajustes...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ajustes</h2>
        <p className="text-muted-foreground">Configura tu perfil y el modelo de monetización.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Perfil del organizador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre a mostrar</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input value={contactEmail} disabled />
              <p className="text-xs text-muted-foreground">Este email se usa para comunicaciones y notificaciones.</p>
            </div>
            <Button onClick={saveProfile} className="shadow-elegant">Guardar perfil</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Facturación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={billingModel} onValueChange={(v) => setBillingModel(v as BillingModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Comisión incluida en cada compra</SelectItem>
                  <SelectItem value="subscription">Suscripción mensual (sin comisión por ticket)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define cómo monetizas: comisión por compra o una cuota mensual.
              </p>
            </div>

            {billingModel === 'subscription' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={subscriptionPlan} onValueChange={(v) => setSubscriptionPlan(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter — €29/mes</SelectItem>
                      <SelectItem value="pro">Pro — €79/mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Suscripción activa</p>
                    <p className="text-xs text-muted-foreground">(Se activa automáticamente tras el pago)</p>
                  </div>
                  <Switch checked={subscriptionActive} onCheckedChange={setSubscriptionActive} />
                </div>

                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Precio actual</p>
                  <p className="text-2xl font-bold text-primary">€{planPrice}/mes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nota: el cobro real se habilita en la siguiente fase cuando conectemos Stripe Billing.
                  </p>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={saveBilling}>Guardar facturación</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Stripe (requerido para pagos)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Para habilitar pagos con tarjeta / Apple Pay / Google Pay debes añadir los secretos <code>STRIPE_SECRET_KEY</code> y <code>STRIPE_WEBHOOK_SECRET</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
