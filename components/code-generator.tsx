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
  
  // 1. SAX: Ku dar useState qoraalka prompt-ka
  const [userPrompt, setUserPrompt] = useState("")

  const handleGenerate = async () => {
    if (!editor) return;
    setIsGenerating(true);

    try {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0 && !userPrompt) {
        alert("Fadlan wax sawir ama qoraal ku dar!");
        setIsGenerating(false);
        return;
      }

      // Habka SVG si uusan u 'istuurin'
      const svg = await (editor as any).getSvg(shapeIds);
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64Image,
          prompt: userPrompt // 2. SAX: Isticmaal variable-ka saxda ah
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setGeneratedCode(data.code);
      setActiveTab("preview");
    } catch (e) {
      console.error(e);
      alert("Cillad: " + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <Header user={user} />

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <HistorySidebar 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          onLoadHistory={(code) => { setGeneratedCode(code); setShowHistory(false) }} 
        />

        {/* Bidix: tldraw Editor */}
        <div className="w-full lg:w-1/2 border-r border-zinc-200 flex flex-col relative bg-white">
          <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-4 bg-zinc-50">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Visual Sketch Pad
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
          
          {/* 3. SAX: Ku dar Input meel qoraalka laga qoro */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-200">
             <textarea 
               placeholder="Describe your website (e.g. 'Make a luxury restaurant menu')..."
               className="w-full h-20 p-3 text-sm border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
               value={userPrompt}
               onChange={(e) => setUserPrompt(e.target.value)}
             />
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
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> DeepSeek is Thinking...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> Generate with DeepSeek</>
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
              <Sparkles className="h-20 w-20 mb-4 text-zinc-200" />
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400 text-center px-10">
                Draw a layout and describe it to start
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .tldraw-light-custom .tl-container { background-color: #ffffff !important; }
        .tl-ui { --tl-background: #ffffff !important; }
      `}</style>
    </div>
  )
}