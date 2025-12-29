"use client"

import { useState } from "react"
import { Tldraw, type Editor } from "tldraw" 
import "tldraw/tldraw.css"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, History, MousePointer2 } from "lucide-react"
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import HistorySidebar from "@/components/history-sidebar"

export default function CodeGenerator({ user }: { user: User }) {
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [showHistory, setShowHistory] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [userPrompt, setUserPrompt] = useState("")

  const handleGenerate = async () => {
    if (!editor) return;
    setIsGenerating(true);

    try {
      // 1. Hel shapes-ka jira
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0 && !userPrompt) {
        alert("Fadlan wax sawir ama qoraal ku dar!");
        setIsGenerating(false);
        return;
      }

      // 2. XALKA GADUUDKA: 'as any' ayaa meesha ka saaraya error-ka TS
      const svg = await (editor as any).getSvg(shapeIds);
      if (!svg) throw new Error("Could not generate SVG");
      
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`;

      // 3. API Call
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64Image,
          prompt: userPrompt 
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setGeneratedCode(data.code);
      setActiveTab("preview");
    } catch (e) {
      console.error("Cillad:", e);
      alert("Cillad ayaa dhacday xiliga dhalinta code-ka.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900 overflow-hidden">
      <Header user={user} />

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <HistorySidebar 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => { setGeneratedCode(code); setShowHistory(false) }} 
        />

        {/* DHANKA BIDIX: Tldraw (Xalka inuu baaba'o) */}
        <div className="w-full lg:w-1/2 border-r border-zinc-200 flex flex-col relative bg-white">
          <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-4 bg-zinc-50 flex-shrink-0">
            <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Visual Architect
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
          
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex-shrink-0">
            <textarea 
              placeholder="Sharax website-ka aad rabto..."
              className="w-full h-20 p-3 text-sm border border-zinc-200 rounded-md outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
          </div>
          
          {/* TLDRAW EDITOR: Container-kan 'absolute inset-0' ayaa ka hortagaya inuu baaba'o */}
          <div className="flex-1 relative bg-white">
            <div className="absolute inset-0">
              <Tldraw 
                onMount={(editor) => {
                    setEditor(editor);
                    // Ka saar dhibka Dark Mode-ka isna tuuraya
                    try {
                      (editor as any).user.updateUserPreferences({ isDarkMode: false });
                    } catch (e) {}
                }} 
                inferDarkMode={false}
              />
            </div>
          </div>

          <div className="p-4 bg-white border-t border-zinc-200 flex-shrink-0">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-12 font-bold shadow-sm"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> DeepSeek is Thinking...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> Generate Project</>
              )}
            </Button>
          </div>
        </div>

        {/* DHANKA MIDIG: Preview Area */}
        <div className="flex-1 flex flex-col bg-zinc-50 overflow-hidden">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="h-12 border-b border-zinc-200 bg-white px-4 flex items-center flex-shrink-0">
                <TabsList className="bg-zinc-100 border-zinc-200 h-8">
                  <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                  <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden bg-white">
                <TabsContent value="preview" className="h-full m-0 p-0 overflow-hidden">
                  <CodePreview code={generatedCode} />
                </TabsContent>
                <TabsContent value="code" className="h-full m-0 overflow-auto p-6 font-mono text-[13px] bg-zinc-900 text-zinc-300">
                  <pre><code>{generatedCode}</code></pre>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Sparkles className="h-20 w-20 mb-4 text-zinc-200" />
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400">Design Canvas Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}