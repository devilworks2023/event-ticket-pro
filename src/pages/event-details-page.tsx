import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Ticket, Bus, ShieldCheck, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { BackButton } from '../components/navigation/back-button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { toast } from 'react-hot-toast'
import { FUNCTION_URLS } from '../lib/function-urls'

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  transportOptions?: string // JSON string
}

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  description: string
}

export function EventDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [includeTransport, setIncludeTransport] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = new URL(FUNCTION_URLS.publicEventDetails)
        url.searchParams.set('id', id || '')

        const res = await fetch(url.toString(), { method: 'GET' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const body = (await res.json()) as { event?: Event; ticketTypes?: TicketType[] }
        if (!body.event) throw new Error('Not found')

        setEvent(body.event)
        setTicketTypes(body.ticketTypes || [])
      } catch (error) {
        toast.error('Evento no encontrado')
        navigate('/events')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleQtyChange = (ticketId: string, delta: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketId] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [ticketId]: next }
    })
  }

  const totalPrice = ticketTypes.reduce((acc, t) => acc + (t.price * (selectedTickets[t.id] || 0)), 0)
  const totalQty = Object.values(selectedTickets).reduce((acc, q) => acc + q, 0)
  const transportCost = includeTransport ? totalQty * 15 : 0 // Mock 15€ per person
  const finalTotal = totalPrice + transportCost

  const handleCheckout = () => {
    if (totalQty === 0) {
      toast.error('Selecciona al menos una entrada')
      return
    }
    // navigate to checkout with state
    navigate(`/checkout/${id}`, { 
      state: { 
        selectedTickets, 
        includeTransport,
        total: finalTotal 
      } 
    })
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>
  if (!event) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Banner */}
      <div className="h-[40vh] relative">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/20">
            <Ticket size={80} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
           <div className="max-w-7xl mx-auto">
              <Badge className="mb-4 bg-primary text-white border-none">Próximo Evento</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-6 text-white/90">
                 <div className="flex items-center"><Calendar className="mr-2 h-5 w-5 text-primary" /> {new Date(event.date).toLocaleDateString()}</div>
                 <div className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> {event.location}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Tickets & Info */}
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Ticket className="mr-3 h-6 w-6 text-primary" /> Selección de Entradas
              </h2>
              <div className="space-y-4">
                 {ticketTypes.map(t => (
                   <div key={t.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-primary/30 transition-colors">
                      <div className="flex-1">
                         <h3 className="font-bold text-lg">{t.name}</h3>
                         <p className="text-sm text-muted-foreground mb-2">{t.description || 'Entrada general para el evento.'}</p>
                         <p className="text-primary font-bold">€{t.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <Button 
                           variant="outline" 
                           size="icon" 
                           onClick={() => handleQtyChange(t.id, -1)}
                           disabled={!selectedTickets[t.id]}
                         >-</Button>
                         <span className="w-8 text-center font-bold text-lg">{selectedTickets[t.id] || 0}</span>
                         <Button 
                           variant="outline" 
                           size="icon" 
                           onClick={() => handleQtyChange(t.id, 1)}
                           disabled={(selectedTickets[t.id] || 0) >= (t.quantity - t.sold)}
                         >+</Button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-4">Sobre el Evento</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description || 'No hay descripción disponible para este evento.'}
              </p>
           </section>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="space-y-6">
           <Card className="rounded-2xl shadow-lg border-none sticky top-24">
              <CardContent className="p-8">
                 <h3 className="text-xl font-bold mb-6">Resumen de Compra</h3>
                 <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                       <span>Entradas ({totalQty})</span>
                       <span className="font-bold">€{totalPrice.toFixed(2)}</span>
                    </div>
                    
                    {/* Transport Add-on */}
                    <div className="pt-4 border-t">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-sm font-medium">
                             <Bus className="mr-2 h-4 w-4 text-primary" /> Añadir Transporte
                          </div>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-primary rounded cursor-pointer" 
                            checked={includeTransport}
                            onChange={(e) => setIncludeTransport(e.target.checked)}
                          />
                       </div>
                       <p className="text-xs text-muted-foreground mb-2">Recogida y regreso en puntos designados (+15€ por persona).</p>
                       {includeTransport && (
                         <div className="flex justify-between text-sm text-primary font-bold">
                            <span>Coste Transporte</span>
                            <span>+€{transportCost.toFixed(2)}</span>
                         </div>
                       )}
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center text-xl font-bold">
                       <span>Total</span>
                       <span className="text-primary">€{finalTotal.toFixed(2)}</span>
                    </div>
                 </div>

                 <Button 
                   className="w-full h-14 text-lg font-bold rounded-xl shadow-elegant group" 
                   disabled={totalQty === 0}
                   onClick={handleCheckout}
                 >
                    Pagar Ahora
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                 </Button>

                 <div className="mt-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" /> Pago 100% Seguro
                 </div>
              </CardContent>
           </Card>

           <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <h4 className="font-bold text-primary mb-2 flex items-center">
                 <Ticket className="mr-2 h-4 w-4" /> ¿Eres vendedor?
              </h4>
              <p className="text-sm text-primary/80">Usa tu enlace de afiliado para obtener comisiones por cada venta.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
