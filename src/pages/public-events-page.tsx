import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Search, Ticket } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Link } from 'react-router-dom'
import { FUNCTION_URLS } from '../lib/function-urls'

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  status: string
}

export function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const res = await fetch(FUNCTION_URLS.publicEvents, { method: 'GET' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = (await res.json()) as { events?: Event[] }
        setEvents(body.events || [])
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const now = new Date()
  const activeEvents = events.filter((e) => {
    const eventDate = new Date(e.date)
    if (Number.isNaN(eventDate.getTime())) return false
    return eventDate.getTime() >= now.getTime()
  })

  const filteredEvents = activeEvents
    .filter((e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-primary pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-6 h-full w-full">
             {[...Array(24)].map((_, i) => <div key={i} className="border-r border-b border-white" />)}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center mb-8">
             <Ticket className="h-6 w-6 mr-2" />
             <span className="font-bold text-lg">EventTicket Pro</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Encuentra tu próximo evento</h1>
          <div className="max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Busca por nombre o ciudad..." 
              className="pl-12 h-14 bg-white text-foreground rounded-xl shadow-lg border-none focus-visible:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
             {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
             <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
             <h3 className="text-2xl font-bold mb-2">No se encontraron eventos</h3>
             <p className="text-muted-foreground">Prueba con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {filteredEvents.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-2xl border-none shadow-md">
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Calendar className="h-12 w-12 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                       <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none font-bold">
                         Desde €0.00
                       </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        {event.location}
                      </div>
                    </div>
                    <Button className="w-full mt-6 rounded-xl font-bold">Ver Entradas</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
