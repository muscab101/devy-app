import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// IMPORTANT: Set timeout to 60s for long generations
export const maxDuration = 60; 

const systemPrompt = `You are an expert Frontend Developer. Your mission is to provide a COMPLETE, production-ready HTML file.
STRICT RULES:
1. Output ONLY raw HTML. No markdown, no backticks (\`\`\`), no "Here is your code".
2. Include <script src="https://cdn.tailwindcss.com"></script> and any required fonts.
3. Every component must be fully written out. NO placeholders like "repeat for others".
4. Ensure all interactive parts (menus, tabs, modals) work using vanilla JavaScript.
5. All images must use https://placehold.co/600x400.
6. The response must start with <!DOCTYPE html> and end with </html>.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Please login." }, { status: 401 })
    }

    const { prompt } = await req.json()
    const COST_PER_REQUEST = 3;

    // 1. Credit Check
    const { data: profile } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json({ error: "Insufficient credits." }, { status: 403 })
    }

    // 2. DeepSeek Streaming Call
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
          { role: "user", content: prompt }
        ],
        stream: true,
        max_tokens: 8192, // Crucial for full projects
        temperature: 0.2, // Lower temperature for more consistent code
        stop: ["```"] // Prevents AI from wrapping code in markdown
      })
    })

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || "API error" }, { status: response.status });
    }

    const decoder = new TextDecoder()
    let fullGeneratedCode = ""

    const customStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          controller.enqueue(value)

          // Extract content from SSE stream to save it later
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.replace("data: ", ""))
                fullGeneratedCode += json.choices[0]?.delta?.content || ""
              } catch (e) {}
            }
          }
        }

        // 3. Finalize: Save Project & Deduct Credits
        if (fullGeneratedCode.includes("</html>") || fullGeneratedCode.length > 500) {
          await supabase.from("projects").insert({
            user_id: user.id,
            prompt: prompt,
            code: fullGeneratedCode,
            name: prompt.substring(0, 30)
          });

          await supabase.from("users").update({ 
            credits: profile.credits - COST_PER_REQUEST 
          }).eq("id", user.id);
        }

        controller.close()
      }
    })

    return new Response(customStream, {
      headers: { "Content-Type": "text/event-stream" }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}