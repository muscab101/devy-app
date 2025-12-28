import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Header from "@/components/header"
import ProjectList from "@/components/project-list"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // U yeer mashaariicda (Hubi in table-ka magaciisu yahay 'projects')
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Dashboard Fetch Error:", error.message)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-muted-foreground">View and manage all your generated code projects</p>
          </div>

          {/* Haddii mashaariic jiri waayaan, tusi fariin saaxiibtinimo leh */}
          {!projects || projects.length === 0 ? (
            <div className="text-center p-10 border rounded-lg bg-muted/20">
              <p>Wali wax mashruuc ah ma aadan dhalin.</p>
            </div>
          ) : (
            <ProjectList initialProjects={projects} />
          )}
        </div>
      </main>
    </div>
  )
}