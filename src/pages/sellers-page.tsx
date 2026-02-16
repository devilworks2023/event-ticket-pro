import React, { useState, useEffect } from 'react'
import { Users, UserPlus, TrendingUp, DollarSign, ExternalLink, Shield } from 'lucide-react'
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
import { blink } from '../lib/blink'
import { useAuth } from '../hooks/use-auth'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { CommissionTiersDialog } from '../components/commission-tiers-dialog'

interface Seller {
  id: string
  userId: string
  name: string
  status: string
  totalSales?: number
  commissionEarned?: number
}


export function SellersPage() {
  const { user } = useAuth()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [tiersOpen, setTiersOpen] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<{ id: string; name: string } | null>(null)

  const fetchSellers = async () => {
    try {
      if (!user) return
      const data = await blink.db.sellers.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      setSellers(data as Seller[])
    } catch (error) {
      toast.error('Error al cargar vendedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchSellers()
  }, [user])

  const handleInviteSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !user) return

    try {
      const email = inviteEmail.trim().toLowerCase()
      const name = email.split('@')[0]

      await blink.db.sellers.create({
        name,
        userId: user.id,
        status: 'pending',
      })

      await blink.db.sellerInvitations.create({
        email,
        sellerName: name,
        status: 'invited',
        userId: user.id,
      })

      await blink.notifications.email({
        to: email,
        subject: 'Invitación para vender entradas — Event Ticket Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Te han invitado como vendedor</h2>
            <p>Has sido invitado a vender entradas en <b>Event Ticket Pro</b>.</p>
            <p>Para participar, crea tu cuenta e inicia sesión con este email:</p>
            <p style="padding: 12px; background: #f6f6f6; border-radius: 8px;">${email}</p>
            <p>Si ya tienes cuenta, solo inicia sesión.</p>
          </div>
        `,
        text: `Te han invitado como vendedor en Event Ticket Pro. Crea tu cuenta e inicia sesión con: ${email}`,
      })

      toast.success('Invitación enviada')
      setIsInviteOpen(false)
      setInviteEmail('')
      fetchSellers()
    } catch (error) {
      toast.error('Error al invitar vendedor')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendedores y Afiliados</h2>
          <p className="text-muted-foreground">Gestiona tu red de ventas y configura comisiones.</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-elegant">
              <UserPlus className="mr-2 h-4 w-4" /> Invitar Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Vendedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteSeller} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email del Vendedor</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="vendedor@ejemplo.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se enviará un enlace de registro al vendedor. Una vez aceptado, podrá empezar a vender.
              </p>
              <DialogFooter>
                <Button type="submit" className="w-full">Enviar Invitación</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendedores Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales (Red)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones Pagadas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rendimiento Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listado de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground italic">Cargando vendedores...</div>
          ) : sellers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No tienes vendedores afiliados aún.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ventas (€)</TableHead>
                  <TableHead>Comisión (%)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{seller.name}</p>
                        <p className="text-xs text-muted-foreground italic">ID: {seller.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seller.status === 'active' ? 'default' : 'secondary'}>
                        {seller.status === 'active' ? 'Activo' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell>€0.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary text-primary">
                        Comisión Dinámica
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSeller({ id: seller.id, name: seller.name })
                          setTiersOpen(true)
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" /> Tramos
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {user && selectedSeller && (
        <CommissionTiersDialog
          open={tiersOpen}
          onOpenChange={setTiersOpen}
          sellerId={selectedSeller.id}
          sellerName={selectedSeller.name}
          ownerUserId={user.id}
        />
      )}
    </div>
  )
}
