import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60; // Kordhi waqtiga xadka (Vercel)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Fadlan login soo dheh." }, { status: 401 })
    }

    const { prompt } = await req.json()
    const COST_PER_REQUEST = 3;

    // Hubi Credits
    const { data: profile } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json({ error: "Credits kuma filna." }, { status: 403 })
    }

    // 1. DeepSeek API Call with Streaming
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert Frontend Developer. Return ONLY raw HTML/Tailwind code. No markdown code blocks." },
          { role: "user", content: prompt }
        ],
        stream: true // Tani waa furaha streaming-ka
      })
    })

    if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error?.message || "API error" }, { status: response.status });
    }

    // 2. Ka gooy credits-ka isla marka uu bilaawdo
    await supabase.from("users").update({ credits: profile.credits - COST_PER_REQUEST }).eq("id", user.id);

    // 3. Toos ugu soo celi response-ka browser-ka (Streaming)
    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}