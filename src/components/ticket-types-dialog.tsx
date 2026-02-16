import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Ticket as TicketIcon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog'
import { blink } from '../lib/blink'
import { toast } from 'react-hot-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../hooks/use-auth'

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  description: string
}

interface TicketTypesDialogProps {
  eventId: string
  eventTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketTypesDialog({ eventId, eventTitle, open, onOpenChange }: TicketTypesDialogProps) {
  const { user } = useAuth()
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  // New ticket state
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')

  const fetchTicketTypes = async () => {
    try {
      const data = await blink.db.ticketTypes.list({
        where: { eventId },
        orderBy: { createdAt: 'asc' }
      })
      setTicketTypes(data as TicketType[])
    } catch (error) {
      toast.error('Error al cargar tipos de entrada')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && eventId) {
      fetchTicketTypes()
    }
  }, [open, eventId])

  const handleAddTicketType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !quantity) return

    try {
      if (!user) {
        toast.error('Necesitas iniciar sesión para crear entradas')
        return
      }

      await blink.db.ticketTypes.create({
        userId: user.id,
        eventId,
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description
      })
      toast.success('Tipo de entrada añadido')
      setIsAdding(false)
      setName('')
      setPrice('')
      setQuantity('')
      setDescription('')
      fetchTicketTypes()
    } catch (error) {
      toast.error('Error al añadir entrada')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de entrada?')) return
    try {
      await blink.db.ticketTypes.delete(id)
      toast.success('Entrada eliminada')
      fetchTicketTypes()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tipos de Entrada: {eventTitle}</DialogTitle>
          <DialogDescription>
            Configura los diferentes tipos de entradas disponibles para este evento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isAdding ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center">
                  <TicketIcon className="mr-2 h-4 w-4" /> Entradas Configuradas
                </h3>
                <Button size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Añadir Tipo
                </Button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-muted-foreground italic">Cargando...</div>
              ) : ticketTypes.length === 0 ? (
                <div className="py-12 border-2 border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground">No hay tipos de entrada creados aún.</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Vendidas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketTypes.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.name}</TableCell>
                          <TableCell>€{ticket.price.toFixed(2)}</TableCell>
                          <TableCell>{ticket.quantity}</TableCell>
                          <TableCell>{ticket.sold}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(ticket.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddTicketType} className="space-y-4 border p-4 rounded-lg bg-slate-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t-name">Nombre de la Entrada</Label>
                  <Input 
                    id="t-name" 
                    placeholder="General, VIP, etc." 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-price">Precio (€)</Label>
                  <Input 
                    id="t-price" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-qty">Cantidad Disponible (Stock)</Label>
                <Input 
                  id="t-qty" 
                  type="number" 
                  placeholder="Ej: 500" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-desc">Descripción (Opcional)</Label>
                <Textarea 
                  id="t-desc" 
                  placeholder="Qué incluye esta entrada..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit">Guardar Entrada</Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
