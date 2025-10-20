/**
 * CanvasOverlay Component
 * 
 * Injects into iframe to enable Design Mode:
 * - Highlights elements on hover
 * - Captures clicks to select elements
 * - Sends selected element info to parent window
 * 
 * Communication via window.postMessage between iframe and parent.
 */

'use client'

import { useEffect } from 'react'

interface OverlayMessage {
  type: 'element-selected' | 'element-hovered' | 'design-mode-ready'
  locator?: string
  elementType?: 'text' | 'image' | 'block'
  content?: string
  attributes?: Record<string, string>
}

export function CanvasOverlay({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    let hoveredElement: HTMLElement | null = null
    let selectedElement: HTMLElement | null = null

    // Create overlay highlight div
    const highlight = document.createElement('div')
    highlight.style.position = 'fixed'
    highlight.style.pointerEvents = 'none'
    highlight.style.border = '2px solid #3b82f6'
    highlight.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
    highlight.style.zIndex = '9999'
    highlight.style.transition = 'all 0.1s ease'
    highlight.style.display = 'none'
    document.body.appendChild(highlight)

    // Create selected element outline
    const selection = document.createElement('div')
    selection.style.position = 'fixed'
    selection.style.pointerEvents = 'none'
    selection.style.border = '3px solid #10b981'
    selection.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
    selection.style.zIndex = '9998'
    selection.style.display = 'none'
    document.body.appendChild(selection)

    // Helper: update highlight position
    const updateHighlight = (element: HTMLElement, highlightDiv: HTMLDivElement) => {
      const rect = element.getBoundingClientRect()
      highlightDiv.style.top = `${rect.top}px`
      highlightDiv.style.left = `${rect.left}px`
      highlightDiv.style.width = `${rect.width}px`
      highlightDiv.style.height = `${rect.height}px`
      highlightDiv.style.display = 'block'
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Skip if not editable
      if (!isEditableElement(target)) {
        highlight.style.display = 'none'
        hoveredElement = null
        return
      }

      if (hoveredElement !== target) {
        hoveredElement = target
        updateHighlight(target, highlight)

        // Send hover event to parent
        window.parent.postMessage({
          type: 'element-hovered',
          locator: getOrCreateLocator(target),
          elementType: getElementType(target)
        } as OverlayMessage, '*')
      }
    }

    // Click handler
    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      if (!isEditableElement(target)) return

      selectedElement = target
      updateHighlight(target, selection)

      // Send selection to parent
      const locator = getOrCreateLocator(target)
      const elementType = getElementType(target)
      const content = getElementContent(target, elementType)
      const attributes = getElementAttributes(target)

      window.parent.postMessage({
        type: 'element-selected',
        locator,
        elementType,
        content,
        attributes
      } as OverlayMessage, '*')
    }

    // Attach listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick, true)

    // Notify parent that overlay is ready
    window.parent.postMessage({
      type: 'design-mode-ready'
    } as OverlayMessage, '*')

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick, true)
      highlight.remove()
      selection.remove()
    }
  }, [enabled])

  return null // This component doesn't render anything
}

// Helper functions

function isEditableElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase()
  const editableTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'img', 'section', 'div']
  
  return editableTags.includes(tag) && 
         !element.hasAttribute('data-no-edit') &&
         !element.closest('[data-no-edit]')
}

function getOrCreateLocator(element: HTMLElement): string {
  let locator = element.getAttribute('data-locator')
  
  if (!locator) {
    const tag = element.tagName.toLowerCase()
    const id = element.id
    const className = element.className.split(' ')[0]
    
    if (id) {
      locator = `id-${id}`
    } else if (className) {
      locator = `${tag}-${className}`
    } else {
      const parent = element.parentElement
      const siblings = parent ? Array.from(parent.children).filter(el => el.tagName === element.tagName) : []
      const index = siblings.indexOf(element)
      locator = `${tag}-${index}`
    }
    
    element.setAttribute('data-locator', locator)
  }
  
  return locator
}

function getElementType(element: HTMLElement): 'text' | 'image' | 'block' {
  const tag = element.tagName.toLowerCase()
  
  if (tag === 'img') return 'image'
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button'].includes(tag)) return 'text'
  return 'block'
}

function getElementContent(element: HTMLElement, type: 'text' | 'image' | 'block'): string {
  if (type === 'image') {
    return element.getAttribute('src') || ''
  }
  return element.textContent || ''
}

function getElementAttributes(element: HTMLElement): Record<string, string> {
  const attrs: Record<string, string> = {}
  Array.from(element.attributes).forEach(attr => {
    attrs[attr.name] = attr.value
  })
  return attrs
}
