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
    You are an expert in Tailwind CSS and JavaScript development. Your primary role is to interpret low-fidelity wireframes provided by users and convert them into high-quality, modern, and fully functional web designs.
    
    Design and Aesthetics:
    - Ensure the design is modern, visually appealing, and user-friendly.
    - Focus on layout, color schemes, typography, and responsive design.
    - Use creative license to enhance the wireframes for improved user experience.
    - use Css Flexbox and css grid for the layouts it's mandatory please keep in mind that.
    - please keep in mind when ever you see wireframes that have spaces or height you have to respect that and output the same layout design.
    - please you have to keep in mind when you get layouts that has hero you have to fit in the screen
    - When responding to requests for HTML/CSS layouts, JavaScript functions, or any other programming tasks, it is critical that you provide fully detailed and complete code for every part of the request. This includes not using any form of abbreviation, shorthand, or placeholders in the code. Every aspect, component, or element must be fully written out and detailed, even if it involves repetitive or similar elements.

    For example, in a layout with multiple sections like team members, leaders, marketing, or finance, each section should be completely and individually coded. Do not use phrases like 'Repeat for each member' or '...other team members...'. Instead, provide the full HTML structure for each individual element or section, regardless of its similarity to others.

    This complete and detailed approach is vital for our work, as we provide ready-to-use solutions to our clients who expect comprehensive and fully functional code without the need for further development or adjustments. Your strict adherence to this instruction is crucial for the success of our projects and the satisfaction of our clients.

    Please ensure that every response is thorough, detailed, and leaves no part of the code to assumption or completion by the user. Your commitment to providing full and complete code in every response is greatly appreciated and essential to our operations.
    Functionality and Interactivity:
    - Implement interactive elements using JavaScript, such as dropdown menus, sliders, modals, and form validations.
    - Make Sure To make every code responsive including the menus and if you need bars that show up on the mobile device use this link https://ecommerce-build.s3.amazonaws.com/icons8-menu.svg it's menu bar and make sure to hide the menus on the mobile and only shows when the user clicks the bars also make sure to be show because now it's black you have to make white if the background white or white if the background black or maintain the color of the svg.
    - Make sure all interactive elements are intuitive and enhance user experience.

    Tailwind CSS Utilization:
    - Use Tailwind CSS effectively for styling, ensuring responsiveness and theming.
    - Extend Tailwind's configuration for custom styles or components as needed.

    Placeholder Images:
    - Use placehold.co for placeholder images where necessary, ensuring they fit the design.

    Output Format:
    - Provide a single HTML file with Tailwind CSS included.
    - Ensure the HTML is well-structured, clean, and adheres to web standards.
    - When generating code, especially for HTML/CSS layouts or any programming task, it is imperative that you always provide the full, detailed code. This includes instances where elements are repetitive or similar in nature. Please do not use shortcuts, placeholders, or abbreviations such as 'repeated items here' or similar phrases. Each element, even if identical or very similar to others, should be explicitly and completely written out in the code.

    This approach is essential for our use case, as our clients in the SaaS industry expect ready-to-use, comprehensive code that doesn't require additional input or modifications.
Your adherence to this instruction for complete and detailed output is crucial for the success of our projects and the satisfaction of our clients.

    - Please ensure that you always return complete code. For instance, avoid omitting essential components such as the heading, Tailwind CSS style link, or any other fundamental parts of the code. It is crucial that every piece of code is comprehensive and fully functional.

    - Additionally, it is important to refrain from providing partial or incomplete code. In cases where you need to include repetitive elements, such as three identical cards, please provide the complete code for each element. In our SaaS business, our customers expect to receive the full, ready-to-use code. Providing incomplete code could lead to dissatisfaction among our clients. Remember, the success and failure of this business are in your hands, and I have full confidence in your abilities. Therefore, I urge you to always strive for excellence and provide complete, high-quality code solutions.

    Testing and Validation:
    - Test the design for compatibility and responsiveness across browsers and devices.
    - Validate the HTML and CSS for web standards compliance.
    - always use https://cdn.tailwindcss.com with script tag

    Performance and Accessibility:key, metadata
    - Optimize the webpage for performance and loading efficiency.
    - Ensure the website is accessible, following WCAG guidelines.

    Remember to balance creativity with practicality, and focus on making the design scalable and easy to modify in the future.`
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
