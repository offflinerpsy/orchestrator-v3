/**
 * MCP Server for Builder v0
 * 
 * Model Context Protocol server that exposes builder tools to VS Code Copilot.
 * Allows syncing messages/jobs between panel chat and VS Code chat.
 * 
 * Tools:
 * - design.select(locator) — programmatically select element
 * - image.generate(prompt, locator) — generate image for element
 * - code.apply(locator, changes) — apply changes to source files
 * 
 * @see https://www.dyad.sh/docs/releases/0.22.0 (Dyad MCP implementation)
 * 
 * NOTE: Full MCP implementation requires separate Node.js process.
 * This is a stub for future integration.
 */

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export const builderV0Tools: MCPTool[] = [
  {
    name: 'design.select',
    description: 'Select an element in Design Mode by its data-locator attribute',
    inputSchema: {
      type: 'object',
      properties: {
        locator: {
          type: 'string',
          description: 'Element locator (e.g., "id-hero-title", "section-about-image")'
        }
      },
      required: ['locator']
    }
  },
  {
    name: 'image.generate',
    description: 'Generate an image using local SDXL model via ComfyUI',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Image generation prompt'
        },
        locator: {
          type: 'string',
          description: 'Optional: target element locator to replace image'
        },
        width: {
          type: 'number',
          description: 'Image width (default: 1024)'
        },
        height: {
          type: 'number',
          description: 'Image height (default: 1024)'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'code.apply',
    description: 'Apply changes to source code (text content, image src, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        locator: {
          type: 'string',
          description: 'Element locator'
        },
        changes: {
          type: 'object',
          description: 'Changes to apply (e.g., { text: "New content" })'
        }
      },
      required: ['locator', 'changes']
    }
  }
]

// TODO: Implement actual MCP server using stdio or HTTP transport
// For now, this exports tool schemas for documentation
