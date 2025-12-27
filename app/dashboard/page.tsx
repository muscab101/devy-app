import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Header from "@/components/header"
import ProjectList from "@/components/project-list"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-muted-foreground">View and manage all your generated code projects</p>
          </div>

          <ProjectList initialProjects={projects || []} />
        </div>
      </main>
    </div>
  )
}
