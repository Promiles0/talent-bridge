import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { currentSkills, targetRole, gaps } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert career coach and curriculum designer. Generate a personalized 8-week learning roadmap to close skill gaps for a target role. Be practical, specific, and motivating. Recommend free/affordable resources where possible.`;

    const userPrompt = `Target role: ${targetRole}
Current skills: ${(currentSkills || []).join(", ") || "none specified"}
Top skill gaps to close: ${(gaps || []).join(", ")}

Generate a structured 8-week roadmap.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_roadmap",
            description: "Return a structured 8-week learning roadmap.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence overview of the roadmap strategy" },
                weeks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "number" },
                      focus: { type: "string", description: "main skill or theme for the week" },
                      milestone: { type: "string", description: "concrete deliverable to complete" },
                      tasks: { type: "array", items: { type: "string" } },
                      resources: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            type: { type: "string", enum: ["course", "video", "article", "project", "book"] },
                          },
                          required: ["title", "type"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["week", "focus", "milestone", "tasks", "resources"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "weeks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_roadmap" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!args) throw new Error("No structured response from AI");

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("ai-skill-roadmap error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
