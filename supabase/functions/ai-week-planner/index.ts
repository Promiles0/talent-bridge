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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: student } = await supabase.from("students").select("id,headline,field_of_study").eq("user_id", user.id).maybeSingle();
    const { data: apps } = student
      ? await supabase.from("applications").select("id,status,internships(title,deadline)").eq("student_id", student.id).limit(20)
      : { data: [] as any[] };

    const ctx = {
      headline: student?.headline,
      field: student?.field_of_study,
      pendingApps: (apps ?? []).filter((a: any) => ["applied", "review"].includes(a.status)).length,
      upcoming: (apps ?? [])
        .map((a: any) => a.internships)
        .filter((i: any) => i?.deadline && new Date(i.deadline) > new Date())
        .slice(0, 5),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a career planning assistant. Generate a balanced 7-day plan with study, application, and break blocks. Return JSON via the tool only." },
          { role: "user", content: `Plan my upcoming week. Context: ${JSON.stringify(ctx)}. Today: ${new Date().toISOString()}.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "weekly_plan",
            description: "Suggested calendar events for the week",
            parameters: {
              type: "object",
              properties: {
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      type: { type: "string", enum: ["study", "reminder", "custom"] },
                      starts_at: { type: "string", description: "ISO datetime" },
                      ends_at: { type: "string", description: "ISO datetime" },
                      description: { type: "string" },
                    },
                    required: ["title", "type", "starts_at", "ends_at"],
                  },
                },
              },
              required: ["events"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "weekly_plan" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai", detail: t }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const json = await aiRes.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { events: [] };
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
