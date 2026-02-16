import { createClient } from 'npm:@blinkdotnew/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

type Action = 'list' | 'linkPromoterByEmail' | 'update' | 'delete'

type RequestBody =
  | { action: 'list' }
  | {
      action: 'linkPromoterByEmail'
      promoterEmail: string
      settings: {
        billingModel: 'commission' | 'subscription'
        platformCommissionPct: number
      }
    }
  | {
      action: 'update'
      linkId: string
      status?: string
      settings?: {
        billingModel?: 'commission' | 'subscription'
        platformCommissionPct?: number
      }
    }
  | { action: 'delete'; linkId: string }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const projectId = Deno.env.get('BLINK_PROJECT_ID')
    const secretKey = Deno.env.get('BLINK_SECRET_KEY')
    if (!projectId || !secretKey) return json({ error: 'Missing config' }, 500)

    const blink = createClient({ projectId, secretKey })

    const auth = await blink.auth.verifyToken(req.headers.get('Authorization'))
    if (!auth.valid || !auth.userId) return json({ error: auth.error || 'Unauthorized' }, 401)

    const me = await blink.db.table<any>('users').get(auth.userId)
    if (!me || me.role !== 'admin') return json({ error: 'Forbidden' }, 403)

    const body = (await req.json()) as RequestBody
    const action: Action = body.action

    if (action === 'list') {
      const links = await blink.db.table<any>('admin_promoters').list({
        where: { adminUserId: auth.userId },
        orderBy: { createdAt: 'desc' },
      })

      const promoters = await Promise.all(
        links.map(async (l: any) => {
          const settings = await blink.db.table<any>('promoter_settings').list({
            where: { promoterUserId: l.promoterUserId },
            limit: 1,
          })

          const s = settings[0]
          return {
            id: l.id,
            promoterUserId: l.promoterUserId,
            promoterEmail: l.promoterEmail,
            status: l.status,
            billingModel: s?.billingModel,
            platformCommissionPct: s?.platformCommissionPct,
            subscriptionPlan: s?.subscriptionPlan,
            subscriptionStatus: s?.subscriptionStatus,
          }
        })
      )

      return json({ promoters })
    }

    if (action === 'linkPromoterByEmail') {
      const promoterEmail = body.promoterEmail?.trim().toLowerCase()
      if (!promoterEmail) return json({ error: 'promoterEmail es requerido' }, 400)

      const existing = await blink.db.table<any>('users').list({
        where: { email: promoterEmail },
        limit: 1,
      })

      if (existing.length === 0) {
        return json(
          {
            error:
              'El promotor aún no existe. Pídele que cree su cuenta primero (login normal) y luego vuelve a vincularlo aquí.',
          },
          400
        )
      }

      const promoter = existing[0]

      // Promote role
      await blink.db.table<any>('users').update(promoter.id, {
        role: 'promoter',
        updatedAt: new Date().toISOString(),
      })

      // Ensure promoter settings (owned by promoter for RLS)
      const settingsExisting = await blink.db.table<any>('promoter_settings').list({
        where: { promoterUserId: promoter.id },
        limit: 1,
      })

      if (settingsExisting.length === 0) {
        await blink.db.table<any>('promoter_settings').create({
          promoterUserId: promoter.id,
          billingModel: body.settings.billingModel,
          platformCommissionPct: String(body.settings.platformCommissionPct),
          subscriptionStatus: 'inactive',
          userId: promoter.id,
        })
      } else {
        await blink.db.table<any>('promoter_settings').update(settingsExisting[0].id, {
          billingModel: body.settings.billingModel,
          platformCommissionPct: String(body.settings.platformCommissionPct),
          updatedAt: new Date().toISOString(),
        })
      }

      // Link under this admin (owned by admin for RLS)
      const linkExisting = await blink.db.table<any>('admin_promoters').list({
        where: { AND: [{ adminUserId: auth.userId }, { promoterUserId: promoter.id }] },
        limit: 1,
      })

      if (linkExisting.length === 0) {
        await blink.db.table<any>('admin_promoters').create({
          adminUserId: auth.userId,
          promoterUserId: promoter.id,
          promoterEmail,
          status: 'active',
          userId: auth.userId,
        })
      }

      return json({ ok: true })
    }

    if (action === 'update') {
      if (!body.linkId) return json({ error: 'linkId es requerido' }, 400)

      const links = await blink.db.table<any>('admin_promoters').list({
        where: { AND: [{ id: body.linkId }, { adminUserId: auth.userId }] },
        limit: 1,
      })
      if (links.length === 0) return json({ error: 'Not found' }, 404)

      const link = links[0]

      if (typeof body.status === 'string') {
        await blink.db.table<any>('admin_promoters').update(link.id, {
          status: body.status,
        })
      }

      if (body.settings) {
        const settingsExisting = await blink.db.table<any>('promoter_settings').list({
          where: { promoterUserId: link.promoterUserId },
          limit: 1,
        })

        const patch: Record<string, any> = {
          updatedAt: new Date().toISOString(),
        }

        if (body.settings.billingModel) patch.billingModel = body.settings.billingModel
        if (typeof body.settings.platformCommissionPct === 'number') {
          patch.platformCommissionPct = String(body.settings.platformCommissionPct)
        }

        if (settingsExisting.length === 0) {
          await blink.db.table<any>('promoter_settings').create({
            promoterUserId: link.promoterUserId,
            billingModel: patch.billingModel || 'commission',
            platformCommissionPct: patch.platformCommissionPct || '0',
            subscriptionStatus: 'inactive',
            userId: link.promoterUserId,
          })
        } else {
          await blink.db.table<any>('promoter_settings').update(settingsExisting[0].id, patch)
        }
      }

      return json({ ok: true })
    }

    if (action === 'delete') {
      if (!body.linkId) return json({ error: 'linkId es requerido' }, 400)

      const links = await blink.db.table<any>('admin_promoters').list({
        where: { AND: [{ id: body.linkId }, { adminUserId: auth.userId }] },
        limit: 1,
      })
      if (links.length === 0) return json({ error: 'Not found' }, 404)

      await blink.db.table<any>('admin_promoters').delete(body.linkId)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('admin-promoters error:', error)
    return json({ error: 'Internal error' }, 500)
  }
}

Deno.serve(handler)