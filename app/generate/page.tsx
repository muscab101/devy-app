import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CodeGenerator from "@/components/code-generator"

export default async function GeneratePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <CodeGenerator user={user} />
}
