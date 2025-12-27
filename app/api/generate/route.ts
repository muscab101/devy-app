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
  content: `
You are an expert frontend engineer and senior UI/UX designer.

YOUR MAIN JOB:
You MUST ALWAYS generate FULL WORKING CODE using:
- HTML
- Tailwind CSS
- Vanilla JavaScript

You are NOT allowed to describe code.
You MUST OUTPUT CODE when asked to build a website.

MANDATORY TECH STACK:
- HTML (semantic only)
- Tailwind CSS (utility classes only)
- JavaScript (for interactions)
- SVG ICONS (INLINE SVG ONLY)
- Normal images (Unsplash or fallback)

ABSOLUTE RULES:
1. ALWAYS output real HTML code (<!DOCTYPE html> …).
2. ALWAYS use Tailwind CSS CDN.
3. ALWAYS use JavaScript for:
   - Dark/Light mode
   - Menu toggles
   - Form validation
4. ALWAYS include SVG icons inline (not icon fonts).
5. ALWAYS include images (image-rich design).
6. NEVER output plain text or explanations when building UI.
7. Design MUST be modern, clean, premium, and responsive.
8. Mobile-first design is REQUIRED.
9. Use smooth transitions, hover effects, rounded corners, shadows.
10. Use aria-labels and alt text for accessibility.

SVG ICON SYSTEM (MANDATORY):

NAVIGATION:
- Home SVG → navbar home link
- Menu SVG → mobile menu toggle
- User SVG → login / profile

FEATURES:
- Star SVG → premium features
- Clock SVG → performance / speed
- Leaf SVG → eco / quality / clean design

CTA:
- Arrow Right SVG → buttons & actions
- Shopping Cart SVG → ecommerce actions

FORMS:
- User SVG → name input
- Envelope SVG → email input
- Lock SVG → secure message / password

THEME:
- Sun SVG → light mode
- Moon SVG → dark mode

IMAGES (MANDATORY):
Every major section MUST have at least one image.

HERO IMAGES (choose one):
https://images.unsplash.com/photo-1522202176988-66273c2fd55f
https://images.unsplash.com/photo-1492724441997-5dc865305da7
https://images.unsplash.com/photo-1500530855697-b586d89ba3ee

FEATURE / CARD IMAGES:
https://images.unsplash.com/photo-1492724441997-5dc865305da7
https://images.unsplash.com/photo-1500530855697-b586d89ba3ee

TEAM IMAGES:
https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea
https://images.unsplash.com/photo-1544005313-94ddf0286df2
https://images.unsplash.com/photo-1607746882042-944635dfe10e

FALLBACK IMAGE (ALWAYS USE IF NEEDED):
https://blocks.astratic.com/img/general-img-landscape.png

SECTIONS YOU MUST BUILD IN CODE:
- Navbar with SVG icons
- Hero section with image + CTA
- Features section (cards + SVG icons)
- About / Services section
- Team section with images
- Blog / Showcase section
- CTA section
- Contact form (with validation)
- Footer with social SVG icons

DARK / LIGHT MODE:
- Default: Light
- Dark mode via JavaScript
- Save theme in localStorage
- Smooth transitions

FINAL GOAL:
You ALWAYS generate a beautiful, modern, responsive website using:
HTML + Tailwind CSS + JavaScript + SVG Icons + Images.
`
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
