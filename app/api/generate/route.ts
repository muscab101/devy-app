import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 60 seconds waa waqtiga ugu badan ee Vercel Free tier u ogol yahay Function-ka
export const maxDuration = 60; 

const systemPrompt = `You are a Senior Web Architect. Your ONLY goal is to output a 100% COMPLETE HTML file based on the provided sketch.
- NEVER use markdown like \`\`\`html.
- START directly with <!DOCTYPE html>.
- END directly with </html>.
- NO placeholders or comments.
- Every section (Menu, Gallery, Footer) MUST be fully coded.
- Use Tailwind CDN and Vanilla JS for interactivity.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Please login." }, { status: 401 })
    }

    const { prompt, image } = await req.json()
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

    // 2. Gemini API Call (Non-Streaming Version)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nUser Instruction: ${prompt || "Build this design exactly as sketched."}` },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: image.split(",")[1], 
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192, // Waxaan u ogolaanay code aad u dheer
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
    }

    const result = await response.json();
    const fullGeneratedCode = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!fullGeneratedCode || fullGeneratedCode.length < 100) {
      return NextResponse.json({ error: "AI generated empty or too short code" }, { status: 500 });
    }

    // 3. Keydi Project-ka iyo Credit-ka ka jar
    await supabase.from("projects").insert({
      user_id: user.id,
      prompt: prompt || "Visual Sketch",
      code: fullGeneratedCode,
      name: (prompt || "Sketch Project").substring(0, 30)
    });

    await supabase.from("users").update({ 
      credits: profile.credits - COST_PER_REQUEST 
    }).eq("id", user.id);

    // 4. Hal mar soo celi code-ka
    return NextResponse.json({ code: fullGeneratedCode });

  } catch (error: any) {
    console.error("Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}