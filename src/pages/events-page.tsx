import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar as CalendarIcon, MapPin, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu'
import { blink } from '../lib/blink'
import { useAuth } from '../hooks/use-auth'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/badge'
import { TicketTypesDialog } from '../components/ticket-types-dialog'

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  status: string
  imageUrl: string
}

export function EventsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{id: string, title: string} | null>(null)
  const [isTicketsOpen, setIsTicketsOpen] = useState(false)
  
  const [newEvenTitle, setNewEventTitle] = useState('')
  const [newEvenDate, setNewEventDate] = useState('')
  const [newEvenLocation, setNewEventLocation] = useState('')

  const fetchEvents = async () => {
    try {
      const data = await blink.db.events.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setEvents(data as Event[])
    } catch (error) {
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchEvents()
  }, [user])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvenTitle || !newEvenDate) return

    try {
      await blink.db.events.create({
        title: newEvenTitle,
        date: newEvenDate,
        location: newEvenLocation,
        userId: user?.id,
        status: 'draft'
      })
      toast.success('Evento creado correctamente')
      setIsCreateOpen(false)
      setNewEventTitle('')
      setNewEventDate('')
      setNewEventLocation('')
      fetchEvents()
    } catch (error) {
      toast.error('Error al crear el evento')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return
    try {
      await blink.db.events.delete(id)
      toast.success('Evento eliminado')
      setEvents(events.filter(e => e.id !== id))
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="mt-0.5" onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
          <h2 className="text-2xl font-bold tracking-tight">Mis Eventos</h2>
          <p className="text-muted-foreground">Gestiona tus eventos y tipos de entrada.</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nombre del Evento</Label>
                <Input 
                  id="title" 
                  placeholder="Ej: Festival de Verano" 
                  value={newEvenTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input 
                    id="date" 
                    type="datetime-local" 
                    value={newEvenDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input 
                    id="location" 
                    placeholder="Lugar del evento" 
                    value={newEvenLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Crear Evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-xl" />
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No tienes eventos aún</h3>
          <p className="text-muted-foreground mb-6">Comienza creando tu primer evento para vender entradas.</p>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Crear Primer Evento</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <CalendarIcon className="h-12 w-12 text-primary/20" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={event.status === 'published' ? 'default' : 'secondary'} className="bg-white/90 backdrop-blur-sm text-foreground">
                    {event.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold truncate pr-4">{event.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Editar Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {event.location || 'Sin ubicación'}
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedEvent({ id: event.id, title: event.title })
                      setIsTicketsOpen(true)
                    }}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" /> Entradas
                  </Button>
                  <Button size="sm" className="flex-1">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> Gestionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedEvent && (
        <TicketTypesDialog 
          open={isTicketsOpen}
          onOpenChange={setIsTicketsOpen}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}
    </div>
  )
}
