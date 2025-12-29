import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60; 

const systemPrompt = `You are a Senior Web Architect. Your ONLY goal is to output a 100% COMPLETE HTML file.
- NEVER use markdown like \`\`\`html.
- START directly with <!DOCTYPE html>.
- END directly with </html>.
- Use Tailwind CDN and Vanilla JS for interactivity.
- Ensure the design is modern and responsive.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 })

    const { prompt, image } = await req.json()
    const COST_PER_REQUEST = 3;

    // 1. Credit Check
    const { data: profile } = await supabase.from("users").select("credits").eq("id", user.id).single()
    if (!profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json({ error: "Insufficient credits." }, { status: 403 })
    }

    // 2. DeepSeek Call (Kaliya Prompt ayuu qaataa)
    // Fiiro gaar ah: Maadaama DeepSeek uusan arki karin sawirka, prompt-ka ayaa muhiim ah.
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a website based on this request: ${prompt}. (Note: The user has sketched a design on a canvas, please generate a high-quality layout.)` }
        ],
        stream: false, // Hal mar ha soo wada saaro
        max_tokens: 4000
      })
    })

    if (!response.ok) return NextResponse.json({ error: "DeepSeek API failed" }, { status: 500 });

    const result = await response.json();
    const fullGeneratedCode = result.choices[0]?.message?.content || "";

    // 3. Keydi iyo Credit jar
    if (fullGeneratedCode.length > 100) {
      await supabase.from("projects").insert({
        user_id: user.id,
        prompt: prompt || "DeepSeek Project",
        code: fullGeneratedCode,
        name: (prompt || "Generated site").substring(0, 30)
      });

      await supabase.from("users").update({ credits: profile.credits - COST_PER_REQUEST }).eq("id", user.id);
    }

    return NextResponse.json({ code: fullGeneratedCode });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}