/**
 * Builder v0 — Inspector Panel Component
 * 
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * Licensed under Apache-2.0
 * 
 * Copyright 2025 Orchestrator v3
 * Portions adapted from Dyad project for element inspection and editing workflow.
 * 
 * Modern React patterns from Context7:
 * - useCallback for stable function references
 * - Typed CustomEvent interfaces
 * - Error boundaries with response.ok checks
 * 
 * Right sidebar: tabs for content/style/actions.
 * Shows details of selected element and allows:
 * - Text editing (with "Применить" button)
 * - Image replacement ("Сгенерировать (локально)" via SDXL)
 * - Style presets (Tailwind classes)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, Pencil, Settings, Wand2, Info, FileText, Palette, Zap, Download } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TemplateGallery } from './TemplateGallery'

/**
 * Inspector Component — Modern React 19 patterns
 * Uses useCallback for performance, typed custom events
 * Based on Context7 best practices for client components
 */

type Tab = 'content' | 'style' | 'actions' | 'templates'

interface SelectedElement {
  locator: string
  elementType: 'text' | 'image' | 'block'
  content: string
  attributes: Record<string, string>
}

export function Inspector() {
  const [tab, setTab] = useState<Tab>('content')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generatedJobs, setGeneratedJobs] = useState<Array<{ jobId: string; prompt: string; status: string; imageUrl?: string }>>([])
  const [galleryPage, setGalleryPage] = useState(0)
  const IMAGES_PER_PAGE = 10

  // Listen for element selection from CanvasPreview
  useEffect(() => {
    const handleSelection = (event: CustomEvent) => {
      const element = event.detail as SelectedElement
      setSelectedElement(element)
      setEditedContent(element.content)
    }

    window.addEventListener('element-selected' as any, handleSelection)
    return () => window.removeEventListener('element-selected' as any, handleSelection)
  }, [])

  // Listen for image generation events from ChatSidebar
  useEffect(() => {
    const handleGeneration = (event: CustomEvent) => {
      const { jobId, prompt } = event.detail
      setGeneratedJobs(prev => [...prev, { jobId, prompt, status: 'queued' }])
      
      // Poll job status
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/jobs')
          const data = await res.json()
          const job = data.jobs?.find((j: any) => j.id === jobId)
          
          if (job && job.status === 'done' && job.result?.url) {
            setGeneratedJobs(prev => prev.map(j => 
              j.jobId === jobId ? { ...j, status: 'done', imageUrl: job.result.url } : j
            ))
            clearInterval(pollInterval)
          } else if (job && job.status === 'failed') {
            setGeneratedJobs(prev => prev.map(j => 
              j.jobId === jobId ? { ...j, status: 'failed' } : j
            ))
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error('[Inspector] Job poll error:', err)
        }
      }, 2000)
      
      // Cleanup after 60 seconds
      setTimeout(() => clearInterval(pollInterval), 60000)
    }

    window.addEventListener('image-generation-started' as any, handleGeneration)
    return () => window.removeEventListener('image-generation-started' as any, handleGeneration)
  }, [])

  // Update edited content when selection changes
  useEffect(() => {
    if (selectedElement) {
      setEditedContent(selectedElement.content)
    }
  }, [selectedElement])

  // Modern pattern: useCallback for stable function reference
  const handleApplyChanges = useCallback(async () => {
    if (!selectedElement) return

    try {
      const response = await fetch('/api/builder-v0/apply-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locator: selectedElement.locator,
          changes: {
            content: editedContent !== selectedElement.content ? editedContent : undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        console.log('[Inspector] Changes applied:', result)
        alert('✅ Изменения применены (stub)')
      } else {
        console.error('[Inspector] Apply failed:', result.error)
        alert(`❌ Ошибка: ${result.error}`)
      }
    } catch (error) {
      console.error('[Inspector] Apply error:', error)
      alert('❌ Не удалось применить изменения')
    }
  }, [selectedElement, editedContent])

  const handleGenerateImage = useCallback(async () => {
    if (!selectedElement || !generatePrompt.trim()) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/builder-v0/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          locator: selectedElement.locator,
          width: 1024,
          height: 1024
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('[Inspector] Image generated:', data.imagePath)
        
        // Modern postMessage pattern (Context7: react-iframe-postMessage)
        const iframe = document.querySelector('iframe[src^="http://localhost:3000"]') as HTMLIFrameElement | null
        if (iframe?.contentWindow && data.imagePath) {
          iframe.contentWindow.postMessage({
            type: 'update-image-src',
            locator: selectedElement.locator,
            newSrc: data.imagePath,
            timestamp: Date.now()
          }, 'http://localhost:3000')
          
          alert(`✅ Изображение сгенерировано и заменено: ${data.imagePath}`)
        } else {
          alert(`✅ Изображение сгенерировано: ${data.imagePath}`)
        }
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (error: any) {
      console.error('[Inspector] Generation error:', error)
      alert(`❌ Ошибка генерации: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedElement, generatePrompt])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full border-l bg-muted/20">
      {/* Tabs - ARIA-compliant tablist pattern */}
      <div className="border-b flex" role="tablist" aria-label="Inspector sections">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              role="tab"
              aria-selected={tab === 'content'}
              aria-controls="inspector-panel"
              data-testid="content-tab"
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Редактировать текст или атрибуты элемента</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              role="tab"
              aria-selected={tab === 'style'}
              aria-controls="inspector-panel"
              data-testid="style-tab"
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
          </TooltipTrigger>
          <TooltipContent>
            <p>CSS классы и inline стили (скоро)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              role="tab"
              aria-selected={tab === 'actions'}
              aria-controls="inspector-panel"
              data-testid="actions-tab"
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
          </TooltipTrigger>
          <TooltipContent>
            <p>AI генерация изображений через ComfyUI</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              role="tab"
              aria-selected={tab === 'templates'}
              aria-controls="inspector-panel"
              data-testid="templates-tab"
              onClick={() => setTab('templates')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                tab === 'templates'
                  ? 'border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Download className="h-4 w-4" />
              Шаблоны
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Импорт компонентов из shadcn/ui и HyperUI</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Content - ARIA tabpanel */}
      <div 
        role="tabpanel" 
        id="inspector-panel"
        aria-labelledby={`${tab}-tab`}
        data-testid="inspector-panel"
        className="flex-1 overflow-y-auto p-4"
      >
        {/* Actions tab: always show gallery, regardless of selection */}
        {tab === 'actions' && (
          <div className="space-y-4 mb-6">
            {/* Generated Images Gallery */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Сгенерированные изображения</label>
                <span className="text-xs text-muted-foreground">
                  {generatedJobs.length} шт.
                </span>
              </div>
              <div
                data-testid="gallery-grid"
                className={
                  generatedJobs.length > 0
                    ? 'mt-2 space-y-2 max-h-64 overflow-y-auto'
                    : 'mt-2 text-sm text-muted-foreground text-center py-4 border rounded-md'
                }
              >
                {generatedJobs.length > 0 ? (
                  generatedJobs
                    .slice(galleryPage * IMAGES_PER_PAGE, (galleryPage + 1) * IMAGES_PER_PAGE)
                    .map(job => (
                      <div key={job.jobId} className="p-2 border rounded-md bg-background">
                        <div className="text-xs text-muted-foreground mb-1">
                          {job.prompt.slice(0, 40)}...
                        </div>
                        {job.status === 'done' && job.imageUrl && (
                          <div className="relative group">
                            <img
                              src={job.imageUrl}
                              alt={job.prompt}
                              className="w-full rounded-md cursor-pointer hover:opacity-80"
                              onClick={() => {
                                navigator.clipboard.writeText(job.imageUrl!)
                                alert(`✅ URL скопирован: ${job.imageUrl}`)
                              }}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                              Клик = копировать URL
                            </div>
                          </div>
                        )}
                        {job.status === 'queued' && (
                          <div className="text-xs text-yellow-500">⏳ В очереди...</div>
                        )}
                        {job.status === 'failed' && (
                          <div className="text-xs text-red-500">❌ Ошибка генерации</div>
                        )}
                      </div>
                    ))
                ) : (
                  <span>Пока нет сгенерированных изображений</span>
                )}
              </div>

              {generatedJobs.length > IMAGES_PER_PAGE && (
                <div className="flex items-center justify-between mt-2 text-xs">
                  <button
                    onClick={() => setGalleryPage(p => Math.max(0, p - 1))}
                    disabled={galleryPage === 0}
                    className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    ← Назад
                  </button>
                  <span className="text-muted-foreground">
                    Стр. {galleryPage + 1} из {Math.ceil(generatedJobs.length / IMAGES_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setGalleryPage(p => Math.min(Math.ceil(generatedJobs.length / IMAGES_PER_PAGE) - 1, p + 1))}
                    disabled={galleryPage >= Math.ceil(generatedJobs.length / IMAGES_PER_PAGE) - 1}
                    className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Вперёд →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
            {/* Element Info */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50 text-xs">
              <div className="font-mono text-muted-foreground">
                {selectedElement.locator}
              </div>
              <div className="mt-1 text-muted-foreground">
                Тип: {selectedElement.elementType === 'text' ? 'Текст' : selectedElement.elementType === 'image' ? 'Изображение' : 'Блок'}
              </div>
            </div>

            {tab === 'content' && (
              <div className="space-y-4">
                {selectedElement.elementType === 'text' && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Текст элемента</label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-sm resize-none"
                        rows={4}
                        placeholder="Введите новый текст..."
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={handleApplyChanges}
                        className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                      >
                        Применить изменения
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-2 rounded-md border bg-background hover:bg-accent">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Что произойдёт:</p>
                          <p className="text-sm">Изменения записываются в исходный файл через AST парсинг. Создаётся git diff для отката.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}

                {selectedElement.elementType === 'image' && (
                  <div>
                    <label className="text-sm font-medium">Текущее изображение</label>
                    <div className="mt-2 text-xs text-muted-foreground font-mono break-all">
                      {selectedElement.content}
                    </div>
                  </div>
                )}
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

            {tab === 'actions' && selectedElement.elementType === 'image' && (
              <div className="space-y-4">
                {/* Generation form only (Gallery moved outside selectedElement check) */}
                {selectedElement.elementType === 'image' && (
                  <>
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        Генерация изображения
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              <strong>Что произойдёт:</strong> Запускается локальная модель SDXL через ComfyUI. 
                              Генерация занимает ~30 секунд. Файл сохраняется в F:\Drop\out и подменяет src выбранного изображения.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        placeholder="Введите промпт..."
                        className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-sm"
                        disabled={isGenerating}
                      />
                      <button 
                        onClick={handleGenerateImage}
                        disabled={isGenerating || !generatePrompt.trim()}
                        className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isGenerating ? 'Генерация...' : 'Сгенерировать (локально, SDXL)'}
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {isGenerating ? 'Подождите, это может занять ~30 секунд' : 'Будет использована модель SDXL через ComfyUI'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* P4: Templates Tab */}
            {tab === 'templates' && (
              <div className="h-full -m-4">
                <TemplateGallery />
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}