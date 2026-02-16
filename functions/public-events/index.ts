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
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    // Public listing: only published events.
    // NOTE: We keep filtering minimal here; client can additionally filter/sort.
    const events = await blink.db.events.list({
      where: { status: "published" },
      orderBy: { date: "asc" },
      limit: 200,
    });

    const filtered = (events as any[]).filter((e) => {
      if (!q) return true;
      const title = String(e.title || "").toLowerCase();
      const location = String(e.location || "").toLowerCase();
      return title.includes(q) || location.includes(q);
    });

    return json({ events: filtered });
  } catch (error) {
    console.error("public-events error:", error);
    return json({ error: "Internal error" }, 500);
  }
}

Deno.serve(handler);
