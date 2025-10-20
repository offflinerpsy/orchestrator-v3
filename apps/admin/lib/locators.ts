/**
 * DOM Locator System
 * 
 * Generates unique data-locator attributes for editable elements.
 * Used by Design Mode to identify and modify specific DOM nodes.
 * 
 * Format: data-locator="section-hero-title" | "section-about-image"
 */

export interface LocatorInfo {
  locator: string
  element: HTMLElement
  type: 'text' | 'image' | 'block'
  content: string
  attributes: Record<string, string>
}

/**
 * Generate locator string from element
 */
export function generateLocator(element: HTMLElement): string {
  // Check if element already has data-locator
  const existing = element.getAttribute('data-locator')
  if (existing) return existing

  // Generate from semantic structure
  const tag = element.tagName.toLowerCase()
  const id = element.id
  const className = element.className.split(' ')[0]
  
  // Try to create meaningful locator
  if (id) return `id-${id}`
  if (className) return `${tag}-${className}`
  
  // Fallback: tag + parent structure
  const parent = element.parentElement
  const siblings = parent ? Array.from(parent.children).filter(el => el.tagName === element.tagName) : []
  const index = siblings.indexOf(element)
  
  return `${tag}-${index}`
}

/**
 * Extract info from element
 */
export function getLocatorInfo(element: HTMLElement): LocatorInfo {
  const locator = generateLocator(element)
  const tag = element.tagName.toLowerCase()
  
  let type: 'text' | 'image' | 'block' = 'block'
  let content = ''
  
  if (tag === 'img') {
    type = 'image'
    content = element.getAttribute('src') || ''
  } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button'].includes(tag)) {
    type = 'text'
    content = element.textContent || ''
  }
  
  const attributes: Record<string, string> = {}
  Array.from(element.attributes).forEach(attr => {
    attributes[attr.name] = attr.value
  })
  
  return {
    locator,
    element,
    type,
    content,
    attributes
  }
}

/**
 * Find element by locator
 */
export function findElementByLocator(locator: string, root: Document | HTMLElement = document): HTMLElement | null {
  // Try direct match with data-locator
  const direct = root.querySelector(`[data-locator="${locator}"]`) as HTMLElement
  if (direct) return direct
  
  // Try parsing locator patterns
  if (locator.startsWith('id-')) {
    const id = locator.replace('id-', '')
    return root.querySelector(`#${id}`) as HTMLElement
  }
  
  // Try tag-class pattern
  const match = locator.match(/^(\w+)-(\w+)/)
  if (match) {
    const [, tag, cls] = match
    return root.querySelector(`${tag}.${cls}`) as HTMLElement
  }
  
  return null
}

/**
 * Mark element as editable (add data-locator if missing)
 */
export function markAsEditable(element: HTMLElement): void {
  if (!element.hasAttribute('data-locator')) {
    const locator = generateLocator(element)
    element.setAttribute('data-locator', locator)
  }
  element.setAttribute('data-editable', 'true')
}

/**
 * Check if element is editable
 */
export function isEditable(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase()
  const editableTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'img', 'section', 'div']
  
  return editableTags.includes(tag) && 
         !element.hasAttribute('data-no-edit') &&
         !element.closest('[data-no-edit]')
}
