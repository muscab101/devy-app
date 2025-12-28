"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Code2, Eye, AlertCircle, History, FileCode } from "lucide-react"
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import HistorySidebar from "@/components/history-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"

interface ProjectData {
  files: { name: string; code: string }[]
}

export default function CodeGenerator({ user }: { user: User }) {
  const [prompt, setPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState<ProjectData | null>(null)
  const [rawText, setRawText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedFileIndex, setSelectedFileIndex] = useState(0)

  // 1. Safe Incremental JSON Parsing
  useEffect(() => {
    const text = rawText.trim()
    if (!text.startsWith("{")) return

    try {
      let sanitized = text
      if (!sanitized.endsWith("}")) {
        const lastFileEnd = sanitized.lastIndexOf('"}')
        if (lastFileEnd !== -1) {
          sanitized = sanitized.substring(0, lastFileEnd + 2) + "]}"
          if (!sanitized.includes('"files":[')) sanitized = '{"files":[' + sanitized
        } else { return }
      }
      const parsed = JSON.parse(sanitized)
      if (parsed.files) setGeneratedCode(parsed)
    } catch (e) { /* Silent wait for more chunks */ }
  }, [rawText])

  // 2. Prism Highlight
  useEffect(() => {
    if (activeTab === "code") Prism.highlightAll()
  }, [generatedCode, selectedFileIndex, activeTab])

  const getLanguage = (name: string) => {
    const ext = name.split('.').pop()
    return ext === 'js' ? 'language-javascript' : ext === 'css' ? 'language-css' : 'language-markup'
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setRawText("")
    setGeneratedCode(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Generation failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.replace("data: ", ""))
              setRawText(prev => prev + (json.choices[0]?.delta?.content || ""))
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header user={user} />
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => { setGeneratedCode(JSON.parse(code)); setShowHistory(false) }} />

        {/* Left Panel */}
        <div className="w-full lg:w-[400px] border-r p-6 flex flex-col gap-4 bg-card">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl tracking-tight">AI Architect</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}><History className="h-4 w-4" /></Button>
          </div>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} 
            placeholder="Describe your 6-page project..." className="flex-1 min-h-[300px] bg-muted/50" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12">
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {isGenerating ? "Generating..." : "Generate Project"}
          </Button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-[#1d1f21] relative flex flex-col min-h-0">
          {isGenerating && !generatedCode && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex gap-2 mb-4">
                {[0, 1, 2].map(i => <div key={i} className="hex-loader" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
              <p className="text-amber-500 font-mono text-xs uppercase tracking-widest">Building your files...</p>
            </div>
          )}

          {generatedCode ? (
            <div className="flex flex-col h-full">
              <div className="h-14 border-b border-white/5 bg-zinc-900/80 px-4 flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-zinc-800 border-zinc-700">
                    <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-2" /> Preview</TabsTrigger>
                    <TabsTrigger value="code"><Code2 className="h-4 w-4 mr-2" /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* File Sidebar */}
                <div className="w-48 border-r border-white/5 bg-zinc-900/20 p-2 overflow-y-auto">
                  {generatedCode.files?.map((file, idx) => (
                    <button key={idx} onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs mb-1 transition-all ${
                        selectedFileIndex === idx ? "bg-amber-600 text-white shadow-lg" : "text-zinc-400 hover:bg-white/5"
                      }`}>
                      <FileCode className="h-3.5 w-3.5" /> {file.name}
                    </button>
                  ))}
                </div>

                {/* Editor/Preview */}
                <div className="flex-1 overflow-hidden bg-[#1d1f21]">
                  {activeTab === "preview" ? (
                    <div className="h-full bg-white"><CodePreview code={generatedCode.files[selectedFileIndex]?.code || ""} /></div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="px-4 py-1 text-[10px] bg-zinc-800/50 text-zinc-500 font-mono border-b border-white/5 uppercase tracking-widest">
                        {generatedCode.files[selectedFileIndex]?.name}
                      </div>
                      <pre className="flex-1 overflow-auto p-6 text-sm !bg-transparent font-mono custom-scrollbar">
                        <code className={getLanguage(generatedCode.files[selectedFileIndex]?.name)}>
                          {generatedCode.files[selectedFileIndex]?.code}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-700 opacity-20">
              <Sparkles className="h-20 w-20 mb-4" />
              <p className="font-mono text-xl uppercase tracking-tighter">Ready to Architect</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hex-loader { width: 30px; height: 30px; background: #d97706; clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #373b41; border-radius: 10px; }
        pre[class*="language-"] { background: transparent !important; margin: 0 !important; }
      `}</style>
    </div>
  )
}