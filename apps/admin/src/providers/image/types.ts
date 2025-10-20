/**
 * Image Generation Provider Interface
 * 
 * Unified interface for different image generation backends:
 * - ComfyUI (local SDXL/SD3.5/SVD)
 * - FLUX Ultra (BFL API, remote)
 * 
 * All providers implement the same generate() method.
 */

export interface ImageGenerationParams {
  backend: 'sdxl' | 'sd35' | 'flux' | 'svd'
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  cfg?: number
  seed?: number
  sampler?: string
}

export interface ImageGenerationResult {
  success: boolean
  imagePath?: string
  error?: string
  metadata?: {
    backend: string
    duration?: number
    seed?: number
    promptId?: string
  }
}

export interface ImageProvider {
  generate(params: ImageGenerationParams): Promise<ImageGenerationResult>
}
