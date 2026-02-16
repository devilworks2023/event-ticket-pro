import React from 'react'
import { useAuth } from './hooks/use-auth'
import { Button } from './components/ui/button'
import { Ticket, ShieldCheck, Zap, BarChart3, Users, Globe } from 'lucide-react'

export function LandingPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Ticket className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">EventTicket Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Características</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Precios</a>
              <Button onClick={login} size="sm">Iniciar Sesión</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Zap className="w-3 h-3 mr-2" />
            La plataforma definitiva para tus eventos
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8">
            Vende entradas con <span className="text-primary italic">estilo y control</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestiona accesos, taquilla virtual, vendedores afiliados y analíticas en tiempo real. 
            Todo en una sola plataforma profesional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 h-12 text-base" onClick={login}>Empezar Ahora</Button>
            <Button size="lg" variant="outline" className="px-8 h-12 text-base">Ver Demo</Button>
          </div>

          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="aspect-[16/9] bg-slate-100 rounded-2xl shadow-2xl border overflow-hidden flex items-center justify-center text-muted-foreground">
               {/* Mock Dashboard Image or Graphic */}
               <BarChart3 className="w-20 h-20 opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Potencia tu evento al máximo</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Herramientas diseñadas para organizadores exigentes que buscan eficiencia y datos precisos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Control de Acceso', 
                desc: 'App de escaneo QR ultra rápida para gestionar entradas sin esperas.',
                icon: ShieldCheck
              },
              { 
                title: 'Vendedores Affiliados', 
                desc: 'Añade vendedores con comisiones por tramos automáticas.',
                icon: Users
              },
              { 
                title: 'Analíticas 360°', 
                desc: 'Seguimiento por zonas geográficas, edades, género y más.',
                icon: BarChart3
              },
              { 
                title: 'Pagos Integrados', 
                desc: 'Acepta Apple Pay, Google Pay y tarjetas de todo el mundo.',
                icon: Globe
              },
              { 
                title: 'Transporte & Add-ons', 
                desc: 'Añade opciones de transporte o servicios extra en la compra.',
                icon: Zap
              },
              { 
                title: 'Taquilla Virtual', 
                desc: 'Gestiona tipos de entrada editables y stock en tiempo real.',
                icon: Ticket
              }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Precios claros, escalables</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Empieza con comisión por ticket o pasa a suscripción mensual cuando tu volumen crezca.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border bg-slate-50 p-8">
              <p className="text-sm font-bold text-primary">Comisión</p>
              <p className="text-4xl font-bold mt-3">0€<span className="text-base font-medium text-muted-foreground">/mes</span></p>
              <p className="text-sm text-muted-foreground mt-2">Paga una comisión por cada entrada vendida.</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li>• Stripe Checkout (Apple Pay / Google Pay)</li>
                <li>• Email con QR por compra</li>
                <li>• Panel de ventas y analíticas</li>
              </ul>
              <Button className="w-full mt-8" onClick={login}>Empezar</Button>
            </div>

            <div className="rounded-2xl border-2 border-primary bg-white p-8 shadow-lg">
              <p className="text-sm font-bold text-primary">Starter</p>
              <p className="text-4xl font-bold mt-3">29€<span className="text-base font-medium text-muted-foreground">/mes</span></p>
              <p className="text-sm text-muted-foreground mt-2">Sin comisión por ticket. Ideal para equipos pequeños.</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li>• 5 eventos activos</li>
                <li>• Vendedores y comisiones por tramos</li>
                <li>• Export de ventas</li>
              </ul>
              <Button className="w-full mt-8 shadow-elegant" onClick={login}>Probar Starter</Button>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-8">
              <p className="text-sm font-bold text-primary">Pro</p>
              <p className="text-4xl font-bold mt-3">79€<span className="text-base font-medium text-muted-foreground">/mes</span></p>
              <p className="text-sm text-muted-foreground mt-2">Para organizadores con alto volumen y soporte prioritario.</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li>• Eventos ilimitados</li>
                <li>• Analíticas avanzadas</li>
                <li>• Soporte prioritario</li>
              </ul>
              <Button variant="outline" className="w-full mt-8" onClick={login}>Hablar con ventas</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold text-primary">EventTicket Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 EventTicket Pro. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacidad</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Términos</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
