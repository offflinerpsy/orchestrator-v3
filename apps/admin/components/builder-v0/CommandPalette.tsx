/**
 * CommandPalette Component
 * 
 * Global command palette overlay (⌘K / Ctrl+K)
 * 
 * Modern patterns (Context7: cmdk-command-palette-react, command-k-shortcut)
 * - cmdk library (pacocoursey/cmdk)
 * - Grouped commands (Navigation / Design / Generation / Templates)
 * - Keyboard shortcuts display
 * - Search with fuzzy matching
 * - Dynamic command execution
 * 
 * Integration: Global overlay in builder-v0/layout.tsx
 * 
 * Commands:
 * - Navigation: Go to Builder / Go to Status / Go to Settings
 * - Design: Toggle Design Mode / Select Element
 * - Generation: Generate Image / Queue Jobs
 * - Templates: Import shadcn Component / Import HyperUI Component
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { 
  Search, 
  Layout, 
  Settings, 
  Activity, 
  Wand2, 
  Download, 
  Eye, 
  MousePointerClick,
  Image as ImageIcon,
  Clock
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  // Close on Escape (Context7 pattern)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCommand = useCallback((command: string) => {
    console.log('[CommandPalette] Execute:', command)
    onClose()

    switch (command) {
      // Navigation
      case 'go-builder':
        window.location.href = '/builder-v0'
        break
      case 'go-status':
        window.location.href = '/status'
        break
      case 'go-settings':
        window.location.href = '/settings'
        break

      // Design
      case 'design-toggle':
        window.dispatchEvent(new CustomEvent('design-mode-toggle', { detail: { enabled: true } }))
        break
      case 'design-select':
        alert('Кликните на элемент в режиме "Дизайн"')
        break

      // Generation
      case 'gen-image':
        const prompt = window.prompt('Введите промпт для генерации:')
        if (prompt) {
          window.dispatchEvent(new CustomEvent('chat-command', { 
            detail: { command: `/gen image ${prompt}` } 
          }))
        }
        break
      case 'gen-queue':
        window.dispatchEvent(new CustomEvent('show-job-queue'))
        break

      // Templates
      case 'import-shadcn':
        const shadcnComponent = window.prompt('Введите название shadcn компонента (например, button):')
        if (shadcnComponent) {
          window.dispatchEvent(new CustomEvent('chat-command', { 
            detail: { command: `/import shadcn ${shadcnComponent}` } 
          }))
        }
        break
      case 'import-hyperui':
        alert('HyperUI импорт: скопируйте код вручную с hyperui.dev')
        break
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette (Context7: cmdk patterns) */}
      <Command 
        className="relative w-full max-w-2xl bg-background border rounded-lg shadow-2xl overflow-hidden"
        value={search}
        onValueChange={setSearch}
        data-testid="cmdk-root"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Command.Input
            placeholder="Введите команду или поиск..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
        </div>

        {/* Command List */}
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            Нет результатов
          </Command.Empty>

          {/* Navigation Commands */}
          <Command.Group heading="Навигация" className="mb-2">
            <Command.Item
              onSelect={() => handleCommand('go-builder')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Layout className="h-4 w-4" />
              <span className="flex-1">Перейти в Builder</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleCommand('go-status')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Activity className="h-4 w-4" />
              <span className="flex-1">Статус системы</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleCommand('go-settings')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1">Настройки</span>
            </Command.Item>
          </Command.Group>

          {/* Design Commands */}
          <Command.Group heading="Дизайн" className="mb-2">
            <Command.Item
              onSelect={() => handleCommand('design-toggle')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Eye className="h-4 w-4" />
              <span className="flex-1">Включить режим "Дизайн"</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">/design on</kbd>
            </Command.Item>
            <Command.Item
              onSelect={() => handleCommand('design-select')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <MousePointerClick className="h-4 w-4" />
              <span className="flex-1">Выбрать элемент</span>
            </Command.Item>
          </Command.Group>

          {/* Generation Commands */}
          <Command.Group heading="Генерация" className="mb-2">
            <Command.Item
              onSelect={() => handleCommand('gen-image')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="flex-1">Сгенерировать изображение (SDXL)</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">/gen image</kbd>
            </Command.Item>
            <Command.Item
              onSelect={() => handleCommand('gen-queue')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Clock className="h-4 w-4" />
              <span className="flex-1">Открыть очередь задач</span>
            </Command.Item>
          </Command.Group>

          {/* Template Commands */}
          <Command.Group heading="Шаблоны" className="mb-2">
            <Command.Item
              onSelect={() => handleCommand('import-shadcn')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Download className="h-4 w-4" />
              <span className="flex-1">Импортировать shadcn/ui компонент</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">/import shadcn</kbd>
            </Command.Item>
            <Command.Item
              onSelect={() => handleCommand('import-hyperui')}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted data-[selected]:bg-muted"
            >
              <Wand2 className="h-4 w-4" />
              <span className="flex-1">Импортировать HyperUI компонент</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">/import hyperui</kbd>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
