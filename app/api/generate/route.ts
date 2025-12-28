import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 1. Kordhi waqtiga shaqada si uusan loading-ku u go'in (Vercel Pro/Enterprise)
// Fiiro gaar ah: Hobby Plan (Free) wuxuu ku eg yahay 10s, laakiin kani waa muhiim.
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 2. Hubi in qofku soo galay (Authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Fadlan marka hore login soo dheh." }, 
        { status: 401 }
      )
    }

    // 3. Soo qaad xogta prompt-ka
    let body;
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json({ error: "Xogta la soo diray ma khaldana." }, { status: 400 })
    }

    const { prompt } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Fadlan qor waxaad rabto in lagu dhiso." }, { status: 400 })
    }

    const COST_PER_REQUEST = 3;

    // 4. Hubi credits-ka user-ka
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || (profile.credits || 0) < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: `Credits-kaagu kuma filna. Waxaad u baahan tahay ${COST_PER_REQUEST} credits.` }, 
        { status: 403 }
      )
    }

    // 5. DeepSeek API Call
    console.log("Calling DeepSeek API...");
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
            content: `You are an expert Frontend Developer. 
            Output ONLY the raw code (HTML, Tailwind CSS, JS). 
            Do NOT include markdown like \`\`\`html. 
            Ensure the code is a single, complete, and functional block.` 
          },
          { role: "user", content: `Create a professional UI section for: ${prompt}` }
        ],
        temperature: 0.6
      })
    })

    const aiData = await response.json()

    // 6. Hubi haddii DeepSeek ay error soo celisay (Balance ama API Key)
    if (!response.ok) {
      console.error("DeepSeek Error:", aiData)
      return NextResponse.json({ 
        error: aiData.error?.message || "DeepSeek API ayaa cilad bixisay." 
      }, { status: response.status })
    }

    const aiMessage = aiData.choices?.[0]?.message?.content

    if (!aiMessage) {
      return NextResponse.json({ error: "AI-ga wax jawaab ah ma soo celin." }, { status: 500 })
    }

    // 7. Ka gooy credits-ka maadaama shaqadu guulaysatay
    const newBalance = profile.credits - COST_PER_REQUEST;
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newBalance })
      .eq("id", user.id)

    if (updateError) {
      console.error("Credit deduction failed:", updateError)
    }

    // 8. Soo celi xogta guusha
    return NextResponse.json({ 
      success: true, 
      text: aiMessage,
      remainingCredits: newBalance 
    })

  } catch (error: any) {
    console.error("General Error in route.ts:", error.message)
    return NextResponse.json({ 
      error: "Cilad farsamo ayaa dhacday: " + error.message 
    }, { status: 500 })
  }
}