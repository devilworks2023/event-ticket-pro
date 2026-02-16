import React, { useEffect, useMemo, useState } from 'react'
import { Edit, Plus, Settings2, Trash2, Users } from 'lucide-react'
import { useAuth } from '../hooks/use-auth'
import { blink } from '../lib/blink'
import { isAdmin } from '../lib/roles'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

type BillingModel = 'commission' | 'subscription'

type AdminPromoterRow = {
  id: string
  promoterUserId: string
  promoterEmail: string
  status: string
  billingModel?: BillingModel
  platformCommissionPct?: number
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
}

export function AdminPromotersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AdminPromoterRow[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [promoterEmail, setPromoterEmail] = useState('')
  const [billingModel, setBillingModel] = useState<BillingModel>('commission')
  const [platformCommissionPct, setPlatformCommissionPct] = useState('3')

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPromoterRow | null>(null)
  const [editStatus, setEditStatus] = useState('active')
  const [editBillingModel, setEditBillingModel] = useState<BillingModel>('commission')
  const [editPlatformCommissionPct, setEditPlatformCommissionPct] = useState('3')

  const canSee = useMemo(() => isAdmin(user), [user])

  const load = async () => {
    try {
      setLoading(true)
      const result = await blink.functions.invoke('admin-promoters', {
        body: { action: 'list' },
      })
      setRows((result as any)?.promoters || [])
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar los promotores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    if (!canSee) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canSee])

  const createPromoter = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const pct = Number(platformCommissionPct)
      if (Number.isNaN(pct) || pct < 0) {
        toast.error('La comisión debe ser un número válido')
        return
      }

      await blink.functions.invoke('admin-promoters', {
        body: {
          action: 'linkPromoterByEmail',
          promoterEmail: promoterEmail.trim().toLowerCase(),
          settings: {
            billingModel,
            platformCommissionPct: pct,
          },
        },
      })

      toast.success('Promotor vinculado')
      setCreateOpen(false)
      setPromoterEmail('')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo vincular el promotor')
    }
  }

  const openEdit = (row: AdminPromoterRow) => {
    setEditing(row)
    setEditStatus(row.status || 'active')
    setEditBillingModel((row.billingModel || 'commission') as BillingModel)
    setEditPlatformCommissionPct(String(row.platformCommissionPct ?? 0))
    setEditOpen(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      const pct = Number(editPlatformCommissionPct)
      if (Number.isNaN(pct) || pct < 0) {
        toast.error('La comisión debe ser un número válido')
        return
      }

      await blink.functions.invoke('admin-promoters', {
        body: {
          action: 'update',
          linkId: editing.id,
          status: editStatus,
          settings: {
            billingModel: editBillingModel,
            platformCommissionPct: pct,
          },
        },
      })

      toast.success('Promotor actualizado')
      setEditOpen(false)
      setEditing(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar el promotor')
    }
  }

  const deleteLink = async (row: AdminPromoterRow) => {
    if (!confirm('¿Eliminar este promotor de tu lista?')) return
    try {
      // Optimistic
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      await blink.functions.invoke('admin-promoters', {
        body: { action: 'delete', linkId: row.id },
      })
      toast.success('Promotor eliminado')
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar el promotor')
      await load()
    }
  }

  if (!canSee) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Promotores</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta sección solo está disponible para administradores.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Promotores</h2>
          <p className="text-muted-foreground">Crea y configura promotores que gestionan sus propios eventos y vendedores.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> Nuevo promotor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular promotor por email</DialogTitle>
            </DialogHeader>
            <form onSubmit={createPromoter} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email del promotor</Label>
                <Input value={promoterEmail} onChange={(e) => setPromoterEmail(e.target.value)} type="email" placeholder="promotor@ejemplo.com" required />
                <p className="text-xs text-muted-foreground">El promotor debe haber creado su cuenta antes (login normal). Luego aquí lo vinculamos y le asignamos rol.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={billingModel} onValueChange={(v) => setBillingModel(v as BillingModel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commission">Comisión por venta</SelectItem>
                      <SelectItem value="subscription">Suscripción mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Comisión plataforma (%)</Label>
                  <Input value={platformCommissionPct} onChange={(e) => setPlatformCommissionPct(e.target.value)} inputMode="decimal" />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full">Vincular promotor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promotores activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Listado</CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <Settings2 className="mr-2 h-4 w-4" /> Recargar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground italic">Cargando promotores...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aún no hay promotores vinculados.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotor</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Comisión plataforma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{p.promoterEmail}</div>
                        <div className="text-xs text-muted-foreground italic">{p.promoterUserId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{p.billingModel || 'commission'}</TableCell>
                    <TableCell>{Number(p.platformCommissionPct || 0).toFixed(2)}%</TableCell>
                    <TableCell className="capitalize">{p.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteLink(p)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            <DialogTitle>Editar promotor</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={editBillingModel} onValueChange={(v) => setEditBillingModel(v as BillingModel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commission">Comisión por venta</SelectItem>
                    <SelectItem value="subscription">Suscripción mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comisión plataforma (%)</Label>
                <Input value={editPlatformCommissionPct} onChange={(e) => setEditPlatformCommissionPct(e.target.value)} inputMode="decimal" />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
