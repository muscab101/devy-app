"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Clock, Code2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface HistoryItem {
  id: string
  prompt: string
  generated_code: string
  created_at: string
}

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onLoadHistory: (code: string, prompt: string) => void
}

export default function HistorySidebar({ isOpen, onClose, onLoadHistory }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("projects")
      .select("id, prompt, generated_code, created_at")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setHistory(data)
    }
    setIsLoading(false)
  }

  const filteredHistory = history.filter((item) => item.prompt.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed lg:sticky top-0 left-0 h-screen w-80 bg-background border-r z-50 flex flex-col shadow-xl lg:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="font-semibold">History</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <Code2 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{searchQuery ? "No results found" : "No history yet"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onLoadHistory(item.generated_code, item.prompt)}
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 mb-2">{item.prompt}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
