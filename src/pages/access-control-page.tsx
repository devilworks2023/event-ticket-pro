import React, { useState } from 'react'
import { Scan, Search, CheckCircle2, XCircle, User, Calendar, Ticket, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { blink } from '../lib/blink'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../hooks/use-auth'

interface SaleRecord {
  id: string
  qrCode: string
  buyerId: string
  status: string
  eventTitle?: string
}

export function AccessControlPage() {
  const { user } = useAuth()
  const [qrInput, setQrInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<SaleRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrInput) return

    setIsScanning(true)
    setError(null)
    setResult(null)

    try {
      if (!user) {
        setError('Necesitas iniciar sesión para validar entradas')
        return
      }

      const data = await blink.db.sales.list({
        where: { userId: user.id, qrCode: qrInput }
      })

      if (data.length === 0) {
        setError('Entrada no encontrada o código inválido')
      } else {
        const sale = data[0] as SaleRecord
        if (sale.status === 'checked-in') {
          setError('Esta entrada ya ha sido escaneada anteriormente')
        } else if (sale.status !== 'completed') {
          setError('Esta entrada no es válida (Estado: ' + sale.status + ')')
        } else {
          setResult(sale)
          // Update status to checked-in
          await blink.db.sales.update(sale.id, { status: 'checked-in' })
          toast.success('¡Check-in completado!')
        }
      }
    } catch (error) {
      toast.error('Error al verificar entrada')
    } finally {
      setIsScanning(false)
    }
  }

  const reset = () => {
    setQrInput('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
           <Scan size={32} />
        </div>
        <h2 className="text-3xl font-bold">Control de Acceso</h2>
        <p className="text-muted-foreground">Escanea el código QR o introduce el código manualmente para validar la entrada.</p>
      </div>

      <Card className="rounded-2xl shadow-lg border-none">
        <CardContent className="p-8">
          {!result && !error ? (
            <form onSubmit={handleManualCheckin} className="space-y-6">
              <div className="space-y-4">
                <div className="h-48 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden group">
                   <Scan size={48} className="mb-2 opacity-20 group-hover:scale-110 transition-transform" />
                   <p className="text-sm font-medium">Pulsa para abrir la cámara</p>
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <Search className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <Input 
                    placeholder="Introduce el código manual (Ej: QR_ABC123)" 
                    className="pl-10 h-14 rounded-xl border-slate-200"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-elegant" disabled={isScanning}>
                {isScanning ? 'Verificando...' : 'Validar Entrada'}
              </Button>
            </form>
          ) : result ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                 <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600">Entrada Válida</h3>
                <p className="text-muted-foreground mt-1">Check-in realizado correctamente</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl space-y-4 text-left border">
                 <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                       <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Comprador</p>
                       <p className="font-medium">{result.buyerId}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-primary" />
                    <div>
                       <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Código QR</p>
                       <p className="font-mono font-bold">{result.qrCode}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                       <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Estado</p>
                       <Badge className="bg-green-500">ACCESO CONCEDIDO</Badge>
                    </div>
                 </div>
              </div>

              <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl">Escanear Otra Entrada</Button>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
                 <XCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600">Entrada Inválida</h3>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl">Reintentar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-50">
         <ShieldCheck className="h-4 w-4" /> Sistema de Seguridad EventTicket Pro
      </div>
    </div>
  )
}
