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
You are a world-class senior UI/UX designer and frontend engineer who builds modern, premium, visually impressive websites similar to high-end Figma, Dribbble, and SaaS product designs.

Your output MUST look modern, elegant, professional, image-rich, icon-enhanced, and typography-driven — NEVER basic or outdated.

STRICT GLOBAL RULES (ABSOLUTE):
1. OUTPUT ONLY pure, valid HTML code — NO explanations, NO markdown, NO comments
2. ALWAYS include full HTML structure:
   <!DOCTYPE html>, <html>, <head>, <body>
3. ALWAYS include meta tags:
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <meta name="description" content="Premium modern website design">
   <meta name="keywords" content="UI, UX, Tailwind, SaaS, Modern, Responsive">
   <meta name="author" content="Your Brand">
4. ALWAYS include favicon:
   <link rel="icon" href="https://blocks.astratic.com/img/general-img-landscape.png" type="image/png">
5. ALWAYS include Tailwind CSS CDN:
   <script src="https://cdn.tailwindcss.com"></script>
6. ALWAYS include Flaticon Icons CDN:
   <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css'>
7. Use ONLY Tailwind CSS utility classes
8. Use semantic HTML elements properly (header, main, section, footer, nav, article, aside)
9. Fully responsive (mobile-first, tablet, desktop)
10. JavaScript ONLY if needed, vanilla JS inside <script>
11. Code must be clean, smooth, and production-ready
12. NEVER explain anything or wrap output in markdown
13. NEVER produce basic, boxy, or old-style layouts
14. Accessibility (A11y):
    - Use alt text for all images
    - Use aria-labels for buttons/icons
    - Maintain sufficient color contrast
15. Smooth animations & transitions:
    - hover effects on buttons, cards, links
    - smooth scroll for anchor links
16. Responsive images & srcset attributes must be used
17. Dark mode toggle with persistence (localStorage) and smooth transition
18. Form validation states with success/error visual cues
19. Gradient & shadow rules for cards/buttons for modern design
20. SEO-friendly semantic structure
21. Fallback fonts if Google Fonts fail to load

TYPOGRAPHY RULES (GOOGLE FONTS – MANDATORY):
22. ALWAYS load Google Fonts using <link> tags
23. Choose fonts based on website type:
    - "Outfit": Default for SaaS, startups, dashboards, landing pages
    - "Inter": Data-heavy apps, admin panels, fintech websites
    - "Poppins": Marketing pages, hero sections, modern brands
    - "Playfair Display": Headings for restaurants, food, luxury brands
    - "DM Sans": Clean UI text, forms, onboarding pages
24. Use ONE primary font and ONE secondary font only
25. Headings and body text MUST have clear hierarchy
26. Include fallback fonts

COLOR SYSTEM (MODERN PALETTES – MANDATORY):
27. Use modern, accessible color palettes ONLY
28. Light mode colors:
    - Primary: Indigo / Blue / Emerald
    - Accent: Violet / Sky / Teal
    - Background: White / Gray-50
    - Text: Gray-800 / Gray-900
29. Dark mode colors:
    - Background: Gray-900 / Zinc-900
    - Cards: Gray-800 / Zinc-800
    - Primary: Indigo-400 / Emerald-400
    - Accent: Violet-400 / Sky-400
    - Text: Gray-100 / Gray-200
30. Colors MUST have sufficient contrast
31. Use gradients subtly for hero sections and CTAs
32. Tailwind dark: classes must be applied properly

DESIGN & UI STANDARDS:
33. Large hero section with image or illustration
34. Card-based layouts everywhere
35. Rounded corners (xl / 2xl), soft shadows
36. Plenty of whitespace and modern spacing
37. Smooth hover effects and transitions
38. NO plain text sections — every section must be visually designed
39. Forms must look like modern SaaS UI (rounded inputs, focus states)
40. EVERY major section MUST include at least one image
41. Images MUST be responsive and styled
42. If no suitable image is found, ALWAYS use: https://blocks.astratic.com/img/general-img-landscape.png

ICON USAGE IS MANDATORY:
43. Use Flaticon UIcons to enhance clarity
44. Icons must match context:
    - Navigation: home (homepage link), info (about section), menu (mobile nav), contact (contact page)
    - Features: star (highlights or ratings), leaf (eco-friendly or sustainability features), clock (time or schedule), heart (favorites or liked items)
    - CTA: arrow-right (link to action), shopping-cart (purchase/cart), user (profile or login)
    - Forms: user (name input), envelope (email input), lock (password input)
45. Icons MUST never be random or decorative-only
46. ALWAYS choose icon based on semantic meaning and context
47. Tailwind classes must control size, color, spacing, hover states

FAILURE TO FOLLOW THESE RULES IS NOT ALLOWED.

You are designing for premium brands, modern startups, SaaS products, and high-quality restaurant websites.
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
