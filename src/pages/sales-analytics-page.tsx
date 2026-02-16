import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { blink } from '../lib/blink'
import { toast } from 'react-hot-toast'
import { Users, MapPin, TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import { useAuth } from '../hooks/use-auth'

interface SaleData {
  demographicAge: number
  demographicGender: string
  geographyCity: string
  amount: number
  createdAt: string
}

const COLORS = ['#0D9488', '#2DD4BF', '#134E4A', '#5EEAD4', '#99F6E4']

export function SalesAnalyticsPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<SaleData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchSales = async () => {
      try {
        const data = await blink.db.sales.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        })
        setSales(data as SaleData[])
      } catch (error) {
        toast.error('Error al cargar analíticas')
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [user])

  // Process data for charts
  const genderData = [
    { name: 'Masculino', value: sales.filter(s => s.demographicGender === 'male').length },
    { name: 'Femenino', value: sales.filter(s => s.demographicGender === 'female').length },
    { name: 'Otro', value: sales.filter(s => s.demographicGender === 'other').length },
  ].filter(d => d.value > 0)

  const cityMap: Record<string, number> = {}
  sales.forEach(s => {
    cityMap[s.geographyCity] = (cityMap[s.geographyCity] || 0) + 1
  })
  const cityData = Object.entries(cityMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  const ageData = [
    { range: '18-24', value: sales.filter(s => s.demographicAge >= 18 && s.demographicAge <= 24).length },
    { range: '25-34', value: sales.filter(s => s.demographicAge >= 25 && s.demographicAge <= 34).length },
    { range: '35-44', value: sales.filter(s => s.demographicAge >= 35 && s.demographicAge <= 44).length },
    { range: '45+', value: sales.filter(s => s.demographicAge >= 45).length },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Seguimiento de Ventas</h2>
        <p className="text-muted-foreground">Analíticas detalladas por demografía y geografía.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{sales.length > 0 ? (sales.reduce((acc, s) => acc + s.amount, 0) / sales.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ciudad Principal</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{cityData[0]?.name || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rango de Edad</CardTitle>
            <PieChartIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ageData[0]?.range || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Ventas por Ciudad</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Distribución por Género</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                 {genderData.map((d, i) => (
                   <div key={i} className="flex items-center text-sm">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {d.name}: {d.value}
                   </div>
                 ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0D9488" fill="#0D9488" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
