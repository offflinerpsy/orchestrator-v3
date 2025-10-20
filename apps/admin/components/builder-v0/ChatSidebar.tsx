/**
 * Builder v0 — Chat Sidebar Component
 * 
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * Licensed under Apache-2.0
 * 
 * Copyright 2025 Orchestrator v3
 * Portions adapted from Dyad project for slash command interaction workflow.
 * 
 * Modern React patterns from Context7:
 * - Typed SlashCommand union type
 * - useCallback with proper dependencies
 * - Memoized command processors
 * 
 * Left sidebar with chat history and slash commands:
 * - /design on|off — toggle Design Mode overlay
 * - /select <locator> — programmatically select element
 * - /gen image <prompt> — generate image via local SDXL
 * - /apply — apply accumulated changes (diff → commit)
 * - /undo — undo last change
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MessageSquare, Send, Menu, Clock, Download } from 'lucide-react'
import { useBuilderHotkeys } from '@/lib/hotkeys'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type SlashCommand = '/design' | '/select' | '/gen' | '/apply' | '/undo'

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Context7: react-hotkeys-hook integration
  useBuilderHotkeys({
    onFocusChat: useCallback(() => {
      inputRef.current?.focus()
    }, []),
    onSubmitMessage: useCallback(() => {
      if (input.trim()) {
        handleSubmit(new Event('submit') as any)
      }
    }, [input]),
    onToggleLogs: useCallback(() => {
      console.log('[ChatSidebar] Toggle logs (P3 feature)')
    }, []),
    onEscape: useCallback(() => {
      inputRef.current?.blur()
    }, []),
  })

  // Modern pattern: memoized slash command processor
  const processSlashCommand = useCallback((command: string): string => {
    const parts = command.split(' ')
    const cmd = parts[0] as SlashCommand
    const args = parts.slice(1).join(' ')

    let response = ''

    switch (cmd) {
      case '/design':
        if (args === 'on') {
          response = 'Design Mode включен. Кликните на элемент в превью для редактирования.'
          window.dispatchEvent(new CustomEvent('design-mode-toggle', { detail: { enabled: true } }))
        } else if (args === 'off') {
          response = 'Design Mode выключен.'
          window.dispatchEvent(new CustomEvent('design-mode-toggle', { detail: { enabled: false } }))
        } else {
          response = 'Использование: /design on|off'
        }
        break

      case '/select':
        if (args) {
          response = `Выбран элемент: ${args}`
          window.dispatchEvent(new CustomEvent('select-element', { detail: { locator: args } }))
        } else {
          response = 'Использование: /select <locator>'
        }
        break

      case '/gen':
        const genParts = args.split(' ')
        const genType = genParts[0]
        const genPrompt = genParts.slice(1).join(' ')

        if (genType === 'image' && genPrompt) {
          // Trigger generation via Worker API
          fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              backend: 'sdxl', // or 'flux' if ALLOW_GENERATION=true
              prompt: genPrompt,
              params: { width: 1024, height: 1024 },
              runNow: true
            })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                window.dispatchEvent(new CustomEvent('image-generation-started', { 
                  detail: { jobId: data.jobId, prompt: genPrompt } 
                }))
                console.log('[ChatSidebar] Generation job created:', data.jobId)
              } else {
                console.error('[ChatSidebar] Generation failed:', data.error)
              }
            })
            .catch(err => console.error('[ChatSidebar] /gen error:', err))
          
          response = `🎨 Запущена генерация: "${genPrompt.slice(0, 50)}..."\nПроверьте панель Inspector для результата.`
        } else {
          response = 'Использование: /gen image <prompt>'
        }
        break

      case '/apply':
        // Parse: /apply <locator> innerHTML="<p>New content</p>" className="text-lg" style.color="red"
        const applyMatch = args.match(/^(\S+)\s+(.+)$/)
        if (applyMatch) {
          const locator = applyMatch[1]
          const changesStr = applyMatch[2]
          const changes: any = {}
          
          // Parse changes (innerHTML, className, style.*)
          const inHTMLMatch = changesStr.match(/innerHTML="([^"]+)"/)
          if (inHTMLMatch) changes.innerHTML = inHTMLMatch[1]
          
          const classMatch = changesStr.match(/className="([^"]+)"/)
          if (classMatch) changes.className = classMatch[1]
          
          const styleMatches = changesStr.matchAll(/style\.(\w+)="([^"]+)"/g)
          const styleObj: any = {}
          for (const match of styleMatches) {
            styleObj[match[1]] = match[2]
          }
          if (Object.keys(styleObj).length > 0) changes.style = styleObj
          
          // Send to iframe via postMessage
          const iframe = document.querySelector('iframe') as HTMLIFrameElement
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'apply-changes',
              locator,
              changes
            }, '*')
            response = `Применяю изменения к ${locator}...`
          } else {
            response = 'Ошибка: iframe недоступен'
          }
        } else {
          response = 'Использование: /apply <locator> innerHTML="..." className="..." style.color="..."'
        }
        break

      case '/undo':
        response = 'Отмена последнего изменения...'
        // TODO: Undo last change
        break

      default:
        response = `Неизвестная команда: ${cmd}`
    }

    return response
  }, [])

  // Modern pattern: useCallback for form handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')

    // Process slash commands
    if (userMessage.startsWith('/')) {
      const response = processSlashCommand(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      return
    }

    // Text prompt → v0 API (Context7: Vercel AI SDK patterns)
    setMessages(prev => [...prev, { role: 'assistant', content: '🔄 Генерирую UI через v0...' }])

    try {
      const response = await fetch('/api/v0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'v0 generation failed')
      }

      // Emit event для CanvasPreview
      window.dispatchEvent(new CustomEvent('v0-generated', { 
        detail: { 
          files: data.files, 
          chatId: data.chatId,
          demo: data.demo 
        } 
      }))

      setMessages(prev => [
        ...prev.slice(0, -1), // Remove "Генерирую..."
        { 
          role: 'assistant', 
          content: `✅ UI сгенерирован! Файлов: ${data.files?.length || 0}. Смотрите в превью справа.` 
        }
      ])
    } catch (error: any) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `❌ Ошибка: ${error.message}` }
      ])
    }
  }, [input, processSlashCommand])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">Чат Билдера</h2>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 hover:bg-muted rounded-md">
                    <Menu className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('Очередь задач (P3)')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Очередь задач
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('История (P3)')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    История диалогов
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Экспорт (P3)')}>
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт диалога
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Используйте слэш-команды для управления
          </p>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Доступные команды:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li><code className="text-xs bg-muted px-1 rounded">/design on</code> — режим дизайна</li>
              <li><code className="text-xs bg-muted px-1 rounded">/select h1</code> — выбрать элемент</li>
              <li><code className="text-xs bg-muted px-1 rounded">/gen image закат</code> — сгенерировать картинку</li>
              <li><code className="text-xs bg-muted px-1 rounded">/apply</code> — применить изменения</li>
            </ul>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground ml-8'
                : 'bg-muted mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите команду или вопрос... (Ctrl+K для фокуса)"
            className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Отправить (Ctrl+Enter)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </form>
      </div>
    </TooltipProvider>
  )
}
