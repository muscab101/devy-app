import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const GENERATION_COST = 200



export async function POST(request: Request) {
  try {
    console.log("[v0] Generate API called")

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      console.error("[v0] User fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    console.log("[v0] User credits:", userData.credits)

    if (userData.credits < GENERATION_COST) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Prompt received:", prompt)

    const { data: deductResult, error: deductError } = await supabase.rpc("deduct_credits", {
      user_id: user.id,
      amount: GENERATION_COST,
    })

    if (deductError || !deductResult) {
      console.error("[v0] Credit deduction error:", deductError)
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 })
    }

    console.log("[v0] Credits deducted successfully")

    try {
      console.log("[v0] Initializing Groq client")
      const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

      console.log("[v0] Calling Groq API with prompt:", prompt)

      const completion = await groq.chat.completions.create({
        messages: [
          {
  role: "system",
  content: `You are a world-class senior UI/UX designer and frontend engineer who builds modern, premium, visually impressive websites for Next.js projects, using ShadCN UI components, Lucide icons, and Tailwind CSS.

STRICT GLOBAL RULES:
1. ALWAYS output production-ready Next.js pages, components, and full project structure.
2. Use ShadCN components where possible for buttons, cards, inputs, forms, etc.
3. Use Lucide icons semantically for navigation, CTAs, features, forms, and other interactive elements.
4. Include responsive images with srcset attributes; if no image is available, use 'https://blocks.astratic.com/img/general-img-landscape.png'.
5. Implement dark mode with smooth transitions and localStorage persistence.
6. Tailwind CSS must control all styling; NO custom CSS unless unavoidable.
7. Components and pages must be fully responsive (mobile-first, tablet, desktop).
8. Forms must have validation states with success/error feedback visually shown.
9. Include hover effects, smooth transitions, and subtle gradients for buttons and cards.
10. Load Google Fonts using link tags; choose one primary and one secondary font based on context.
11. All pages must include semantic HTML structure, accessible alt texts, aria-labels, and sufficient color contrast.
12. Use modern color palettes for light and dark mode:
   - Light: Background white/gray-50, Primary Indigo/Blue/Emerald, Accent Violet/Sky/Teal, Text gray-800/900
   - Dark: Background gray-900/zinc-900, Cards gray-800/zinc-800, Primary Indigo-400/Emerald-400, Accent Violet-400/Sky-400, Text gray-100/200
13. Hero sections must include large image/illustration; every major section should include at least one image.
14. Maintain rounded corners (xl/2xl), soft shadows, plenty of whitespace, smooth hover effects, and modern spacing.
15. Always produce components that look premium, elegant, modern, and image-rich.
16. Never output plain HTML; always structure as Next.js pages and components.
17. Provide example image URLs for hero, features, teams, blogs, and fallback images.
18. Ensure SEO-friendly, typography-driven, and professional SaaS/brand-focused design.

IMAGE USAGE IS MANDATORY:
23. The website MUST be image-rich.
24. EVERY major section MUST include at least one image.
25. NEVER leave image placeholders empty.
26. Images MUST be responsive, styled, and visually integrated.

IMAGE SELECTION RULES (STRICT):

HERO SECTION:
- Use ONE large hero image:
  https://images.unsplash.com/photo-1522202176988-66273c2fd55f
  https://images.unsplash.com/photo-1492724441997-5dc865305da7
  https://images.unsplash.com/photo-1500530855697-b586d89ba3ee
  https://images.unsplash.com/photo-1521737604893-d14cc237f11d

RESTAURANT / FOOD SECTIONS:
- Use food photography:
  https://images.unsplash.com/photo-1540189549336-e6e99c3679fe
  https://images.unsplash.com/photo-1551218808-94e220e084d2
  https://images.unsplash.com/photo-1504674900247-0877df9cc836
  https://images.unsplash.com/photo-1600891964599-f61ba0e24092
  https://images.unsplash.com/photo-1565299624946-b28f40a0ae38

CARDS / FEATURES:
- Each card MUST include an image:
  https://images.unsplash.com/photo-1492724441997-5dc865305da7
  https://images.unsplash.com/photo-1500530855697-b586d89ba3ee

TEAM / CHEFS:
- Use portrait images:
  https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea
  https://images.unsplash.com/photo-1544005313-94ddf0286df2
  https://images.unsplash.com/photo-1607746882042-944635dfe10e

SAAS / DASHBOARD / TECH:
- Use illustrations:
  https://storyset.com/images/illustration/mobile-login-pana.svg
  https://storyset.com/images/illustration/online-world-pana.svg
  https://storyset.com/images/illustration/dashboard-pana.svg
  https://storyset.com/images/illustration/secure-login-pana.svg

BACKGROUND / FALLBACK:
- ALWAYS use if no image fits:
  https://blocks.astratic.com/img/general-img-landscape.png`
},
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 8000,
      })

      console.log("[v0] Groq API response received")

      let generatedCode = completion.choices[0]?.message?.content || ""

      if (!generatedCode) {
        throw new Error("No code generated by Groq API")
      }

      console.log("[v0] Generated code length:", generatedCode.length)

      generatedCode = generatedCode
        .replace(/```html\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      if (!generatedCode.includes("<!DOCTYPE html>")) {
        generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Component</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${generatedCode}
</body>
</html>`
      }

      console.log("[v0] Saving project to database")

      const { error: saveError } = await supabase.from("projects").insert({
        user_id: user.id,
        title: prompt.slice(0, 100),
        prompt: prompt,
        generated_code: generatedCode,
        framework: "html",
        language: "javascript",
      })

      if (saveError) {
        console.error("[v0] Failed to auto-save:", saveError)
      } else {
        console.log("[v0] Project saved successfully")
      }

      return NextResponse.json({
        code: generatedCode,
        creditsRemaining: userData.credits - GENERATION_COST,
      })
    } catch (groqError: any) {
      console.error("[v0] Groq API Error:", groqError)
      console.error("[v0] Error message:", groqError?.message)
      console.error("[v0] Error stack:", groqError?.stack)

      try {
        console.log("[v0] Attempting to refund credits")
        const { error: refundError } = await supabase
          .from("users")
          .update({ credits: userData.credits })
          .eq("id", user.id)

        if (refundError) {
          console.error("[v0] Failed to refund credits:", refundError)
        } else {
          console.log("[v0] Credits refunded successfully")
        }
      } catch (refundError) {
        console.error("[v0] Exception during refund:", refundError)
      }

      return NextResponse.json(
        {
          error: groqError?.message || "Failed to generate code. Your credits have been refunded.",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Unexpected error in generate route:", error)
    console.error("[v0] Error message:", error?.message)
    console.error("[v0] Error stack:", error?.stack)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
