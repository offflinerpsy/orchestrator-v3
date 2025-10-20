/**
 * CanvasPreview Component — Modern React patterns from Context7
 * 
 * Center zone: iframe with Next.js site preview.
 * Top toolbar: "Просмотр | Дизайн" mode switcher.
 * 
 * Design Mode: injected script highlights elements on hover
 * Uses typed postMessage communication with iframe
 */

/**
 * Builder v0 — Canvas Preview Component
 * 
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * Licensed under Apache-2.0
 * 
 * Copyright 2025 Orchestrator v3
 * Portions adapted from Dyad project for iframe preview and design mode overlay.
 * 
 * Modern React patterns from Context7:
 * - Typed postMessage interfaces (ElementSelectedMessage, DesignModeToggleEvent)
 * - useCallback for event handlers
 * - Radix UI Tooltip integration
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, Pencil, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { DesignOverlay } from './DesignOverlay'

type Mode = 'preview' | 'design'

interface SelectedElement {
  locator: string
  elementType: 'text' | 'image' | 'block'
  content: string
  attributes: Record<string, string>
}

interface DesignModeToggleEvent extends CustomEvent {
  detail: { enabled: boolean }
}

interface ElementSelectedMessage {
  type: 'element-selected'
  locator: string
  elementType: 'text' | 'image' | 'block'
  content: string
  attributes: Record<string, string>
}

export function CanvasPreview() {
  const [mode, setMode] = useState<Mode>('preview')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3001')

  // Modern pattern: typed event handlers with useCallback
  const handleToggle = useCallback((event: DesignModeToggleEvent) => {
    setMode(event.detail.enabled ? 'design' : 'preview')
  }, [])

  // Handle v0 generation (Context7: event-driven architecture)
  // HMR: Last updated 2025-10-20T14:30:00Z
  const handleV0Generated = useCallback((event: CustomEvent<any>) => {
    const { chatId, demo } = event.detail
    
    console.log('[CanvasPreview] v0-generated event received:', { demo, chatId })
    
    // demo может быть строкой (URL) или объектом { url: string }
    if (typeof demo === 'string' && demo.startsWith('http')) {
      setPreviewUrl(demo)
      console.log('[CanvasPreview] ✅ Setting iframe src to demo URL:', demo)
    } else if (demo?.url) {
      setPreviewUrl(demo.url)
      console.log('[CanvasPreview] ✅ Setting iframe src to demo.url:', demo.url)
    } else if (chatId) {
      // Fallback: use preview API
      const fallbackUrl = `/preview/v0/${chatId}`
      setPreviewUrl(fallbackUrl)
      console.log('[CanvasPreview] ⚠️ Fallback to local preview:', fallbackUrl)
    } else {
      console.error('[CanvasPreview] ❌ No demo URL or chatId provided!')
    }
  }, [])

  const handleMessage = useCallback((event: MessageEvent<ElementSelectedMessage>) => {
    if (event.data.type === 'element-selected') {
      const elementData: SelectedElement = {
        locator: event.data.locator,
        elementType: event.data.elementType,
        content: event.data.content,
        attributes: event.data.attributes
      }
      setSelectedElement(elementData)
      
      // Broadcast to Inspector via typed custom event
      window.dispatchEvent(new CustomEvent('element-selected', { detail: elementData }))
    }
  }, [])

  // Listen for design mode toggle from chat
  useEffect(() => {
    window.addEventListener('design-mode-toggle' as any, handleToggle)
    return () => window.removeEventListener('design-mode-toggle' as any, handleToggle)
  }, [handleToggle])

  // Listen for messages from iframe overlay
  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Inject overlay script when Design Mode is enabled
  useEffect(() => {
    if (mode === 'design' && iframeRef.current) {
      const iframe = iframeRef.current
      
      // Wait for iframe to load
      const injectOverlay = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (!iframeDoc) return

        // Check if script already exists
        const existingScript = iframeDoc.querySelector('script[src*="design-mode-script"]')
        if (existingScript) {
          // Script loaded, send toggle message
          iframe.contentWindow?.postMessage({ type: 'design-mode-toggle', enabled: true }, '*')
          console.log('[CanvasPreview] Design mode enabled via postMessage')
          return
        }

        // Inject design-mode-script.js
        const script = iframeDoc.createElement('script')
        script.src = '/design-mode-script.js'
        script.onload = () => {
          // Send toggle after script loads
          iframe.contentWindow?.postMessage({ type: 'design-mode-toggle', enabled: true }, '*')
          console.log('[CanvasPreview] Design mode script injected and enabled')
        }
        iframeDoc.body.appendChild(script)
      }

      if (iframe.contentDocument?.readyState === 'complete') {
        injectOverlay()
      } else {
        iframe.addEventListener('load', injectOverlay)
      }
    } else if (mode === 'preview' && iframeRef.current) {
      // Disable design mode
      iframeRef.current.contentWindow?.postMessage({ type: 'design-mode-toggle', enabled: false }, '*')
      console.log('[CanvasPreview] Design mode disabled')
    }
  }, [mode])

  return (
    <TooltipProvider>
      <div className="flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b px-4 py-2 flex items-center gap-2">
          <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Режим просмотра: навигация по сайту без изменений</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Режим дизайна</p>
            <p className="text-sm">Кликните на элемент (текст/изображение) для редактирования. Изменения отображаются в правой панели.</p>
          </TooltipContent>
        </Tooltip>

        {mode === 'design' && (
          <span className="ml-auto text-xs text-muted-foreground">
            Наведите курсор на элемент для выбора
          </span>
        )}
      </div>

      {/* iframe Preview */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Site Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        
        {/* Design Mode Overlay */}
        <DesignOverlay isDesignMode={mode === 'design'} />
      </div>
      </div>
    </TooltipProvider>
  )
}

// Overlay script to inject into iframe
function getOverlayScript(): string {
  return `
(function() {
  let hoveredElement = null;
  let selectedElement = null;

  const highlight = document.createElement('div');
  highlight.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);z-index:9999;transition:all 0.1s;display:none;';
  document.body.appendChild(highlight);

  const selection = document.createElement('div');
  selection.style.cssText = 'position:fixed;pointer-events:none;border:3px solid #10b981;background:rgba(16,185,129,0.05);z-index:9998;display:none;';
  document.body.appendChild(selection);

  function updateHighlight(el, div) {
    const rect = el.getBoundingClientRect();
    div.style.top = rect.top + 'px';
    div.style.left = rect.left + 'px';
    div.style.width = rect.width + 'px';
    div.style.height = rect.height + 'px';
    div.style.display = 'block';
  }

  function isEditable(el) {
    const tag = el.tagName.toLowerCase();
    const editableTags = ['h1','h2','h3','h4','h5','h6','p','span','a','button','img','section','div'];
    return editableTags.includes(tag) && !el.hasAttribute('data-no-edit');
  }

  function getLocator(el) {
    let loc = el.getAttribute('data-locator');
    if (!loc) {
      const tag = el.tagName.toLowerCase();
      const id = el.id;
      const cls = el.className.split(' ')[0];
      loc = id ? 'id-'+id : (cls ? tag+'-'+cls : tag+'-0');
      el.setAttribute('data-locator', loc);
    }
    return loc;
  }

  function getType(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') return 'image';
    if (['h1','h2','h3','h4','h5','h6','p','span','a','button'].includes(tag)) return 'text';
    return 'block';
  }

  function getContent(el, type) {
    return type === 'image' ? (el.getAttribute('src') || '') : (el.textContent || '');
  }

  function getAttrs(el) {
    const attrs = {};
    Array.from(el.attributes).forEach(a => attrs[a.name] = a.value);
    return attrs;
  }

  document.addEventListener('mousemove', (e) => {
    const el = e.target;
    if (!isEditable(el)) {
      highlight.style.display = 'none';
      return;
    }
    if (hoveredElement !== el) {
      hoveredElement = el;
      updateHighlight(el, highlight);
    }
  });

  document.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (!isEditable(el)) return;
    
    selectedElement = el;
    updateHighlight(el, selection);
    
    window.parent.postMessage({
      type: 'element-selected',
      locator: getLocator(el),
      elementType: getType(el),
      content: getContent(el, getType(el)),
      attributes: getAttrs(el)
    }, '*');
  }, true);

  window.parent.postMessage({ type: 'design-mode-ready' }, '*');
})();
  `;
}
