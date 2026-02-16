import type { BlinkUser } from '@blinkdotnew/sdk'

export type AppRole = 'admin' | 'promoter' | 'seller' | 'organizer'

export function getAppRole(user: BlinkUser | null | undefined): AppRole {
  const raw = (user as any)?.role
  if (raw === 'admin' || raw === 'promoter' || raw === 'seller') return raw
  return 'organizer'
}

export function isAdmin(user: BlinkUser | null | undefined): boolean {
  return getAppRole(user) === 'admin'
}

export function isPromoter(user: BlinkUser | null | undefined): boolean {
  const role = getAppRole(user)
  return role === 'promoter' || role === 'organizer'
}
