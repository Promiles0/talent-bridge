import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { query, limit } = await req.json();
    if (typeof query !== "string" || query.length < 3 || query.length > 500) {
      return new Response(JSON.stringify({ error: "invalid query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: students } = await supabase
      .from("students")
      .select("id,headline,bio,field_of_study,university,available,profiles!inner(full_name),student_skills(skills(name))")
      .eq("available", true)
      .limit(60);

    const compact = (students ?? []).map((s: any) => ({
      id: s.id,
      name: s.profiles?.full_name,
      headline: s.headline,
      field: s.field_of_study,
      university: s.university,
      skills: (s.student_skills ?? []).map((x: any) => x.skills?.name).filter(Boolean),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You match employer queries to student profiles. Score 0-100 and explain in one short sentence." },
          { role: "user", content: `Query: "${query}". Candidates: ${JSON.stringify(compact)}. Return top ${Math.min(limit ?? 10, 20)} by relevance.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_candidates",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      score: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["id", "score", "reason"],
                  },
                },
              },
              required: ["results"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_candidates" } },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai", detail: t }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const json = await aiRes.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { results: [] };
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
