import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function SupportPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="flex items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Soporte</h1>
            <p className="mt-2 text-muted-foreground">¿Necesitas ayuda? Contacta con nosotros.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Volver</Link>
          </Button>
        </header>

        <div className="rounded-2xl border bg-slate-50 p-6">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-lg font-semibold text-foreground">soporte@tudominio.com</p>
          <div className="h-px bg-border my-6" />
          <p className="text-sm text-muted-foreground">Horario</p>
          <p className="text-foreground">Lunes a Viernes, 9:00–18:00 (CET)</p>
        </div>
      </div>
    </main>
  )
}
