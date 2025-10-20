/**
 * Inspector Component
 * 
 * Right sidebar: tabs for content/style/actions.
 * Shows details of selected element and allows:
 * - Text editing (with "Применить" button)
 * - Image replacement ("Сгенерировать (локально)" via SDXL)
 * - Style presets (Tailwind classes)
 */

'use client'

import { useState } from 'react'
import { FileText, Palette, Zap } from 'lucide-react'

type Tab = 'content' | 'style' | 'actions'

export function Inspector() {
  const [tab, setTab] = useState<Tab>('content')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  return (
    <div className="flex flex-col border-l bg-muted/20">
      {/* Tabs */}
      <div className="border-b flex">
        <button
          onClick={() => setTab('content')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'content'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Содержимое
        </button>
        <button
          onClick={() => setTab('style')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'style'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          Стиль
        </button>
        <button
          onClick={() => setTab('actions')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'actions'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />
          Действия
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedElement ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            <p>Ничего не выбрано</p>
            <p className="text-xs mt-2">
              Включите режим «Дизайн» и<br />
              кликните на элемент
            </p>
          </div>
        ) : (
          <>
            {tab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Текст элемента</label>
                  <textarea
                    className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-sm resize-none"
                    rows={4}
                    placeholder="Введите новый текст..."
                  />
                </div>
                <button className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                  Применить изменения
                </button>
              </div>
            )}

            {tab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tailwind классы</label>
                  <div className="mt-2 space-y-2">
                    <button className="w-full px-3 py-2 rounded-md border text-left text-sm hover:bg-muted">
                      rounded-xl
                    </button>
                    <button className="w-full px-3 py-2 rounded-md border text-left text-sm hover:bg-muted">
                      shadow-lg
                    </button>
                    <button className="w-full px-3 py-2 rounded-md border text-left text-sm hover:bg-muted">
                      aspect-video
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'actions' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Генерация изображения</label>
                  <input
                    type="text"
                    placeholder="Введите промпт..."
                    className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-sm"
                  />
                  <button className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                    Сгенерировать (локально, SDXL)
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Будет использована модель SDXL через ComfyUI
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
