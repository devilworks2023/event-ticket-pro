import Stripe from "npm:stripe";
import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type CreateCheckoutBody = {
  eventId: string;
  selectedTickets: Record<string, number>; // ticketTypeId -> qty
  includeTransport: boolean;
  buyerEmail: string;
  demographicAge: number;
  demographicGender: "male" | "female" | "other";
  geographyCity: string;
  successUrl: string;
  cancelUrl: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function eurToCents(value: number): number {
  return Math.max(0, Math.round(value * 100));
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const blinkSecretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!stripeSecretKey) {
      return json(
        {
          error: "Missing STRIPE_SECRET_KEY",
          hint: "Añade STRIPE_SECRET_KEY en Secrets y redeploy de la función stripe-create-checkout-session.",
        },
        500
      );
    }
    if (!projectId || !blinkSecretKey) return json({ error: "Missing Blink config" }, 500);

    const body = (await req.json()) as CreateCheckoutBody;

    if (!body.eventId || !body.buyerEmail || !body.successUrl || !body.cancelUrl) {
      return json({ error: "Missing required fields" }, 400);
    }

    const ticketQty = Object.values(body.selectedTickets || {}).reduce((a, b) => a + b, 0);
    if (ticketQty <= 0) return json({ error: "No tickets selected" }, 400);

    const blink = createClient({ projectId, secretKey: blinkSecretKey });
    const ev = await blink.db.events.get(body.eventId);
    if (!ev) return json({ error: "Event not found" }, 404);

    const ticketTypes = await blink.db.ticketTypes.list({ where: { eventId: body.eventId } });
    const ticketsById = new Map<string, any>(ticketTypes.map((t: any) => [t.id, t]));

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const [ticketTypeId, qty] of Object.entries(body.selectedTickets || {})) {
      if (!qty) continue;
      const t = ticketsById.get(ticketTypeId);
      if (!t) return json({ error: `Invalid ticket type: ${ticketTypeId}` }, 400);

      const remaining = Number(t.quantity || 0) - Number(t.sold || 0);
      if (qty > remaining) {
        return json({ error: `No hay stock suficiente para ${t.name}` }, 400);
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${t.name} — ${(ev as any).title}`,
            description: t.description || undefined,
          },
          unit_amount: eurToCents(Number(t.price || 0)),
        },
        quantity: qty,
      });
    }

    // Transporte: 15€ por persona (por ahora fijo)
    if (body.includeTransport) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: `Transporte — ${(ev as any).title}` },
          unit_amount: eurToCents(15),
        },
        quantity: ticketQty,
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Habilita wallets (Apple Pay / Google Pay) cuando estén disponibles para el merchant.
      // Requisitos típicos: dominio verificado en Stripe + HTTPS + configuración de wallets.
      automatic_payment_methods: { enabled: true },
      customer_email: body.buyerEmail,
      allow_promotion_codes: true,
      success_url: `${body.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl,
      line_items: lineItems,
      metadata: {
        eventId: body.eventId,
        selectedTickets: JSON.stringify(body.selectedTickets || {}),
        includeTransport: body.includeTransport ? "1" : "0",
        buyerEmail: body.buyerEmail,
        demographicAge: String(body.demographicAge),
        demographicGender: body.demographicGender,
        geographyCity: body.geographyCity,
      },
    });

    return json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("stripe-create-checkout-session error", error);
    return json({ error: "Internal error" }, 500);
  }
}

Deno.serve(handler);