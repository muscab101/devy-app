"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, FileCode, Search, Eye, Trash2, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  credits: number
  created_at: string
}

interface Project {
  id: string
  title: string
  prompt: string
  generated_code: string
  framework: string
  language: string
  created_at: string
  users: {
    email: string
    full_name: string | null
  }
}

interface AdminDashboardProps {
  users: User[]
  projects: Project[]
}

export default function AdminDashboard({ users, projects }: AdminDashboardProps) {
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [projectSearchTerm, setProjectSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [isAddingCredits, setIsAddingCredits] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()),
  )

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      project.users.email.toLowerCase().includes(projectSearchTerm.toLowerCase()),
  )

  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    adminUsers: users.filter((u) => u.is_admin).length,
    recentProjects: projects.filter((p) => {
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return new Date(p.created_at) > dayAgo
    }).length,
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return

    const amount = Number.parseInt(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number")
      return
    }

    setIsAddingCredits(true)

    try {
      console.log("[v0] Adding credits:", { userId: selectedUser.id, amount })

      const response = await fetch("/api/admin/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: amount,
        }),
      })

      const data = await response.json()
      console.log("[v0] Add credits response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to add credits")
      }

      alert(`Successfully added ${amount} credits! New balance: ${data.newBalance}`)

      // Refresh the page to show updated credits
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error adding credits:", error)
      alert(`Failed to add credits: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAddingCredits(false)
      setCreditAmount("")
      setSelectedUser(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.adminUsers} admin(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentProjects}</div>
            <p className="text-xs text-muted-foreground">Projects in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg per User</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? (stats.totalProjects / stats.totalUsers).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Projects per user</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Projects */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or name..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {user.credits || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              Add Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Credits to User</DialogTitle>
                              <DialogDescription>
                                Give credits to {user.email}. Current balance: {user.credits || 0} credits
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label htmlFor="credits" className="text-sm font-medium">
                                  Amount to Add
                                </label>
                                <Input
                                  id="credits"
                                  type="number"
                                  placeholder="Enter amount (e.g., 500)"
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  min="1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCreditAmount("100")}>
                                  +100
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCreditAmount("500")}>
                                  +500
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCreditAmount("1000")}>
                                  +1000
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline" disabled={isAddingCredits}>
                                  Cancel
                                </Button>
                              </DialogTrigger>
                              <Button onClick={handleAddCredits} disabled={isAddingCredits || !creditAmount}>
                                {isAddingCredits ? "Adding..." : "Add Credits"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Monitor all generated code projects</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title or user..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium max-w-xs truncate">{project.title}</TableCell>
                      <TableCell className="text-sm">{project.users.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {project.framework}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.language}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedProject(project)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>{project.title}</DialogTitle>
                              <DialogDescription>
                                Created by {project.users.email} •{" "}
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
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
