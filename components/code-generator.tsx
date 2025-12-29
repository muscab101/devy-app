"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Editor } from "tldraw"
import CodePreview from "@/components/code-preview"
import Header from "@/components/header"
import Draw from "@/components/Draw"

export default function CodeGenerator({ user }: { user: User }) {
  const [generatedCode, setGeneratedCode] = useState("")
  const [activeTab, setActiveTab] = useState("preview")
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!editor) {
      alert("Canvas-ka wali ma diyaarsana!")
      return
    }

    setIsGenerating(true)

    try {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds())

if (shapeIds.length === 0) {
  alert("Fadlan wax sawir marka hore!")
  return
}

// ✅ HABKA SAXDA AH EE TLDraw v2
// @ts-ignore
const svgString = await editor.getSvgString(shapeIds)

if (!svgString) {
  throw new Error("SVG lama dhalin")
}

const base64Image =
  "data:image/svg+xml;base64," +
  btoa(unescape(encodeURIComponent(svgString)))


      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      })

      const data = await response.json()

      if (data.code) {
        setGeneratedCode(data.code)
        setActiveTab("preview")
      }
    } catch (err) {
      console.error(err)
      alert("Cillad dhacday, isku day mar kale.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden">
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden">
        {/* Bidix */}
        <div className="w-full lg:w-1/2 border-r flex flex-col">
          <div className="flex-1">
            <Draw setEditor={setEditor} />
          </div>

          <div className="p-4 border-t">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
              )}
              Generate with AI
            </Button>
          </div>
        </div>

        {/* Midig */}
        <div className="flex-1 bg-zinc-50">
          {generatedCode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="h-12 border-b bg-white px-4 flex items-center">
                <TabsList className="h-8 bg-zinc-100">
                  <TabsTrigger value="preview">PREVIEW</TabsTrigger>
                  <TabsTrigger value="code">CODE</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="flex-1">
                <CodePreview code={generatedCode} />
              </TabsContent>

              <TabsContent value="code" className="flex-1 overflow-auto bg-zinc-950 text-zinc-300 p-4 text-xs font-mono">
                <pre>{generatedCode}</pre>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full opacity-20">
              <p className="uppercase tracking-widest text-xs">Draw to build</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
