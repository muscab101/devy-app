"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Monitor, Tablet, Smartphone, Code2, Eye, Copy, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface CodePreviewProps {
  code: string
}

type ViewportSize = "mobile" | "tablet" | "desktop"

export default function CodePreview({ code }: CodePreviewProps) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [refreshKey, setRefreshKey] = useState(0)

  const viewportWidths = {
    mobile: "375px",
    tablet: "768px",
    desktop: "100%",
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "component.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Code downloaded!")
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    toast.success("Preview refreshed!")
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Top Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "code")} className="w-auto">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="w-3 h-3 mr-1.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs">
              <Code2 className="w-3 h-3 mr-1.5" />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {viewMode === "preview" && (
            <>
              <Button
                variant={viewport === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewport("mobile")}
                className="h-8"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewport === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewport("tablet")}
                className="h-8"
              >
                <Tablet className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewport === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewport("desktop")}
                className="h-8"
              >
                <Monitor className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 bg-transparent">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 bg-transparent">
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 bg-transparent">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "preview" ? (
          <div
            className="h-full w-full flex items-start justify-center overflow-auto p-6"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(229 231 235 / 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(229 231 235 / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          >
            {/* Browser-like Preview Container */}
            <div
              className="bg-background rounded-lg shadow-2xl border overflow-hidden transition-all duration-300"
              style={{
                width: viewportWidths[viewport],
                maxWidth: "100%",
              }}
            >
              {/* Browser URL Bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 px-3 py-1 text-xs bg-background rounded border text-muted-foreground">
                  localhost:3000/preview
                </div>
              </div>

              <div className="bg-white dark:bg-background">
                <iframe
                  key={refreshKey}
                  srcDoc={code}
                  title="Preview"
                  className="w-full border-0"
                  style={{ minHeight: "500px", height: "calc(100vh - 200px)" }}
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto bg-zinc-950">
            <pre className="p-6 text-sm text-zinc-100 font-mono">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
