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

import { useState, useCallback } from 'react'
import { MessageSquare, Send } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type SlashCommand = '/design' | '/select' | '/gen' | '/apply' | '/undo'

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

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
          response = `Запущена генерация изображения: "${genPrompt}"`
          // TODO: Trigger generation
        } else {
          response = 'Использование: /gen image <prompt>'
        }
        break

      case '/apply':
        response = 'Применение изменений...'
        // TODO: Apply changes
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
    <div className="flex flex-col border-r bg-muted/20">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold">Чат Билдера</h2>
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите команду или вопрос..."
            className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
