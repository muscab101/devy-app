"use client"

import { useState } from "react"
// ERROR FIX: Ka saar exportToBlob iyo exportToCanvas halkan
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
      // 1. Hel dhammaan wixii lagu sawiray Canvas-ka
      const shapeIds = Array.from(editor.getCurrentPageShapeIds())
      if (shapeIds.length === 0) {
        alert("Fadlan wax sawir marka hore!")
        setIsGenerating(false)
        return
      }

      // 2. ERROR FIX (image_870388.png): getSvg hadda waa asycn, waxaana laga helaa tldraw utils
      // Waxaan isticmaalaynaa habka ugu fudud ee v2 si sawir looga qaado
      const { getSvg } = await import('tldraw')
      const svg = await getSvg(editor, shapeIds)
      
      if (!svg) throw new Error("Could not generate SVG")
      
      const svgString = new XMLSerializer().serializeToString(svg)
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`

      // 3. U dir API-ga (Hubi in API-gaagu leeyahay Vision awood)
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64Image,
          prompt: "Build a high-quality website from this sketch using Tailwind CSS." 
        }),
      })

      if (!response.ok) throw new Error("API Error")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      setActiveTab("preview")

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.replace("data: ", ""))
              setGeneratedCode(prev => prev + (json.choices[0]?.delta?.content || ""))
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <Header user={user} />

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => { setGeneratedCode(code); setShowHistory(false) }} />

        {/* Bidix: tldraw Editor - Style-ka sawirkaaga (image_fe425d.png) */}
        <div className="w-full lg:w-1/2 border-r border-zinc-800 flex flex-col relative bg-zinc-900">
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-black/20">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Visual Architect
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden tldraw-dark-theme">
            <Tldraw 
              onMount={(editor) => setEditor(editor)} 
              inferDarkMode={true}
            />
          </div>

          <div className="p-4 bg-zinc-950 border-t border-zinc-800">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className="w-full bg-white text-black hover:bg-zinc-200 h-12 font-bold transition-all"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2" /> Architecting...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Project</>
              )}
            </Button>
          </div>
        </div>

        {/* Midig: Preview Area */}
        <div className="flex-1 flex flex-col bg-[#121212]">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="h-12 border-b border-white/5 bg-zinc-900 px-4 flex items-center">
                <TabsList className="bg-zinc-800 border-zinc-700 h-8">
                  <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                  <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="preview" className="h-full m-0 bg-white">
                  <CodePreview code={generatedCode} />
                </TabsContent>
                <TabsContent value="code" className="h-full m-0 overflow-auto p-6 font-mono text-[13px] text-zinc-400">
                  <pre><code>{generatedCode}</code></pre>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-800">
              <div className="relative">
                <Sparkles className="h-24 w-24 mb-4 opacity-5" />
                <div className="absolute inset-0 animate-pulse bg-white/5 blur-3xl rounded-full" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] opacity-20">Ready to Architect</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .tldraw-dark-theme .tl-container { background-color: #09090b !important; }
        .tl-ui { --tl-background: #18181b !important; }
        .tl-theme__dark { background: #09090b !important; }
      `}</style>
    </div>
  )
}