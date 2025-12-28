import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GENERATION_COST = 200;

export async function POST(request: Request) {
  try {
    console.log("[Gemini] Generate API called")
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (userError || !userData) return NextResponse.json({ error: "User error" }, { status: 500 })

    if (userData.credits < GENERATION_COST) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    const { prompt } = await request.json()
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 })

    // Deduct Credits
    const { data: deductResult, error: deductError } = await supabase.rpc("deduct_credits", {
      user_id: user.id,
      amount: GENERATION_COST,
    })

    if (deductError || !deductResult) return NextResponse.json({ error: "Credit deduction failed" }, { status: 500 })

    try {
      console.log("[Gemini] Initializing Gemini AI")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a World-Class Senior Frontend Engineer. Your ONLY mission is to convert wireframes into PIXEL-PERFECT, high-end, and vibrant web designs.

        VISUAL PRIORITY (MANDATORY):
        1. COLOR: Use vibrant primary colors (e.g., #10B981 or #2563EB). Do NOT output B&W.
        2. BACKGROUND: Use soft-tinted backgrounds (bg-slate-50).
        3. RADIUS: Use extreme corner rounding (rounded-[2.5rem] or rounded-3xl).
        4. SHADOWS: Apply soft, expansive shadows (shadow-[0_20px_50px_rgba(0,0,0,0.04)]).
        5. TYPOGRAPHY: Use 'Outfit' font family. Include Google Fonts link in <head>.
        6. IMAGES: Use real high-quality Unsplash URLs only. No placeholders.

        STRICT CODE COMPLETENESS:
        - NO ABBREVIATIONS. Every section must be fully coded.
        - Output ONLY one complete HTML file with Tailwind CDN and JS.
        - Strictly code only. No preamble, no chatter.`
      });

      console.log("[Gemini] Generating content...")
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let generatedCode = response.text();

      // Clean the code (remove markdown backticks)
      generatedCode = generatedCode
        .replace(/```html\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      if (!generatedCode.includes("<!DOCTYPE html>")) {
        generatedCode = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>${generatedCode}</body>\n</html>`
      }

      // Save to database
      await supabase.from("projects").insert({
        user_id: user.id,
        title: prompt.slice(0, 100),
        prompt: prompt,
        generated_code: generatedCode,
        framework: "html",
        language: "javascript",
      })

      return NextResponse.json({
        code: generatedCode,
        creditsRemaining: userData.credits - GENERATION_COST,
      })

    } catch (apiError: any) {
      console.error("[Gemini] API Error:", apiError)
      // Refund credits on failure
      await supabase.from("users").update({ credits: userData.credits }).eq("id", user.id)
      return NextResponse.json({ error: "AI Generation failed. Credits refunded." }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Unexpected error occurred" }, { status: 500 })
  }
}