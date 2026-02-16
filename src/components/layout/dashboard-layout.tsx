import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  TrendingUp, 
  Scan, 
  Settings, 
  LogOut,
  Calendar,
  Menu,
  X
} from 'lucide-react'
import { Button } from '../ui/button'
import { useAuth } from '../../hooks/use-auth'
import { cn } from '../../lib/utils'
import { isAdmin } from '../../lib/roles'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const admin = isAdmin(user)

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(admin ? [{ name: 'Promotores', href: '/dashboard/promoters', icon: Users }] : []),
    { name: 'Mis Eventos', href: '/dashboard/events', icon: Calendar },
    { name: 'Vendedores', href: '/dashboard/sellers', icon: Users },
    { name: 'Ventas', href: '/dashboard/sales', icon: TrendingUp },
    { name: 'Control de Acceso', href: '/dashboard/access', icon: Scan },
    { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b">
            <Ticket className="text-primary mr-2" />
            <span className="text-xl font-bold text-primary">EventTicket Pro</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="text-xs font-bold text-primary">
                  {user?.email?.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Organizador'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold capitalize">
            {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/events" target="_blank" rel="noreferrer">Ver Sitio Público</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard/events">Crear Evento</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
