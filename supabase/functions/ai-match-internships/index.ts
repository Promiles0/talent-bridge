import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentProfile, internships } = await req.json();
    if (!internships?.length) return new Response(JSON.stringify({ matches: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const internshipList = internships.map((i: any, idx: number) =>
      `${idx + 1}. "${i.title}" at ${i.companyName} — Requirements: ${i.requirements || "Not specified"}, Work type: ${i.work_type}`
    ).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a career matching algorithm. Analyze student skills against internship requirements and return matches ranked by relevance." },
          { role: "user", content: `Student profile:
- Skills: ${studentProfile.skills?.join(", ") || "None listed"}
- Field of study: ${studentProfile.fieldOfStudy || "Not specified"}
- Bio: ${studentProfile.bio || "Not provided"}

Available internships:
${internshipList}

Return the top matches (up to 6) ranked by relevance using the provided tool.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_matches",
            description: "Return ranked internship matches",
            parameters: {
              type: "object",
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number", description: "1-based index from the internship list" },
                      matchScore: { type: "number", description: "Match percentage 0-100" },
                      reason: { type: "string", description: "One sentence explaining why this is a good match" },
                    },
                    required: ["index", "matchScore", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["matches"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_matches" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { matches: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-match-internships error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
