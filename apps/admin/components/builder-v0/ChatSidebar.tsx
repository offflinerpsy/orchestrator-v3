/**
 * ChatSidebar Component
 * 
 * Left sidebar with chat history and slash commands.
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * 
 * Slash commands:
 * - /design on|off — toggle Design Mode overlay
 * - /select <locator> — programmatically select element
 * - /gen image <prompt> — generate image via local SDXL
 * - /gen text <prompt> — generate text via LLM
 * - /apply — apply accumulated changes (diff → commit)
 * - /undo — undo last change
 */

'use client'

import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'

export function ChatSidebar() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: input }])
    
    // TODO: Process slash commands (/design, /select, /gen image, etc.)
    // TODO: Send to MCP server
    
    setInput('')
  }

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
