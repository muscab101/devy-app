"use client"

import { useState } from "react"
import { Tldraw, type Editor } from "tldraw" 
import "tldraw/tldraw.css"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, History, MousePointer2 } from "lucide-react"
import Header from "@/components/header"
import HistorySidebar from "@/components/history-sidebar"

export default function CodeGenerator({ user }: { user: any }) {
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [userPrompt, setUserPrompt] = useState("")

  const handleGenerate = async () => {
    if (!editor) return;
    setIsGenerating(true);

    try {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0 && !userPrompt) {
        alert("Fadlan wax sawir ama qoraal ku dar!");
        return;
      }

      // 1. Hel SVG-ga adigoo isticmaalaya (editor as any) si looga takhaluso gaduudka TS
      const svg = await (editor as any).getSvg(shapeIds);
      if (!svg) throw new Error("Could not generate SVG");
      
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`;

      // 2. U dir API-ga DeepSeek (Non-streaming)
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, prompt: userPrompt }),
      });

      const data = await response.json();
      if (data.code) setGeneratedCode(data.code);
      
    } catch (e) {
      console.error(e);
      alert("Cillad: " + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900 overflow-hidden">
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden relative">
        <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} onLoadHistory={setGeneratedCode} />

        {/* DHANKA BIDIX: Tldraw iyo Prompt */}
        <div className="w-full lg:w-1/2 border-r border-zinc-200 flex flex-col bg-white">
          <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-4 bg-zinc-50 flex-shrink-0">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Visual Sketch Pad
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4" />
            </Button>
          </div>

          {/* Prompt Input */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex-shrink-0">
            <textarea 
              placeholder="Sharax website-ka aad rabto..."
              className="w-full h-20 p-3 text-sm border border-zinc-200 rounded-md outline-none focus:ring-1 focus:ring-zinc-400"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
          </div>
          
          {/* Tldraw Container - Tani waa qaybta inta badan 'isqarisa' */}
          <div className="flex-1 relative bg-white">
            <div className="absolute inset-0">
              <Tldraw 
                onMount={(editor) => setEditor(editor)} 
                inferDarkMode={false}
              />
            </div>
          </div>

          <div className="p-4 border-t border-zinc-200 flex-shrink-0">
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-zinc-900 text-white h-12 font-bold">
              {isGenerating ? <><Loader2 className="animate-spin mr-2" /> Thinking...</> : "Generate with DeepSeek"}
            </Button>
          </div>
        </div>

        {/* DHANKA MIDIG: Preview (Iska dhaaf hadda code-kaaga kale) */}
        <div className="hidden lg:flex flex-1 bg-zinc-50 items-center justify-center">
             {/* Halkan CodePreview-gaaga geli */}
             {generatedCode ? <p className="text-xs">Code Generated!</p> : <p className="text-zinc-400">Preview Area</p>}
        </div>
      </div>
    </div>
  )
}