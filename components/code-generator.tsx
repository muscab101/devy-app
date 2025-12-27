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
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        setError("Server returned an invalid response. Please try again.")
        return
      }

      const data = await response.json()

      if (response.status === 402) {
        setError("Insufficient credits. Please purchase more credits.")
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
    <div className="flex min-h-screen flex-col">
      <Header user={user} />

      {/* ISBEDDELKA HALKAN AYUU KU JIRAA: 
          'flex-col' mobile-ka, 'lg:flex-row' shaashadaha waaweyn 
      */}
      <div className="flex flex-1 flex-col lg:flex-row relative">
        <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} onLoadHistory={handleLoadHistory} />

        {/* Left Panel - Prompt Input */}
        <div className="w-full lg:w-2/5 border-b lg:border-r bg-background p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-1">Generate Code</h2>
              <p className="text-muted-foreground text-xs lg:text-sm">
                Describe what you want to build with HTML, Tailwind CSS & JS
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Prompt</label>
              <Textarea
                placeholder="e.g., Create a modern hero section..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] lg:min-h-[300px] resize-none"
              />
            </div>

            <Button type="submit" disabled={!prompt.trim() || isGenerating} className="w-full">
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate (200 credits)</>
              )}
            </Button>
          </form>
        </div>

        {/* Right Panel - Code Preview (Hadda waa muuqataa mobile-ka) */}
        <div className="flex flex-1 lg:w-3/5 bg-muted/30 flex-col min-h-[500px]">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="border-b px-6 py-3 bg-background/50 backdrop-blur">
                <TabsList>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <Code2 className="h-4 w-4" /> Code
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="preview" className="flex-1 m-0 p-4 lg:p-6 overflow-auto">
                <CodePreview code={generatedCode} />
              </TabsContent>
              <TabsContent value="code" className="flex-1 m-0">
                <pre className="h-full overflow-auto p-6 text-xs lg:text-sm bg-zinc-950 text-zinc-50">
                  <code>{generatedCode}</code>
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No code generated yet</p>
                <p className="text-sm">Your creation will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}