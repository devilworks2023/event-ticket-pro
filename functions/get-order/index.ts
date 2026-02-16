import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Body = { sessionId: string };

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const projectId = Deno.env.get("BLINK_PROJECT_ID");
  const secretKey = Deno.env.get("BLINK_SECRET_KEY");
  if (!projectId || !secretKey) return json({ error: "Missing Blink config" }, 500);

  const { sessionId } = (await req.json()) as Body;
  if (!sessionId) return json({ error: "Missing sessionId" }, 400);

  const blink = createClient({ projectId, secretKey });

  const sales = await blink.db.sales.list({
    where: { stripeSessionId: sessionId },
    orderBy: { createdAt: "asc" },
    limit: 50,
  });

  if (!sales || sales.length === 0) {
    return json({ ready: false });
  }

  const buyerEmail = (sales[0] as any).buyerId;
  const eventId = (sales[0] as any).eventId;
  const ev = eventId ? await blink.db.events.get(eventId) : null;

  return json({
    ready: true,
    buyerEmail,
    eventTitle: (ev as any)?.title || null,
    codes: sales.map((s: any) => ({ qrCode: s.qrCode, status: s.status })),
  });
}

Deno.serve(handler);
