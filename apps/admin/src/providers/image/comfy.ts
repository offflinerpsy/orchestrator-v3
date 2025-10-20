/**
 * ComfyUI Image Provider
 * 
 * Implements local SDXL/SD3.5 generation via ComfyUI.
 * Uses /api/comfy proxy routes (no direct HTTP from client).
 * 
 * Official ComfyUI API routes:
 * - POST /prompt — submit workflow
 * - GET /history/{prompt_id} — check execution status
 * - GET /object_info — available nodes
 * - GET /system_stats — system information
 * 
 * @see https://docs.comfy.org/development/comfyui-server/comms_routes
 */

import type { ImageProvider, ImageGenerationParams, ImageGenerationResult } from './types'

export class ComfyUIProvider implements ImageProvider {
  private baseUrl = '/api/comfy'

  async generate(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    try {
      // Step 1: Load workflow template
      const workflow = await this.loadWorkflow(params.backend)
      
      // Step 2: Inject parameters into workflow
      this.injectParams(workflow, params)

      // Step 3: Submit to ComfyUI /prompt
      const { prompt_id } = await this.submitPrompt(workflow)

      // Step 4: Poll /history until completion
      const imagePath = await this.pollHistory(prompt_id)

      const duration = Date.now() - startTime

      return {
        success: true,
        imagePath,
        metadata: {
          backend: params.backend,
          duration,
          promptId: prompt_id,
          seed: params.seed,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Load workflow template (SDXL, SD3.5, etc.)
   */
  private async loadWorkflow(backend: string): Promise<any> {
    // Load from workflows/{backend}-t2i.json
    const workflowMap: Record<string, string> = {
      'sdxl': '/workflows/t2i_sdxl.json',
      'sd35': '/workflows/t2i_sd35.json',
      'svd': '/workflows/t2i_svd.json'
    }

    const workflowPath = workflowMap[backend]
    if (!workflowPath) {
      throw new Error(`Unknown backend: ${backend}`)
    }

    try {
      const response = await fetch(workflowPath)
      if (!response.ok) {
        throw new Error(`Failed to load workflow: ${response.statusText}`)
      }
      return await response.json()
    } catch (error: any) {
      throw new Error(`Workflow load error: ${error.message}`)
    }
  }

  /**
   * Inject parameters into workflow nodes
   */
  private injectParams(workflow: any, params: ImageGenerationParams): void {
    // Inject prompt into CLIP Text Encode node
    if (workflow['75']?.inputs) {
      workflow['75'].inputs.text = params.prompt
    }

    // Inject KSampler parameters
    if (workflow['3']?.inputs) {
      if (params.seed !== undefined) {
        workflow['3'].inputs.seed = params.seed
      }
      if (params.steps !== undefined) {
        workflow['3'].inputs.steps = params.steps
      }
      if (params.cfg !== undefined) {
        workflow['3'].inputs.cfg = params.cfg
      }
      if (params.sampler) {
        workflow['3'].inputs.sampler_name = params.sampler
      }
    }
  }

  /**
   * Submit workflow to ComfyUI /prompt
   */
  private async submitPrompt(workflow: any): Promise<{ prompt_id: string }> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`ComfyUI /prompt failed: ${error.error || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Poll /history until completion
   */
  private async pollHistory(promptId: string): Promise<string> {
    const maxAttempts = 60 // 5 minutes (5s interval)
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

      const response = await fetch(`${this.baseUrl}/history/${promptId}`)
      if (!response.ok) {
        throw new Error(`ComfyUI /history failed: ${response.statusText}`)
      }

      const data = await response.json()
      const history = data[promptId]

      if (history?.status?.completed) {
        // Extract filename from outputs
        const outputs = history.outputs as any
        const firstOutput = Object.values(outputs)[0] as any
        const filename = firstOutput?.images?.[0]?.filename

        if (!filename) {
          throw new Error('ComfyUI completed but no image found in outputs')
        }

        // Return path (file is already in F:\Drop\out via ComfyUI)
        return `F:\\Drop\\out\\${filename}`
      }

      if (history?.status?.error) {
        throw new Error(`ComfyUI execution error: ${history.status.error}`)
      }
    }

    throw new Error('ComfyUI generation timeout (5 minutes)')
  }

  /**
   * Get system stats (for diagnostics)
   */
  async getSystemStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/system_stats`)
    if (!response.ok) {
      throw new Error(`Failed to get system stats: ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * Get object info (available nodes)
   */
  async getObjectInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/object_info`)
    if (!response.ok) {
      throw new Error(`Failed to get object info: ${response.statusText}`)
    }
    return await response.json()
  }
}
