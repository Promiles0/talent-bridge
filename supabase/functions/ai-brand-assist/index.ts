import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, (ctx: any) => string> = {
  rewrite_story: (c) => `Rewrite this company story to be inspiring and concise (120-180 words). Company: ${c.name}. Industry: ${c.industry || "N/A"}. Current story: ${c.story || "(none)"}.`,
  generate_values: (c) => `Generate 5 culture values for ${c.name} (industry: ${c.industry || "N/A"}). Each value: a 1-2 word title and a one-sentence description. Return JSON: {values:[{title,description}]}.`,
  suggest_tagline: (c) => `Propose 5 short, memorable taglines (max 8 words) for ${c.name} (${c.industry || ""}). Return JSON: {taglines:[string]}.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { action, company } = await req.json();
    if (!PROMPTS[action]) {
      return new Response(JSON.stringify({ error: "invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const wantsJson = action !== "rewrite_story";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a brand strategist for Rwandan tech companies. Be concrete and authentic." },
          { role: "user", content: PROMPTS[action](company || {}) },
        ],
        ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai", detail: t }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const json = await aiRes.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    const result = wantsJson ? JSON.parse(content) : { text: content };
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
