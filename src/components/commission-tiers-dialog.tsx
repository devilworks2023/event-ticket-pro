import React, { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { blink } from '../lib/blink'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { toast } from 'react-hot-toast'

type Tier = {
  id: string
  sellerId: string
  minSales: number
  maxSales: number | null
  percentage: number
  userId: string
}

export function CommissionTiersDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sellerId: string
  sellerName: string
  ownerUserId: string
}) {
  const { open, onOpenChange, sellerId, sellerName, ownerUserId } = props

  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)

  const [minSales, setMinSales] = useState('0')
  const [maxSales, setMaxSales] = useState('')
  const [percentage, setPercentage] = useState('5')

  const canSave = useMemo(() => {
    const min = Number(minSales)
    const max = maxSales.trim() === '' ? null : Number(maxSales)
    const pct = Number(percentage)
    if (Number.isNaN(min) || min < 0) return false
    if (max !== null && (Number.isNaN(max) || max <= min)) return false
    if (Number.isNaN(pct) || pct < 0) return false
    return true
  }, [minSales, maxSales, percentage])

  const load = async () => {
    try {
      setLoading(true)
      const data = await blink.db.commissionTiers.list({
        where: { AND: [{ userId: ownerUserId }, { sellerId }] },
        orderBy: { minSales: 'asc' },
      })
      setTiers(data as any)
    } catch {
      toast.error('No se pudieron cargar los tramos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sellerId])

  const addTier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return

    try {
      await blink.db.commissionTiers.create({
        sellerId,
        minSales: String(Number(minSales)),
        maxSales: maxSales.trim() === '' ? null : String(Number(maxSales)),
        percentage: String(Number(percentage)),
        userId: ownerUserId,
      })
      toast.success('Tramo añadido')
      setMinSales('0')
      setMaxSales('')
      setPercentage('5')
      load()
    } catch {
      toast.error('No se pudo añadir el tramo')
    }
  }

  const removeTier = async (id: string) => {
    try {
      await blink.db.commissionTiers.delete(id)
      setTiers((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tramo eliminado')
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tramos de comisión — {sellerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground italic">Cargando...</div>
          ) : tiers.length === 0 ? (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              No hay tramos aún. Añade el primero abajo.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mín. ventas (€)</TableHead>
                  <TableHead>Máx. ventas (€)</TableHead>
                  <TableHead>Comisión (%)</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{Number(t.minSales).toFixed(2)}</TableCell>
                    <TableCell>{t.maxSales === null ? '—' : Number(t.maxSales).toFixed(2)}</TableCell>
                    <TableCell>{Number(t.percentage).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeTier(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <form onSubmit={addTier} className="rounded-xl border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Mín. ventas (€)</Label>
                <Input value={minSales} onChange={(e) => setMinSales(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label>Máx. ventas (€) (opcional)</Label>
                <Input value={maxSales} onChange={(e) => setMaxSales(e.target.value)} inputMode="decimal" placeholder="sin límite" />
              </div>
              <div className="space-y-1">
                <Label>Comisión (%)</Label>
                <Input value={percentage} onChange={(e) => setPercentage(e.target.value)} inputMode="decimal" />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!canSave}>
                Añadir tramo
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
