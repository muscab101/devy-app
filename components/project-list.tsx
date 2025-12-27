"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Code2, Eye, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Project {
  id: string
  title: string
  prompt: string
  generated_code: string
  framework: string
  language: string
  created_at: string
  updated_at: string
}

interface ProjectListProps {
  initialProjects: Project[]
}

export default function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.prompt.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })
      setProjects(projects.filter((p) => p.id !== id))
      setSelectedProject(null)
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{project.title}</DialogTitle>
                        <DialogDescription className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="code" className="flex-1">
                        <TabsList>
                          <TabsTrigger value="code">Code</TabsTrigger>
                          <TabsTrigger value="prompt">Prompt</TabsTrigger>
                        </TabsList>
                        <TabsContent value="code" className="h-[calc(80vh-180px)] overflow-auto">
                          <pre className="text-sm bg-muted p-4 rounded-lg">
                            <code>{project.generated_code}</code>
                          </pre>
                        </TabsContent>
                        <TabsContent value="prompt" className="h-[calc(80vh-180px)] overflow-auto">
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm">{project.prompt}</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Badge variant="secondary">{project.framework}</Badge>
                          <Badge variant="secondary">{project.language}</Badge>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription className="line-clamp-2">{project.prompt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-2">
                    <Badge variant="outline">{project.framework}</Badge>
                    <Badge variant="outline">{project.language}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try adjusting your search" : "Start generating code to see your projects here"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
