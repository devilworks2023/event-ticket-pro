import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './landing-page'
import { useAuth } from './hooks/use-auth'
import { Spinner } from './components/ui/spinner'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { EventsPage } from './pages/events-page'
import { SellersPage } from './pages/sellers-page'
import { AccessControlPage } from './pages/access-control-page'
import { SalesAnalyticsPage } from './pages/sales-analytics-page'
import { PublicEventsPage } from './pages/public-events-page'
import { SettingsPage } from './pages/settings-page'
import { AdminPromotersPage } from './pages/admin-promoters-page'
import { EventDetailsPage } from './pages/event-details-page'
import { CheckoutPage } from './pages/checkout-page'
import { SuccessPage } from './pages/success-page'
import { blink } from './lib/blink'
import { useEffect, useState } from 'react'

const DashboardHome = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({ sales: 0, tickets: 0, sellers: 0 })

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        const [sales, sellers] = await Promise.all([
          blink.db.sales.list({ where: { userId: user.id } }),
          blink.db.sellers.list({ where: { userId: user.id } }),
        ])

        const totalSales = (sales as any[]).reduce((acc: number, s: any) => acc + Number(s.amount || 0), 0)

        setStats({
          sales: totalSales,
          tickets: (sales as any[]).length,
          sellers: (sellers as any[]).length,
        })
      } catch (e) {
        console.error(e)
      }
    }

    fetchStats()
  }, [user])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <p className="text-sm text-muted-foreground mb-1 font-medium">Ventas Totales</p>
        <p className="text-3xl font-bold text-primary">€{stats.sales.toFixed(2)}</p>
      </div>
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <p className="text-sm text-muted-foreground mb-1 font-medium">Entradas Vendidas</p>
        <p className="text-3xl font-bold text-primary">{stats.tickets}</p>
      </div>
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <p className="text-sm text-muted-foreground mb-1 font-medium">Vendedores Activos</p>
        <p className="text-3xl font-bold text-primary">{stats.sellers}</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
        
        {/* Public Routes */}
        <Route path="/events" element={<PublicEventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/checkout/:id" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <Routes>
                  <Route index element={<DashboardHome />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="sellers" element={<SellersPage />} />
                  <Route path="sales" element={<SalesAnalyticsPage />} />
                  <Route path="access" element={<AccessControlPage />} />
                  <Route path="promoters" element={<AdminPromotersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
      </Routes>
    </Router>
  )
}