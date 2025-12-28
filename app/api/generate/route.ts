import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60; 

const systemPrompt = `You are a Senior Web Architect. Generate a COMPREHENSIVE multi-file project.
STRICT RULE: Your response must be ONLY a valid JSON object. Do not include markdown or explanations.

JSON Structure:
{
  "files": [
    { "name": "index.html", "code": "..." },
    { "name": "services.html", "code": "..." },
    { "name": "login.html", "code": "..." },
    { "name": "signup.html", "code": "..." },
    { "name": "style.css", "code": "..." },
    { "name": "script.js", "code": "..." }
  ]
}
Each HTML file must use Tailwind CDN and have a navbar linking to others.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 })

    const { prompt } = await req.json()
    const COST_PER_REQUEST = 3;

    const { data: profile } = await supabase.from("users").select("credits").eq("id", user.id).single()
    if (!profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json({ error: "Insufficient credits." }, { status: 403 })
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY?.trim()}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a web project for: ${prompt}` }
        ],
        stream: true,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) return NextResponse.json({ error: "DeepSeek API Error" }, { status: 500 })

    const decoder = new TextDecoder()
    let fullText = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          controller.enqueue(value)

          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.replace("data: ", ""))
                fullText += json.choices[0]?.delta?.content || ""
              } catch (e) {}
            }
          }
        }
        
        // Final Save to DB
        if (fullText.length > 500) {
          await supabase.from("projects").insert({ user_id: user.id, prompt, code: fullText, name: prompt.substring(0, 30) });
          await supabase.from("users").update({ credits: profile.credits - COST_PER_REQUEST }).eq("id", user.id);
        }
        controller.close()
      }
    })

    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}