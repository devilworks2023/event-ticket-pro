import Stripe from "npm:stripe";
import { createClient } from "npm:@blinkdotnew/sdk";

// Stripe webhooks are called server-to-server, so CORS isn't strictly required, but harmless.
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateQrCode(): string {
  return `QR_${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const projectId = Deno.env.get("BLINK_PROJECT_ID");
  const blinkSecretKey = Deno.env.get("BLINK_SECRET_KEY");

  if (!stripeSecretKey || !webhookSecret) return json({ error: "Missing Stripe secrets" }, 500);
  if (!projectId || !blinkSecretKey) return json({ error: "Missing Blink config" }, 500);

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing stripe-signature" }, 400);

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return json({ error: "Invalid signature" }, 400);
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return json({ received: true, ignored: true, type: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const md = session.metadata || {};

    const eventId = md.eventId;
    const buyerEmail = md.buyerEmail;
    const selectedTickets = JSON.parse(md.selectedTickets || "{}") as Record<string, number>;
    const includeTransport = md.includeTransport === "1";

    const demographicAge = Number(md.demographicAge || 0);
    const demographicGender = md.demographicGender || "other";
    const geographyCity = md.geographyCity || "";

    if (!eventId || !buyerEmail) {
      return json({ error: "Missing metadata" }, 400);
    }

    const blink = createClient({ projectId, secretKey: blinkSecretKey });

    const ev = await blink.db.events.get(eventId);
    const ticketTypes = await blink.db.ticketTypes.list({ where: { eventId } });

    const ticketsById = new Map<string, any>(ticketTypes.map((t: any) => [t.id, t]));

    const createdSales: Array<{ id: string; qrCode: string; ticketTypeId: string; amount: number }> = [];

    for (const [ticketTypeId, qty] of Object.entries(selectedTickets)) {
      const t = ticketsById.get(ticketTypeId);
      if (!t || !qty) continue;

      for (let i = 0; i < qty; i++) {
        const qrCode = generateQrCode();
        const sale = await blink.db.sales.create({
          userId: (ev as any)?.userId || (ev as any)?.user_id || null,
          eventId,
          ticketTypeId,
          buyerId: buyerEmail,
          sellerId: null,
          amount: String(t.price),
          commissionAmount: "0",
          status: "completed",
          qrCode,
          demographicAge: String(demographicAge),
          demographicGender,
          geographyCity,
          transportAdded: includeTransport ? "1" : "0",
          stripeSessionId: session.id,
        } as any);

        createdSales.push({ id: (sale as any).id, qrCode, ticketTypeId, amount: Number(t.price) });
      }

      // Update sold count (optimistic, no strict stock locks here)
      await blink.db.ticketTypes.update(ticketTypeId, {
        sold: String(Number(t.sold || 0) + qty),
      } as any);
    }

    // Email buyer with all QR codes
    const eventTitle = (ev as any)?.title || "Tu evento";
    const codesHtml = createdSales
      .map((s) => `<li style="margin: 6px 0;"><code style="font-size: 16px; letter-spacing: 2px;">${s.qrCode}</code></li>`)
      .join("");

    await blink.notifications.email({
      to: buyerEmail,
      subject: `Entradas confirmadas — ${eventTitle}`,
      html: `
        <div style="font-family: ui-sans-serif, system-ui; max-width: 640px; margin: 0 auto; padding: 24px;">
          <h1 style="margin: 0 0 12px; color: #0D9488;">Compra confirmada</h1>
          <p style="margin: 0 0 18px; color: #134E4A;">Evento: <strong>${eventTitle}</strong></p>
          <p style="margin: 0 0 12px;">Tus códigos de acceso (presenta uno por persona):</p>
          <ul style="padding-left: 18px; margin: 0 0 18px;">${codesHtml}</ul>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Session: ${session.id}</p>
        </div>
      `,
    });

    return json({ received: true, ok: true, salesCount: createdSales.length });
  } catch (error) {
    console.error("stripe-webhook handler error", error);
    return json({ error: "Internal error" }, 500);
  }
}

Deno.serve(handler);
