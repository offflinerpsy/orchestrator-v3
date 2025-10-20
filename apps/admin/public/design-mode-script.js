/**
 * Design Mode overlay script — injected into iframe
 * Modern pattern (Context7: iframe-resizer, react-iframe-postMessage)
 * Handles:
 * - Element selection with visual overlay
 * - postMessage for image src updates
 */

(function() {
  'use strict'
  
  let isDesignMode = false
  let overlay = null
  
  // Create overlay element for highlighting
  function createOverlay() {
    const el = document.createElement('div')
    el.id = 'design-mode-overlay'
    el.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 9999;
      transition: all 0.15s ease;
      display: none;
    `
    document.body.appendChild(el)
    return el
  }
  
  // Update overlay position to match element
  function updateOverlay(element) {
    if (!overlay) return
    
    const rect = element.getBoundingClientRect()
    overlay.style.display = 'block'
    overlay.style.left = `${rect.left + window.scrollX}px`
    overlay.style.top = `${rect.top + window.scrollY}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
  }
  
  // Generate unique locator for element
  function generateLocator(element) {
    if (element.id) return `#${element.id}`
    
    const tagName = element.tagName.toLowerCase()
    const parent = element.parentElement
    
    if (!parent) return tagName
    
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName)
    const index = siblings.indexOf(element)
    
    return `${generateLocator(parent)} > ${tagName}:nth-of-type(${index + 1})`
  }
  
  // Click handler for element selection
  function handleElementClick(event) {
    if (!isDesignMode) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const element = event.target
    const locator = generateLocator(element)
    
    // Determine element type
    let elementType = 'block'
    if (element.tagName === 'IMG') elementType = 'image'
    else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A'].includes(element.tagName)) {
      elementType = 'text'
    }
    
    // Send selection to parent window (Context7: modern postMessage pattern)
    window.parent.postMessage({
      type: 'element-selected',
      locator,
      elementType,
      content: elementType === 'text' ? element.textContent : (element.src || ''),
      attributes: {
        id: element.id || '',
        class: element.className || '',
        src: element.src || '',
        alt: element.alt || '',
        href: element.href || ''
      },
      timestamp: Date.now()
    }, '*')
    
    console.log('[DesignMode] Selected:', { locator, elementType })
  }
  
  // Mouseover handler for preview highlighting
  function handleMouseOver(event) {
    if (!isDesignMode) return
    updateOverlay(event.target)
  }
  
  // Mouseout handler
  function handleMouseOut() {
    if (!isDesignMode || !overlay) return
    overlay.style.display = 'none'
  }
  
  // Listen for mode toggle from parent
  window.addEventListener('message', (event) => {
    // Handle mode toggle
    if (event.data.type === 'design-mode-toggle') {
      isDesignMode = event.data.enabled
      
      if (isDesignMode) {
        if (!overlay) overlay = createOverlay()
        document.body.style.cursor = 'crosshair'
        console.log('[DesignMode] Enabled')
      } else {
        if (overlay) overlay.style.display = 'none'
        document.body.style.cursor = ''
        console.log('[DesignMode] Disabled')
      }
    }
    
    // Handle image src update (Context7: modern iframe src update pattern)
    if (event.data.type === 'update-image-src') {
      const { locator, newSrc } = event.data
      
      try {
        // Find element by locator
        const element = document.querySelector(locator)
        
        if (element && element.tagName === 'IMG') {
          element.src = newSrc
          console.log('[DesignMode] Updated image src:', { locator, newSrc })
          
          // Confirm to parent
          window.parent.postMessage({
            type: 'image-updated',
            locator,
            success: true,
            timestamp: Date.now()
          }, '*')
        } else {
          console.error('[DesignMode] Image not found:', locator)
          window.parent.postMessage({
            type: 'image-updated',
            locator,
            success: false,
            error: 'Element not found or not an image',
            timestamp: Date.now()
          }, '*')
        }
      } catch (error) {
        console.error('[DesignMode] Error updating image:', error)
        window.parent.postMessage({
          type: 'image-updated',
          locator,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }, '*')
      }
    }
  })
  
  // Attach event listeners
  document.addEventListener('click', handleElementClick, true)
  document.addEventListener('mouseover', handleMouseOver, true)
  document.addEventListener('mouseout', handleMouseOut, true)
  
  // Notify parent that script is ready
  window.parent.postMessage({ type: 'design-mode-ready', timestamp: Date.now() }, '*')
  
  console.log('[DesignMode] Script loaded')
})()
