import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

// Isticmaal Service Role Key si aad u dhaafto RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook Signature Verification Failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Marka lacagta si guul ah loo bixiyo
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    
    const userId = session.metadata?.user_id
    const creditsToAdd = parseInt(session.metadata?.credits || "0")

    if (userId && creditsToAdd > 0) {
      try {
        // 1. Soo qaad credits-ka hadda u dhexeya user-ka
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single()

        if (fetchError) throw fetchError

        const newBalance = (profile?.credits || 0) + creditsToAdd

        // 2. Cusboonaysii database-ka (Update)
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({ credits: newBalance })
          .eq("id", userId)

        if (updateError) throw updateError

        console.log(`✅ Guul: ${creditsToAdd} credits ayaa loo daray user-ka ${userId}`)
      } catch (dbError: any) {
        console.error("Database Update Error:", dbError.message)
        return NextResponse.json({ error: "Credits update failed" }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}