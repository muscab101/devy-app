import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Tani waxay ka hortagaysaa in Vercel uu function-ka xiro 10 ilbiriqsi ka dib
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Hubi qofka soo galay (Auth)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Fadlan marka hore soo gal (Login)." }, { status: 401 })
    }

    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: "Prompt-ka waa lagama maarmaan." }, { status: 400 })
    }

    const COST_PER_REQUEST = 3;

    // 2. Hubi credits-ka user-ka
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: `Credits-kaagu kuma filna. Waxaad u baahan tahay ugu yaraan ${COST_PER_REQUEST} credits.` }, 
        { status: 403 }
      )
    }

    // 3. DeepSeek API Call
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `You are a World-Class Senior Frontend Engineer. 
            Return ONLY pure HTML, Tailwind CSS, and Vanilla JavaScript. 
            No explanations. No Markdown code blocks like \`\`\`html. Just the raw code.` 
          },
          { role: "user", content: `Create a premium website section for: ${prompt}` }
        ],
        temperature: 0.6
      })
    })

    const aiData = await response.json()

    // Hubi haddii DeepSeek ay Error soo celisay (sida 402 Insufficient Balance)
    if (!response.ok) {
      console.error("DeepSeek API Error:", aiData)
      return NextResponse.json({ 
        error: aiData.error?.message || "DeepSeek API ayaa cilad bixisay. Hubi balance-kaaga." 
      }, { status: response.status })
    }

    const aiMessage = aiData.choices?.[0]?.message?.content

    if (!aiMessage) {
      return NextResponse.json({ error: "AI-ga wax jawaab ah ma soo celin." }, { status: 500 })
    }

    // 4. Ka gooy credits-ka maadaama ay guul ku dhammaatay
    const newBalance = profile.credits - COST_PER_REQUEST;
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newBalance })
      .eq("id", user.id)

    if (updateError) {
      console.error("Credit deduction failed:", updateError)
    }

    return NextResponse.json({ 
      success: true, 
      text: aiMessage,
      remainingCredits: newBalance 
    })

  } catch (error: any) {
    console.error("General Error:", error.message)
    return NextResponse.json({ 
      error: "Cilad farsamo ayaa dhacday. Fadlan mar kale isku day." 
    }, { status: 500 })
  }
}