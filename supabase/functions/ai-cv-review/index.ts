import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Analyze this CV/resume data and provide actionable feedback. Be specific and constructive.

CV Data:
- Name: ${cvData.fullName || "Not provided"}
- Summary: ${cvData.summary || "None"}
- Education: ${JSON.stringify(cvData.education || [])}
- Experience: ${JSON.stringify(cvData.experience || [])}
- Skills: ${(cvData.skills || []).join(", ") || "None"}
- Languages: ${(cvData.languages || []).join(", ") || "None"}
- Portfolio: ${cvData.portfolioUrl || "None"}
- LinkedIn: ${cvData.linkedinUrl || "None"}
- GitHub: ${cvData.githubUrl || "None"}

Return a JSON response using the provided tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert CV/resume reviewer for students and early-career professionals. Provide constructive, actionable feedback." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "cv_review",
            description: "Return structured CV review feedback",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Score from 1-100" },
                strengths: { type: "array", items: { type: "string" }, description: "3-5 strengths" },
                improvements: { type: "array", items: { type: "string" }, description: "3-5 improvement suggestions" },
                missingSections: { type: "array", items: { type: "string" }, description: "Any missing sections that should be added" },
                summary: { type: "string", description: "Brief overall assessment in 2-3 sentences" },
              },
              required: ["overallScore", "strengths", "improvements", "missingSections", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "cv_review" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const review = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-cv-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
