"use client"

import { Tldraw, type Editor } from "tldraw"
import "tldraw/tldraw.css"

interface DrawProps {
  setEditor: (editor: Editor) => void
}

export default function Draw({ setEditor }: DrawProps) {
  return (
    <div className="w-full h-full">
      <Tldraw
        persistenceKey="saasify-app"
        onMount={(editor) => {
          setEditor(editor)
          // ❌ HA DIRIN isDarkMode
        }}
      />
    </div>
  )
}
