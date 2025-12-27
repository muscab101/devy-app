import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Header from "@/components/header"
import AdminDashboard from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/generate")
  }

  // Fetch all users
  const { data: users } = await supabase
    .from("users")
    .select("*") // Include credits in the query
    .order("created_at", { ascending: false })

  // Fetch all projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*, users(email, full_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />

      <main className="flex-1 p-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and monitor platform activity</p>
          </div>

          <AdminDashboard users={users || []} projects={projects || []} />
        </div>
      </main>
    </div>
  )
}
