"use client"

import { useState } from "react"
import { Tldraw, type Editor } from "tldraw" 
import "tldraw/tldraw.css"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Code2, Eye, History, MousePointer2 } from "lucide-react"
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import HistorySidebar from "@/components/history-sidebar"

export default function CodeGenerator({ user }: { user: User }) {
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [showHistory, setShowHistory] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleGenerate = async () => {
    if (!editor) return

    setIsGenerating(true)
    setGeneratedCode("")

    try {
      // 1. Hel shapes-ka hadda la sawiray
      const shapeIds = Array.from(editor.getCurrentPageShapeIds())
      if (shapeIds.length === 0) {
        alert("Fadlan wax sawir marka hore!")
        setIsGenerating(false)
        return
      }

      // 2. ERROR FIX: Waxaan u isticmaalaynaa (editor as any) si looga takhaluso gaduudka TS
      const svg = await (editor as any).getSvg(shapeIds)
      
      if (!svg) throw new Error("Could not generate SVG")
      
      const svgString = new XMLSerializer().serializeToString(svg)
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`

      // 3. U dir API-ga (JSON Response - maadaama aan stream-ka iska dhaafnay)
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64Image,
          prompt: "Build a high-quality website from this sketch using Tailwind CSS." 
        }),
      })

      if (!response.ok) throw new Error("API Connection Failed")

      const data = await response.json()
      
      if (data.code) {
        setGeneratedCode(data.code)
        setActiveTab("preview")
      } else {
        throw new Error("No code received")
      }

    } catch (err) {
      console.error("Error:", err)
      alert("Cillad ayaa dhacday xiliga dhalinta code-ka.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <Header user={user} />

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <HistorySidebar 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => { setGeneratedCode(code); setShowHistory(false) }} 
        />

        {/* Bidix: tldraw Editor (Style-kaaga BG-White) */}
        <div className="w-full lg:w-1/2 border-r border-zinc-200 flex flex-col relative bg-white">
          <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-4 bg-zinc-50">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Sketch Pad
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden tldraw-light-custom">
            <Tldraw 
              onMount={(editor) => setEditor(editor)} 
              inferDarkMode={false}
            />
          </div>

          <div className="p-4 bg-white border-t border-zinc-200">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-12 font-bold transition-all shadow-sm"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating Code...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> Generate Project</>
              )}
            </Button>
          </div>
        </div>

        {/* Midig: Preview Area */}
        <div className="flex-1 flex flex-col bg-zinc-50">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="h-12 border-b border-zinc-200 bg-white px-4 flex items-center">
                <TabsList className="bg-zinc-100 border-zinc-200 h-8">
                  <TabsTrigger value="preview" className="text-xs px-4">Preview</TabsTrigger>
                  <TabsTrigger value="code" className="text-xs px-4">Code</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden bg-white">
                <TabsContent value="preview" className="h-full m-0">
                  <CodePreview code={generatedCode} />
                </TabsContent>
                <TabsContent value="code" className="h-full m-0 overflow-auto p-6 font-mono text-[13px] bg-zinc-900 text-zinc-300">
                  <pre><code>{generatedCode}</code></pre>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-zinc-200 blur-2xl rounded-full opacity-20" />
                <Sparkles className="h-20 w-20 mb-4 text-zinc-200 relative z-10" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400">Design Canvas Empty</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Hubi in tldraw ay u muuqato light mode */
        .tldraw-light-custom .tl-container { background-color: #ffffff !important; }
        .tl-ui { --tl-background: #ffffff !important; }
      `}</style>
    </div>
  )
}