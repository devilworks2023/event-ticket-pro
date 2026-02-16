import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="flex items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Política de privacidad</h1>
            <p className="mt-2 text-muted-foreground">
              Información sobre qué datos tratamos y con qué finalidad.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Volver</Link>
          </Button>
        </header>

        <section className="prose prose-slate max-w-none">
          <p>
            Esta es una página informativa. Sustituye este texto por tu política real (RGPD/LOPDGDD)
            antes de publicar.
          </p>
          <h2>Responsable</h2>
          <p>Event Ticket Pro (tu empresa) • contacto@tudominio.com</p>
          <h2>Datos</h2>
          <p>Podemos tratar datos de cuenta, compras, analíticas y soporte.</p>
          <h2>Finalidad</h2>
          <p>Gestión de entradas, pagos, control de acceso, prevención de fraude y soporte.</p>
          <h2>Derechos</h2>
          <p>Acceso, rectificación, supresión, oposición, limitación y portabilidad.</p>
        </section>
      </div>
    </main>
  )
}
