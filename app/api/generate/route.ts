import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 1. Tani waxay muhiim u tahay in Vercel uusan goyn loading-ka (60 ilbiriqsi)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 2. Hubi qofka codsiga soo diray
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Fadlan login soo dheh." }, { status: 401 })
    }

    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: "Prompt-ka waa maran yahay." }, { status: 400 })
    }

    const COST_PER_REQUEST = 3;

    // 3. Hubi haddii user-ka uu credits leeyahay
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: `Credits-kaagu kuma filna. Waxaad leedahay ${profile?.credits || 0} credits.` }, 
        { status: 403 }
      )
    }

    // 4. DeepSeek API Call - Hubi in DEEPSEEK_API_KEY uu Vercel ku jiro
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
            content: "You are a Senior Frontend Developer. Return ONLY raw HTML/Tailwind/JS code. No markdown. No explanations." 
          },
          { role: "user", content: `Build this: ${prompt}` }
        ],
        temperature: 0.6
      })
    })

    const aiData = await response.json()

    // 5. Hubi haddii DeepSeek ay cilad soo dirtay (sida balance la'aan)
    if (!response.ok) {
      console.error("DeepSeek API Error:", aiData)
      return NextResponse.json({ 
        error: aiData.error?.message || "AI-ga ayaa cilad bixiyay. Hubi DeepSeek balance." 
      }, { status: response.status })
    }

    const aiMessage = aiData.choices?.[0]?.message?.content
    if (!aiMessage) {
      throw new Error("AI-ga waxba ma soo celin.")
    }

    // 6. Ka gooy credits-ka maadaama shaqadu guulaysatay
    const newBalance = profile.credits - COST_PER_REQUEST;
    await supabase
      .from("users")
      .update({ credits: newBalance })
      .eq("id", user.id)

    return NextResponse.json({ 
      success: true, 
      text: aiMessage,
      remainingCredits: newBalance 
    })

  } catch (error: any) {
    console.error("Error xilliga dhalinta code-ka:", error.message)
    return NextResponse.json({ 
      error: "Cilad ayaa dhacday. Fadlan mar kale tijaabi." 
    }, { status: 500 })
  }
}