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

// Syntax Highlighting
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

  // 1. Safe JSON Parsing (Cilad bixinta ugu muhiimsan)
  useEffect(() => {
    const text = rawText.trim()
    if (!text || !text.startsWith("{")) return

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
    } catch (e) { /* Sugaya inta kale */ }
  }, [rawText])

  // 2. Syntax Highlighting Update
  useEffect(() => {
    if (activeTab === "code") Prism.highlightAll()
  }, [generatedCode, selectedFileIndex, activeTab])

  const getLanguage = (name: string) => {
    const ext = name.split('.').pop()
    if (ext === 'js') return 'language-javascript'
    if (ext === 'css') return 'language-css'
    return 'language-markup'
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setRawText("")
    setGeneratedCode(null)
    setSelectedFileIndex(0)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Cillad ayaa dhacday")
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

        {/* Left Panel - Style Sawirka 3aad */}
        <div className="w-full lg:w-[350px] border-r border-zinc-800 p-6 flex flex-col gap-4 bg-zinc-950">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg text-white">AI Architect</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)} className="text-zinc-400">
              <History className="h-4 w-4" />
            </Button>
          </div>
          <Textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder="make me restaurant website..." 
            className="flex-1 min-h-[300px] bg-zinc-900 border-zinc-800 text-zinc-300 focus:border-amber-600" 
          />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 h-10">
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            Generate Project
          </Button>
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className="flex-1 bg-[#1d1f21] relative flex flex-col">
          {isGenerating && !generatedCode && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="flex gap-2 mb-4">
                {[0, 1, 2].map(i => <div key={i} className="hex-loader" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
              <p className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Architecting Files...</p>
            </div>
          )}

          {generatedCode ? (
            <div className="flex flex-col h-full">
              <div className="h-12 border-b border-white/5 bg-zinc-900/50 px-4 flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-zinc-800 h-8 border-zinc-700">
                    <TabsTrigger value="preview" className="text-xs"><Eye className="h-3 w-3 mr-2" /> Preview</TabsTrigger>
                    <TabsTrigger value="code" className="text-xs"><Code2 className="h-3 w-3 mr-2" /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* File Sidebar */}
                <div className="w-44 border-r border-white/5 bg-zinc-950/40 p-2 overflow-y-auto">
                  {generatedCode.files?.map((file, idx) => (
                    <button key={idx} onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[11px] mb-1 transition-all ${
                        selectedFileIndex === idx ? "bg-amber-600/20 text-amber-500 border border-amber-600/30" : "text-zinc-500 hover:bg-white/5"
                      }`}>
                      <FileCode className="h-3 w-3" /> {file.name}
                    </button>
                  ))}
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === "preview" ? (
                    <div className="h-full bg-white">
                      <CodePreview key={selectedFileIndex} code={generatedCode.files[selectedFileIndex]?.code || ""} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="px-4 py-1 text-[9px] bg-zinc-800/30 text-zinc-500 font-mono border-b border-white/5 uppercase">
                        {generatedCode.files[selectedFileIndex]?.name}
                      </div>
                      <pre className="flex-1 overflow-auto p-6 text-[13px] !bg-transparent font-mono custom-scrollbar">
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
            <div className="flex flex-col items-center justify-center h-full text-zinc-800 opacity-20">
              <Sparkles className="h-16 w-16 mb-4" />
              <p className="font-mono text-sm tracking-widest uppercase">Ready to Architect</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hex-loader { 
          width: 32px; height: 32px; background: #d97706; 
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); 
          animation: hex-pulse 1.2s infinite; 
        }
        @keyframes hex-pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        pre[class*="language-"] { background: transparent !important; margin: 0 !important; }
      `}</style>
    </div>
  )
}