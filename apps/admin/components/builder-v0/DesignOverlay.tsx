'use client'

/**
 * DesignOverlay — transparent overlay for canvas iframe
 * Listens to postMessage from design-mode-script.js
 * Shows selected element info (locator, type, attributes)
 * 
 * Modern patterns:
 * - useEffect for message listener lifecycle
 * - useState for selected element state
 * - Tailwind for styling
 */

import { useEffect, useState } from 'react'
import { Info, Mouse, Image, Type, Box } from 'lucide-react'

interface SelectedElement {
  locator: string
  elementType: 'text' | 'image' | 'block'
  content: string
  attributes: {
    id?: string
    class?: string
    src?: string
    alt?: string
    href?: string
  }
  timestamp: number
}

interface DesignOverlayProps {
  isDesignMode: boolean
}

export function DesignOverlay({ isDesignMode }: DesignOverlayProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [isScriptReady, setIsScriptReady] = useState(false)

  useEffect(() => {
    // Message listener for iframe postMessage events
    const handleMessage = (event: MessageEvent) => {
      const { type, ...data } = event.data

      switch (type) {
        case 'design-mode-ready':
          setIsScriptReady(true)
          console.log('[DesignOverlay] Script ready in iframe')
          break

        case 'element-selected':
          setSelectedElement({
            locator: data.locator,
            elementType: data.elementType,
            content: data.content,
            attributes: data.attributes,
            timestamp: data.timestamp,
          })
          console.log('[DesignOverlay] Element selected:', data.locator)
          break

        case 'image-updated':
          if (data.success) {
            console.log('[DesignOverlay] Image updated:', data.locator)
          } else {
            console.error('[DesignOverlay] Image update failed:', data.error)
          }
          break

        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Don't render if design mode is off
  if (!isDesignMode) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top-left status badge */}
      <div className="absolute top-2 left-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md shadow-lg">
          <Mouse className="h-3 w-3" />
          <span>Design Mode</span>
          {!isScriptReady && (
            <span className="ml-1 opacity-75">(loading...)</span>
          )}
        </div>
      </div>

      {/* Selected element info panel */}
      {selectedElement && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md pointer-events-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              {selectedElement.elementType === 'image' && (
                <Image className="h-4 w-4 text-blue-500" />
              )}
              {selectedElement.elementType === 'text' && (
                <Type className="h-4 w-4 text-green-500" />
              )}
              {selectedElement.elementType === 'block' && (
                <Box className="h-4 w-4 text-purple-500" />
              )}
              <span className="text-sm font-semibold text-gray-700">
                Selected: {selectedElement.elementType}
              </span>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2 text-xs">
              {/* Locator */}
              <div>
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <Info className="h-3 w-3" />
                  <span className="font-medium">CSS Selector:</span>
                </div>
                <code className="block bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono break-all">
                  {selectedElement.locator}
                </code>
              </div>

              {/* Attributes */}
              {Object.entries(selectedElement.attributes).map(
                ([key, value]) =>
                  value && (
                    <div key={key}>
                      <span className="text-gray-500 font-medium">{key}:</span>{' '}
                      <span className="text-gray-800">
                        {value.length > 60
                          ? `${value.substring(0, 60)}...`
                          : value}
                      </span>
                    </div>
                  )
              )}

              {/* Content preview (for text elements) */}
              {selectedElement.elementType === 'text' &&
                selectedElement.content && (
                  <div>
                    <span className="text-gray-500 font-medium">Content:</span>{' '}
                    <span className="text-gray-800">
                      {selectedElement.content.length > 80
                        ? `${selectedElement.content.substring(0, 80)}...`
                        : selectedElement.content}
                    </span>
                  </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Use <code className="px-1 py-0.5 bg-gray-200 rounded">/select</code>{' '}
              or <code className="px-1 py-0.5 bg-gray-200 rounded">/apply</code>{' '}
              commands in chat
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
