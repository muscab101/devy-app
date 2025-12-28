import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Vercel Hobby tier is 10s by default, but Streaming helps prevent timeouts
export const maxDuration = 60; 
const systemPrompt = `You are a Senior Full-Stack Developer. 
Your MISSION is to provide a COMPLETE, working HTML file.
- NEVER stop in the middle of a tag or script.
- NEVER use placeholders like "repeat for other items".
- If the layout is complex, write out EVERY SINGLE section.
- Provide the full <html> structure including <head> and <body>.
- Always include <script src="https://cdn.tailwindcss.com"></script>.
- Use vanilla JavaScript for all interactive parts (modals, tabs, etc.).
- Failure to provide the full code will result in a broken user experience. 
Deliver excellence by providing 100% of the code requested.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json({ error: "Please log in to continue." }, { status: 401 })
    }

    const { prompt } = await req.json()
    const COST_PER_REQUEST = 3;

    // 1. Verify Credits
    const { data: profile } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json({ error: "Insufficient credits." }, { status: 403 })
    }

    // 2. DeepSeek API Call with Streaming
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
        stream: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || "DeepSeek API Error" }, { status: response.status });
    }

    // 3. Create a Custom ReadableStream to capture data for the database
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

          // SSE Parsing: Reconstruct the code to save it to History later
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.replace("data: ", ""))
                fullGeneratedCode += json.choices[0]?.delta?.content || ""
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }

        // 4. Save Project & Deduct Credits only when the stream successfully finishes
        if (fullGeneratedCode) {
          await supabase.from("projects").insert({
            user_id: user.id,
            prompt: prompt,
            code: fullGeneratedCode,
            name: prompt.substring(0, 30) + "..."
          });

          await supabase.from("users").update({ 
            credits: profile.credits - COST_PER_REQUEST 
          }).eq("id", user.id);
        }

        controller.close()
      }
    })

    // Return the stream as an Event-Stream
    return new Response(customStream, {
      headers: { "Content-Type": "text/event-stream" }
    });

  } catch (error: any) {
    console.error("Generation Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}