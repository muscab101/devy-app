import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Fadlan soo gal nidaamka (Unauthorized)" }, { status: 401 })
    }

    // Ka soo qaad xogta plan-ka ee la soo diray
    const { amount, credits, planName } = await req.json()

    // Hubi in SITE_URL uu jiro si looga baxo error-ka "Invalid URL"
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${credits} AI Credits (${planName})`,
              description: `Dhalinta code-ka premium-ka ah ee AI-ga.`,
            },
            unit_amount: amount, 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}