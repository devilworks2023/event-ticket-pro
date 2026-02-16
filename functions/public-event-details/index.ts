import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) return json({ error: "Missing config" }, 500);

    const blink = createClient({ projectId, secretKey });

    const url = new URL(req.url);
    const eventId = (url.searchParams.get("id") || "").trim();
    if (!eventId) return json({ error: "Missing id" }, 400);

    const event = await blink.db.events.get(eventId);
    if (!event || (event as any).status !== "published") {
      return json({ error: "Not found" }, 404);
    }

    const ticketTypes = await blink.db.ticketTypes.list({ where: { eventId } });

    return json({ event, ticketTypes });
  } catch (error) {
    console.error("public-event-details error:", error);
    return json({ error: "Internal error" }, 500);
  }
}

Deno.serve(handler);
