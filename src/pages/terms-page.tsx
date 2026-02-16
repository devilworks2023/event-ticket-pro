import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="flex items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Términos y condiciones</h1>
            <p className="mt-2 text-muted-foreground">Condiciones de uso de la plataforma.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Volver</Link>
          </Button>
        </header>

        <section className="prose prose-slate max-w-none">
          <p>
            Esta es una plantilla. Sustituye este texto por tus términos reales antes de publicar.
          </p>
          <h2>Uso del servicio</h2>
          <p>El organizador es responsable del evento, precios, devoluciones y atención al cliente.</p>
          <h2>Pagos</h2>
          <p>Los pagos se procesan a través de proveedores externos (p. ej. Stripe).</p>
          <h2>Limitación de responsabilidad</h2>
          <p>La plataforma proporciona herramientas; no garantiza asistencia presencial ni aforo.</p>
        </section>
      </div>
    </main>
  )
}
