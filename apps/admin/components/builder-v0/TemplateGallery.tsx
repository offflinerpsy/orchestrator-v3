/**
 * TemplateGallery Component
 * 
 * Browse and import components from:
 * - shadcn/ui (buttons, forms, dialogs, etc.)
 * - HyperUI (marketing sections, heroes, CTAs)
 * 
 * Modern patterns (Context7: template-gallery-ui)
 * - Category tabs (UI / Marketing / Real Estate)
 * - Preview cards with thumbnails
 * - One-click import with loading state
 * - Search/filter
 * 
 * Integration: Inspector → "Шаблоны" tab
 */

'use client'

import { useState } from 'react'
import { Download, ExternalLink, Search } from 'lucide-react'

interface Template {
  id: string
  name: string
  source: 'shadcn' | 'hyperui'
  category: 'ui' | 'marketing' | 'realestate'
  description: string
  preview?: string
}

const TEMPLATES: Template[] = [
  // shadcn/ui components
  { id: 'button', name: 'Button', source: 'shadcn', category: 'ui', description: 'Кнопка с вариантами стилей' },
  { id: 'dialog', name: 'Dialog', source: 'shadcn', category: 'ui', description: 'Модальное окно' },
  { id: 'dropdown-menu', name: 'Dropdown Menu', source: 'shadcn', category: 'ui', description: 'Выпадающее меню' },
  { id: 'input', name: 'Input', source: 'shadcn', category: 'ui', description: 'Поле ввода' },
  { id: 'card', name: 'Card', source: 'shadcn', category: 'ui', description: 'Карточка контента' },
  { id: 'badge', name: 'Badge', source: 'shadcn', category: 'ui', description: 'Значок/бейдж' },
  
  // HyperUI marketing
  { id: 'hero-1', name: 'Hero Section', source: 'hyperui', category: 'marketing', description: 'Главный экран с CTA' },
  { id: 'cta-1', name: 'Call to Action', source: 'hyperui', category: 'marketing', description: 'Призыв к действию' },
  { id: 'features-1', name: 'Features Grid', source: 'hyperui', category: 'marketing', description: 'Сетка преимуществ' },
]

export function TemplateGallery() {
  const [category, setCategory] = useState<'ui' | 'marketing' | 'realestate'>('ui')
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState<string | null>(null)

  const filtered = TEMPLATES.filter(t => {
    const matchesCategory = t.category === category
    const matchesSearch = search === '' || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleImport = async (template: Template) => {
    setImporting(template.id)

    try {
      const res = await fetch('/api/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: template.source,
          component: template.id,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ Импортировано:\n- Файлов: ${data.files.length}\n- Зависимостей: ${data.dependencies.length}`)
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`)
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setCategory('ui')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            category === 'ui'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          UI Компоненты
        </button>
        <button
          onClick={() => setCategory('marketing')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            category === 'marketing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Маркетинг
        </button>
        <button
          onClick={() => setCategory('realestate')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            category === 'realestate'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Недвижимость
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск шаблонов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Нет шаблонов в этой категории
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {template.description}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">
                    {template.source}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleImport(template)}
                    disabled={importing === template.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="import-template"
                  >
                    <Download className="h-3 w-3" />
                    {importing === template.id ? 'Импорт...' : 'Импортировать'}
                  </button>
                  <a
                    href={
                      template.source === 'shadcn'
                        ? `https://ui.shadcn.com/docs/components/${template.id}`
                        : `https://hyperui.dev/components/${category}/${template.id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border rounded-md hover:bg-muted"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
