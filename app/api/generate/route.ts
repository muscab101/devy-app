import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Kordhi waqtiga ilaa 60 ilbiriqsi si uu u dhameeyo code-ka dheer
export const maxDuration = 60; 

const systemPrompt = `You are a Senior Web Architect. Generate a COMPREHENSIVE multi-file web project.
STRICT RULE: Your response must be ONLY a valid JSON object.

JSON Structure:
{
  "files": [
    { "name": "index.html", "code": "<!DOCTYPE html>... (Landing Page with Nav to all pages) ..." },
    { "name": "services.html", "code": "<!DOCTYPE html>... (Detailed Services Page) ..." },
    { "name": "login.html", "code": "<!DOCTYPE html>... (Login Form with Tailwind) ..." },
    { "name": "signup.html", "code": "<!DOCTYPE html>... (Signup Form with Tailwind) ..." },
    { "name": "style.css", "code": "/* Custom CSS if needed */" },
    { "name": "script.js", "code": "// JS for interactivity" }
  ]
}

SPECIFIC REQUIREMENTS:
- All HTML files MUST include the Tailwind CSS CDN.
- Each page must have a consistent Navigation Bar that links to all other pages (e.g., <a href="services.html">Services</a>).
- The Login and Signup pages should be modern and responsive.
- Do NOT use placeholders. Write full, working code for every single file.`;

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

    // 2. DeepSeek Call with Optimized Settings
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
        max_tokens: 8192, // Tan ayaa xal u ah inuu code-ka dhameeyo
        temperature: 0.1, // AI-ga ka dhigaysa mid toos u shaqeeya
        stop: ["```"] 
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: "API connection failed" }, { status: response.status });
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

        // Keydi kaliya haddii code-ku dhowaad dhamaaday (Checking for </html>)
        if (fullGeneratedCode.length > 200) {
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