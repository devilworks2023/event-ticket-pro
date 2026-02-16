import React, { useEffect, useMemo, useState } from 'react'
import { Users, UserPlus, TrendingUp, DollarSign, ExternalLink, Shield, Edit, Trash2 } from 'lucide-react'
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
import { isAdmin } from '../lib/roles'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

interface Seller {
  id: string
  userId: string
  name: string
  status: string
  totalSales?: number
  commissionEarned?: number
}

type AdminPromoterRow = {
  id: string
  promoterUserId: string
  promoterEmail: string
  status: string
}


export function SellersPage() {
  const { user } = useAuth()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [tiersOpen, setTiersOpen] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<{ id: string; name: string } | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState<'pending' | 'active'>('pending')

  const [promoters, setPromoters] = useState<AdminPromoterRow[]>([])
  const [selectedPromoterUserId, setSelectedPromoterUserId] = useState<string>('')

  const canAdmin = useMemo(() => isAdmin(user), [user])

  const fetchPromotersIfAdmin = async () => {
    if (!canAdmin || !user) return
    try {
      const result = await blink.functions.invoke('admin-promoters', {
        body: { action: 'list' },
      })
      const rows = ((result as any)?.promoters || []) as AdminPromoterRow[]
      setPromoters(rows)
      if (!selectedPromoterUserId && rows.length > 0) {
        setSelectedPromoterUserId(rows[0].promoterUserId)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error al cargar promotores')
    }
  }

  const fetchSellers = async () => {
    try {
      if (!user) return
      if (canAdmin) {
        if (!selectedPromoterUserId) {
          setSellers([])
          return
        }
        const result = await blink.functions.invoke('admin-sellers', {
          body: { action: 'list', promoterUserId: selectedPromoterUserId },
        })
        setSellers(((result as any)?.sellers || []) as Seller[])
      } else {
        const data = await blink.db.sellers.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        })
        setSellers(data as Seller[])
      }
    } catch (error) {
      toast.error('Error al cargar vendedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    if (canAdmin) {
      fetchPromotersIfAdmin().finally(() => {
        // sellers are fetched in next effect once selectedPromoterUserId exists
      })
    } else {
      fetchSellers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canAdmin])

  useEffect(() => {
    if (!user) return
    if (!canAdmin) return
    setLoading(true)
    fetchSellers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPromoterUserId, canAdmin, user?.id])

  const openEdit = (seller: Seller) => {
    setSelectedSeller({ id: seller.id, name: seller.name })
    setEditName(seller.name || '')
    setEditStatus((seller.status as any) === 'active' ? 'active' : 'pending')
    setEditOpen(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSeller) return
    try {
      if (canAdmin) {
        if (!selectedPromoterUserId) {
          toast.error('Selecciona un promotor')
          return
        }
        await blink.functions.invoke('admin-sellers', {
          body: {
            action: 'update',
            promoterUserId: selectedPromoterUserId,
            sellerId: selectedSeller.id,
            patch: { name: editName.trim(), status: editStatus },
          },
        })
      } else {
        await blink.db.sellers.update(selectedSeller.id, {
          name: editName.trim(),
          status: editStatus,
        })
      }

      toast.success('Vendedor actualizado')
      setEditOpen(false)
      await fetchSellers()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar el vendedor')
    }
  }

  const deleteSeller = async (sellerId: string) => {
    if (!confirm('¿Eliminar este vendedor?')) return
    try {
      // Optimistic
      setSellers((prev) => prev.filter((s) => s.id !== sellerId))

      if (canAdmin) {
        if (!selectedPromoterUserId) throw new Error('Selecciona un promotor')
        await blink.functions.invoke('admin-sellers', {
          body: { action: 'delete', promoterUserId: selectedPromoterUserId, sellerId },
        })
      } else {
        await blink.db.sellers.delete(sellerId)
      }

      toast.success('Vendedor eliminado')
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar')
      await fetchSellers()
    }
  }

  const handleInviteSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !user) return

    try {
      if (canAdmin) {
        toast.error('Invita vendedores desde la cuenta del promotor (por ahora).')
        return
      }

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

        {canAdmin ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-muted-foreground">Promotor</div>
            <Select value={selectedPromoterUserId} onValueChange={setSelectedPromoterUserId}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Selecciona un promotor" />
              </SelectTrigger>
              <SelectContent>
                {promoters.map((p) => (
                  <SelectItem key={p.id} value={p.promoterUserId}>
                    {p.promoterEmail}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
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
        )}
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
                      <Button variant="ghost" size="sm" onClick={() => openEdit(seller)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSeller(seller.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Abrir">
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar vendedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {user && selectedSeller && (
        <CommissionTiersDialog
          open={tiersOpen}
          onOpenChange={setTiersOpen}
          sellerId={selectedSeller.id}
          sellerName={selectedSeller.name}
          ownerUserId={canAdmin ? selectedPromoterUserId : user.id}
        />
      )}
    </div>
  )
}
