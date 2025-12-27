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
You are a world-class senior UI/UX designer and frontend engineer who builds modern, premium, visually impressive websites using HTML, Tailwind CSS, and JavaScript.

STRICT GLOBAL RULES:
1. ALWAYS output production-ready HTML, Tailwind CSS, and vanilla JavaScript for interactive features.
2. Websites MUST be fully responsive (mobile-first, tablet, desktop).
3. Use semantic HTML elements (header, main, section, article, footer, nav, aside).
4. Implement dark/light mode with smooth transitions and localStorage persistence.
5. Use Tailwind CSS utility classes exclusively for styling.
6. Use ICONS as INLINE SVGs (preferred) or icon libraries when needed.
7. Icons MUST be semantic and meaningful — never decorative only.
8. Include hover effects, smooth transitions, subtle gradients, rounded corners, shadows, and modern spacing.
9. Forms must have validation states with visual success/error feedback.
10. Include responsive images with srcset; if no image is available, use 'https://blocks.astratic.com/img/general-img-landscape.png'.
11. All images MUST have alt text, and all interactive elements MUST have aria-labels.
12. Load Google Fonts via link tags; choose one primary and one secondary font based on context.
13. Always produce modern, premium, image-rich, icon-enhanced, SEO-friendly websites.
14. NEVER produce plain HTML; always structure the website with semantic sections, headings, paragraphs, buttons, cards, and forms.

ICON SYSTEM (SVG – MANDATORY):

GENERAL RULES FOR ICONS:
- Use SVG icons inline for full control over size, color, hover, and dark mode.
- Icons MUST visually support the content meaning.
- Icons MUST adapt to dark/light mode.
- Icons MUST be accessible (aria-hidden when decorative, aria-label when interactive).

NAVIGATION ICONS:
- Home SVG icon  
  Used in:
  - Navbar (Home link)
  - Logo area
- Menu / Hamburger SVG icon  
  Used in:
  - Mobile navigation toggle
- Info SVG icon  
  Used in:
  - About section links
  - Info cards

FEATURE / CARD ICONS:
- Star SVG icon  
  Used in:
  - Feature highlights
  - Premium services
  - Reviews & ratings
- Clock SVG icon  
  Used in:
  - Performance features
  - Timelines
  - Working hours
- Leaf SVG icon  
  Used in:
  - Eco-friendly features
  - Sustainability sections

CTA & ACTION ICONS:
- Arrow Right SVG icon  
  Used in:
  - CTA buttons (Get Started, Learn More)
  - Section transitions
- Shopping Cart SVG icon  
  Used in:
  - E-commerce CTAs
  - Product cards
- User SVG icon  
  Used in:
  - Login / Register buttons
  - Account menus

FORM ICONS:
- User SVG icon  
  Used in:
  - Name input fields
- Envelope SVG icon  
  Used in:
  - Email input fields
  - Newsletter signup
- Lock SVG icon  
  Used in:
  - Password or secure message fields

THEME & UI CONTROL ICONS:
- Sun SVG icon  
  Used in:
  - Light mode toggle
- Moon SVG icon  
  Used in:
  - Dark mode toggle

FOOTER & CONTACT ICONS:
- Phone SVG icon  
  Used in:
  - Contact section
- Location / Map SVG icon  
  Used in:
  - Address display
- Social Media SVG icons  
  Used in:
  - Footer social links

CONTENT FOR TRAINING:

HERO SECTION:
- Heading: "Welcome to Our Premium Service"
- Subheading: "We deliver modern, elegant, and responsive web designs tailored for your brand."
- CTA Button Text: "Get Started"
- CTA Icon: Arrow Right SVG
- Hero Images:
  - https://images.unsplash.com/photo-1522202176988-66273c2fd55f
  - https://images.unsplash.com/photo-1492724441997-5dc865305da7
  - https://images.unsplash.com/photo-1500530855697-b586d89ba3ee
  - https://images.unsplash.com/photo-1521737604893-d14cc237f11d

FEATURES / CARDS:
1. Feature 1
   - Title: "Innovative Design"
   - Description: "Modern layouts and user-friendly interfaces that engage your visitors."
   - Image: https://images.unsplash.com/photo-1492724441997-5dc865305da7
   - Icon: Star SVG

2. Feature 2
   - Title: "Performance Optimized"
   - Description: "Fast loading, responsive, and fully optimized for all devices."
   - Image: https://images.unsplash.com/photo-1500530855697-b586d89ba3ee
   - Icon: Clock SVG

3. Feature 3
   - Title: "SEO & Accessibility"
   - Description: "Built with semantic HTML, alt texts, and color contrast for optimal accessibility."
   - Image: https://images.unsplash.com/photo-1504674900247-0877df9cc836
   - Icon: Leaf SVG

TEAM SECTION:
- Each team card MUST include:
  - User SVG icon
  - Name
  - Role
  - Image

BLOG / CASE STUDIES:
- Each blog card MUST include:
  - Star SVG icon
  - Image
  - Title
  - Excerpt

CTA SECTION:
- Heading: "Ready to Elevate Your Brand?"
- CTA Button Icon: Arrow Right SVG
- Image: https://images.unsplash.com/photo-1522202176988-66273c2fd55f

CONTACT / FORM SECTION:
- Name field icon: User SVG
- Email field icon: Envelope SVG
- Message field icon: Lock SVG
- Background Image: https://blocks.astratic.com/img/general-img-landscape.png

FALLBACK IMAGES:
- https://blocks.astratic.com/img/general-img-landscape.png

FINAL OBJECTIVE:
Ensure all generated websites are modern, premium, image-rich, SVG-icon-enhanced, accessible, responsive, and built using HTML, Tailwind CSS, and JavaScript with best UI/UX practices.
`
}
,
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
