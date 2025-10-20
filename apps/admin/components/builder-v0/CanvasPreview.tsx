/**
 * CanvasPreview Component
 * 
 * Center zone: iframe with Next.js site preview.
 * Top toolbar: "Просмотр | Дизайн" mode switcher.
 * 
 * In Design Mode, overlay script highlights elements on hover.
 */

'use client'

import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'

type Mode = 'preview' | 'design'

export function CanvasPreview() {
  const [mode, setMode] = useState<Mode>('preview')

  return (
    <div className="flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => setMode('preview')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${
            mode === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <Eye className="h-4 w-4" />
          Просмотр
        </button>
        <button
          onClick={() => setMode('design')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${
            mode === 'design'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <Pencil className="h-4 w-4" />
          Дизайн
        </button>

        {mode === 'design' && (
          <span className="ml-auto text-xs text-muted-foreground">
            Наведите курсор на элемент для выбора
          </span>
        )}
      </div>

      {/* iframe Preview */}
      <div className="flex-1 relative">
        <iframe
          src="http://localhost:3001"
          className="w-full h-full border-0"
          title="Site Preview"
        />
        {mode === 'design' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* TODO: Overlay script injected into iframe */}
          </div>
        )}
      </div>
    </div>
  )
}
