import type { BlinkDatabase } from '@blinkdotnew/sdk'

declare module '@blinkdotnew/sdk' {
  // Tipado mínimo para evitar errores TS en tablas existentes (Blink crea tablas dinámicamente).
  // Si quieres tipado estricto, podemos generar interfaces por tabla.
  interface BlinkDatabase {
    sales: any
    sellers: any
    events: any
    ticketTypes: any
    commissionTiers: any
    subscriptions: any
    sellerInvitations: any
    adminPromoters: any
    promoterSettings: any
  }
}

export {}
