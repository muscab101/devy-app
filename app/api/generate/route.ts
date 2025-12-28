import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
export async function POST(req: Request) {
  try {

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 })
    }

    // Cost setting: 3 credits per request
    const COST_PER_REQUEST = 3;

    // 1. Check user's credit balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.credits < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: `Insufficient credits. You need at least ${COST_PER_REQUEST} credits to generate code.` }, 
        { status: 403 }
      )
    }

    const { prompt } = await req.json()

    // 2. DeepSeek API Call - Specialized for "God-Tier" UI/UX
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
            content: `You are a World-Class Senior Frontend Engineer and UI/UX Designer.
            - Objective: Create stunning, breathtaking, and high-converting website components.
            - Tech Stack: Use ONLY pure HTML, Tailwind CSS, and Vanilla JavaScript.
            - Style: Follow modern design trends (Glassmorphism, Bento grids, smooth animations, and premium gradients).
            - Icons: Use Lucide Icons via CDN or SVG.
            - Functionality: Always include interactivity using JavaScript (e.g., scroll reveals, button hover effects, mobile menu logic).
            - Output: Return ONLY the code block. No explanations, no talk.
            - Ensure the code is mobile-responsive and looks like a $10,000 professional website.` 
          },
          { role: "user", content: `Create a premium, high-end website section for: ${prompt}` }
        ],
        temperature: 0.6 // Slightly lower temperature for more structured, reliable code
      })
    })

    const aiData = await response.json()
    const aiMessage = aiData.choices[0].message.content

    // 3. Deduct 3 Credits from user's account
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
    console.error("DeepSeek Error:", error.message)
    return NextResponse.json({ error: "An error occurred during premium code generation." }, { status: 500 })
  }
}