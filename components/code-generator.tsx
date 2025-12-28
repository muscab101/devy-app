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

// PRISM JS IMPORTS
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css" // Tomorrow Night Theme
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

  // 1. Prism Highlighting Logic
  useEffect(() => {
    if (activeTab === "code") {
      Prism.highlightAll()
    }
  }, [generatedCode, selectedFileIndex, activeTab, rawText])

  // 2. JSON Parsing Logic
  useEffect(() => {
    if (rawText.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(rawText)
        setGeneratedCode(parsed)
      } catch (e) {
        // Welia JSON-ku ma dhammaystirna
      }
    }
  }, [rawText])

  // Utility to get language for Prism
  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()
    if (ext === 'html') return 'language-markup'
    if (ext === 'css') return 'language-css'
    if (ext === 'js') return 'language-javascript'
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

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.replace("data: ", ""))
              const content = json.choices[0]?.delta?.content || ""
              setRawText((prev) => prev + content)
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
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <div className="flex flex-1 flex-col lg:flex-row relative">
        <HistorySidebar 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => {
            try { setGeneratedCode(JSON.parse(code)) } catch(e) {}
            setShowHistory(false)
          }} 
        />

        {/* Left Panel */}
        <div className="w-full lg:w-2/5 border-b lg:border-r bg-background p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Multi-Page AI</h2>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" /> History
            </Button>
          </div>
          
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <Textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="e.g. A restaurant website with home, services, login and signup pages..."
              className="min-h-[300px] font-medium"
            />
            <Button disabled={isGenerating} className="h-12 text-md">
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              {isGenerating ? "Building Project..." : "Generate Full Project (3 Credits)"}
            </Button>
          </form>
        </div>

        {/* Right Panel */}
        <div className="flex flex-1 lg:w-3/5 bg-[#1d1f21] flex-col min-h-[500px] relative overflow-hidden">
          
          {isGenerating && !generatedCode && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md">
              <div className="flex gap-3 mb-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="hex-loader" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="animate-pulse font-mono text-amber-500 text-sm tracking-widest uppercase">Initializing Architect...</p>
            </div>
          )}

          {generatedCode ? (
            <div className="flex flex-col h-full">
              <div className="border-b border-white/5 px-6 py-3 bg-zinc-900/50 flex justify-between items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-zinc-800 border-zinc-700">
                    <TabsTrigger value="preview" className="data-[state=active]:bg-amber-600"><Eye className="h-4 w-4 mr-2" /> Preview</TabsTrigger>
                    <TabsTrigger value="code" className="data-[state=active]:bg-amber-600"><Code2 className="h-4 w-4 mr-2" /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                  Tomorrow Night Theme
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-52 border-r border-white/5 bg-zinc-900/30 p-3 overflow-y-auto">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-4 px-2 tracking-widest">Project Explorer</p>
                  {generatedCode.files?.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] mb-1 transition-all ${
                        selectedFileIndex === idx 
                        ? "bg-amber-600/20 text-amber-500 border border-amber-600/30" 
                        : "text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <FileCode className="h-4 w-4 opacity-70" /> 
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-[#1d1f21] overflow-hidden flex flex-col">
                  {activeTab === "preview" ? (
                    <div className="h-full bg-white">
                       <CodePreview 
                        key={selectedFileIndex}
                        code={generatedCode.files[selectedFileIndex]?.code || ""} 
                       />
                    </div>
                  ) : (
                    <div className="h-full overflow-auto custom-scrollbar">
                      <div className="bg-zinc-800/50 px-4 py-1 text-[11px] text-zinc-500 font-mono border-b border-white/5">
                        {generatedCode.files[selectedFileIndex]?.name}
                      </div>
                      <pre className="m-0 p-6 text-sm !bg-transparent font-mono">
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
             <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
                <Sparkles className="h-12 w-12 opacity-10" />
                <p className="text-sm font-mono tracking-tight opacity-40 uppercase text-center">
                  Enter a prompt to start<br/>generating your multi-page project
                </p>
             </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hex-loader {
          width: 35px;
          height: 35px;
          background: #d97706;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          animation: pulse 1.5s infinite ease-in-out;
          box-shadow: 0 0 15px rgba(217, 119, 6, 0.3);
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(2px); }
          50% { transform: scale(1.15); opacity: 1; filter: blur(0px); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1d1f21;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #373b41;
          border-radius: 4px;
        }
        pre[class*="language-"] {
          background: transparent !important;
          margin: 0 !important;
        }
      `}</style>
    </div>
  )
}