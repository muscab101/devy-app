import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { userId, amount } = await request.json()

    console.log("[v0] Adding credits via RPC:", { userId, amount })

    if (!userId || !amount) {
      return NextResponse.json({ error: "User ID and amount are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    // Call the database function to add credits
    const { data, error } = await supabase.rpc("admin_add_credits", {
      target_user_id: userId,
      credit_amount: amount,
    })

    if (error) {
      console.error("[v0] RPC error:", error)
      return NextResponse.json({ error: "Failed to add credits" }, { status: 500 })
    }

    console.log("[v0] RPC result:", data)

    // data is an array with one row
    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 403 })
    }

    return NextResponse.json({ success: true, newBalance: result.new_balance })
  } catch (error) {
    console.error("[v0] Error in add-credits API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
