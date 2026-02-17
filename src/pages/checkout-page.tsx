import React, { useState } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { ShieldCheck, CreditCard, ChevronLeft, MapPin, User, Mail } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { FUNCTION_URLS } from '../lib/function-urls'
import { toast } from 'react-hot-toast'

export function CheckoutPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state as any) || { selectedTickets: {}, includeTransport: false, total: 0 }
  const selectedTickets = (state.selectedTickets || {}) as Record<string, number>
  const includeTransport = Boolean(state.includeTransport)
  const total = Number(state.total || 0)

  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!total) {
    return <Navigate to={`/events/${id}`} />
  }

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !city || !age || !gender) {
      toast.error('Por favor completa todos los campos demográficos')
      return
    }

    if (!FUNCTION_URLS.stripeCreateCheckoutSession) {
      toast.error('Pagos no configurados aún (falta conectar Stripe)')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch(FUNCTION_URLS.stripeCreateCheckoutSession, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          selectedTickets,
          includeTransport,
          buyerEmail: email,
          demographicAge: Number(age),
          demographicGender: gender,
          geographyCity: city,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/events/${id}`,
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Error creando el checkout')
      }

      if (data?.url) {
        window.open(data.url, '_blank')
        toast.success('Abriendo pago seguro en Stripe…')
      } else {
        throw new Error('Stripe no devolvió URL de pago')
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Error al iniciar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver al evento
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-none">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" /> Datos del Comprador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompletePurchase} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Envío</Label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        id="email" 
                        type="email" 
                        placeholder="tu@email.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Edad</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="Ej: 25" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Género</Label>
                      <Select value={gender} onValueChange={setGender} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Femenino</SelectItem>
                          <SelectItem value="other">Otro / Prefiero no decir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad / Provincia</Label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        id="city" 
                        placeholder="Ej: Madrid" 
                        className="pl-10"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t mt-8">
                     <h3 className="font-bold mb-4 flex items-center">
                       <CreditCard className="mr-2 h-5 w-5 text-primary" /> Método de Pago
                     </h3>
                     <div className="space-y-3">
                        <div className="p-4 border-2 border-primary rounded-xl bg-primary/5 flex items-center justify-between">
                           <span className="font-medium">Tarjeta / Apple Pay / Google Pay</span>
                           <div className="flex gap-2">
                              <div className="w-8 h-5 bg-slate-200 rounded" />
                              <div className="w-8 h-5 bg-slate-200 rounded" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-xl mt-8 shadow-elegant"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Procesando...' : `Pagar €${total.toFixed(2)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-none bg-primary text-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6">Detalle de tu pedido</h3>
                <div className="space-y-4">
                   <div className="flex justify-between text-white/80">
                      <span>Total Entradas</span>
                      <span className="font-bold">€{(total - (includeTransport ? (Object.values(selectedTickets).reduce((a, b) => Number(a) + Number(b), 0) * 15) : 0)).toFixed(2)}</span>
                   </div>
                   {includeTransport && (
                     <div className="flex justify-between text-white/80">
                        <span>Transporte Incluido</span>
                        <span className="font-bold">€{(Object.values(selectedTickets).reduce((a,b)=>a+b,0) * 15).toFixed(2)}</span>
                     </div>
                   )}
                   <div className="pt-4 border-t border-white/20 flex justify-between items-center text-2xl font-bold">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-white rounded-2xl border flex items-start gap-4">
               <ShieldCheck className="h-6 w-6 text-green-500 shrink-0" />
               <div>
                  <h4 className="font-bold text-sm">Garantía EventTicket Pro</h4>
                  <p className="text-xs text-muted-foreground mt-1">Tus entradas son 100% auténticas y seguras. Recibirás tu código QR al instante tras el pago.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
