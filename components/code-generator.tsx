"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Code2, Eye, AlertCircle, History } from "lucide-react"
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import HistorySidebar from "@/components/history-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CodeGeneratorProps {
  user: User
}

export default function CodeGenerator({ user }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      console.log("[v0] Sending generation request with prompt:", prompt)

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response content-type:", response.headers.get("content-type"))

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        setError("Server returned an invalid response. Please try again.")
        return
      }

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (response.status === 402) {
        setError("Insufficient credits. Please purchase more credits to continue generating code.")
        return
      }

      if (!response.ok) {
        setError(data.error || "Failed to generate code")
        return
      }

      if (data.code) {
        setGeneratedCode(data.code)
        setActiveTab("preview")
      }
    } catch (error) {
      console.error("[v0] Generation error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLoadHistory = (code: string, historyPrompt: string) => {
    setGeneratedCode(code)
    setPrompt(historyPrompt)
    setShowHistory(false)
  }

  return (
    <div className="flex lg:flex-row flex-col min-h-screen flex-col">
      <Header user={user} />

      <div className="flex flex-1 relative">
        <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} onLoadHistory={handleLoadHistory} />

        {/* Left Panel - Prompt Input */}
        <div className="w-full lg:w-2/5 border-r bg-background p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Generate Code</h2>
              <p className="text-muted-foreground text-sm">
                Describe what you want to build with HTML, Tailwind CSS & JavaScript
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium mb-2">Prompt</label>
              <Textarea
                placeholder="e.g., Create a modern hero section with a gradient background, heading, description, and CTA button"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 min-h-[200px] resize-none"
              />
            </div>

            <Button type="submit" disabled={!prompt.trim() || isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate (200 credits)
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right Panel - Code Preview */}
        <div className="lg:flex lg:w-3/5 bg-muted/30 flex-col">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="border-b px-6 py-3">
                <TabsList>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="preview" className="flex-1 m-0 p-6">
                <CodePreview code={generatedCode} />
              </TabsContent>
              <TabsContent value="code" className="flex-1 m-0">
                <pre className="h-full overflow-auto p-6 text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No code generated yet</p>
                <p className="text-sm">Enter a prompt and click Generate to see your code here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
