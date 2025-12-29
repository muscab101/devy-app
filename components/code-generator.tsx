"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2 } from "lucide-react" // Waxaan ku daray Loader2
import { Button } from "@/components/ui/button" // Waxaan ku daray Button
import { type Editor } from "tldraw" // <--- Tani waxay bixinaysaa gaduudka Editor
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import Draw from "@/components/Draw"

export default function CodeGenerator({ user }: { user: User }) {
  const [generatedCode, setGeneratedCode] = useState("")
  const [activeTab, setActiveTab] = useState("preview")
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Function-ka sawirka ka qaadaya tldraw ee u diraya AI
  const handleGenerate = async () => {
    if (!editor) return;
    setIsGenerating(true);

    try {
      // 1. Hel shapes-ka ku sawiran canvas-ka
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) {
        alert("Fadlan wax sawir ka hor inta aadan dhalin code-ka!");
        setIsGenerating(false);
        return;
      }

      // 2. U beddel SVG (as any ayaa looga gudbaa TS errors)
      const svg = await (editor as any).getSvg(shapeIds);
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64Image = `data:image/svg+xml;base64,${btoa(svgString)}`;

      // 3. U dir API Route-kaaga
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();
      if (data.code) {
        setGeneratedCode(data.code);
        setActiveTab("preview");
      }
    } catch (e) {
      console.error("Error:", e);
      alert("Cillad ayaa dhacday!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden">
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* BIDIX: Qaybta Sawirka (Draw Component) */}
        <div className="w-full lg:w-1/2 border-r bg-white relative flex flex-col">
          <div className="flex-1 relative">
             <Draw setEditor={setEditor} />
          </div>

          {/* Badhanka Generate-ka oo hoos yaalla */}
          <div className="p-4 border-t bg-white">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className="w-full bg-zinc-900 text-white h-12 font-bold"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Coding...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> Generate Website</>
              )}
            </Button>
          </div>
        </div>

        {/* MIDIG: Qaybta Preview-ga */}
        <div className="flex-1 flex flex-col bg-zinc-50 overflow-hidden">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="h-12 border-b border-zinc-200 bg-white px-4 flex items-center flex-shrink-0">
                <TabsList className="bg-zinc-100 h-8">
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
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400">
                Draw on the left to start
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}