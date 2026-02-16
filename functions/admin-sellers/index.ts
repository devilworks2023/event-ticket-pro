import { createClient } from 'npm:@blinkdotnew/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

type RequestBody =
  | { action: 'list'; promoterUserId: string }
  | { action: 'update'; promoterUserId: string; sellerId: string; patch: { name?: string; status?: string } }
  | { action: 'delete'; promoterUserId: string; sellerId: string }

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
    const promoterUserId = (body as any).promoterUserId
    if (!promoterUserId) return json({ error: 'promoterUserId es requerido' }, 400)

    // Ensure this admin is linked to that promoter
    const links = await blink.db.table<any>('admin_promoters').list({
      where: { AND: [{ adminUserId: auth.userId }, { promoterUserId }] },
      limit: 1,
    })
    if (links.length === 0) return json({ error: 'Forbidden' }, 403)

    if (body.action === 'list') {
      const sellers = await blink.db.table<any>('sellers').list({
        where: { userId: promoterUserId },
        orderBy: { createdAt: 'desc' },
      })
      return json({ sellers })
    }

    if (body.action === 'update') {
      if (!body.sellerId) return json({ error: 'sellerId es requerido' }, 400)
      const patch: Record<string, any> = {}
      if (typeof body.patch?.name === 'string') patch.name = body.patch.name
      if (typeof body.patch?.status === 'string') patch.status = body.patch.status
      if (Object.keys(patch).length === 0) return json({ error: 'patch vacío' }, 400)

      const updated = await blink.db.table<any>('sellers').update(body.sellerId, patch)
      return json({ seller: updated })
    }

    if (body.action === 'delete') {
      if (!body.sellerId) return json({ error: 'sellerId es requerido' }, 400)

      // Delete related commission tiers first
      const tiers = await blink.db.table<any>('commission_tiers').list({
        where: { sellerId: body.sellerId },
        limit: 500,
      })
      if (tiers.length > 0) {
        await Promise.all(tiers.map((t: any) => blink.db.table<any>('commission_tiers').delete(t.id)))
      }

      await blink.db.table<any>('sellers').delete(body.sellerId)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('admin-sellers error:', error)
    return json({ error: 'Internal error' }, 500)
  }
}

Deno.serve(handler)
