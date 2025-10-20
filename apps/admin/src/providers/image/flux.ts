/**
 * FLUX Ultra Provider (Stub)
 * 
 * Remote image generation via BFL API.
 * NOT IMPLEMENTED in v0 minimal — заглушка для будущего.
 * 
 * FLUX API docs: https://docs.bfl.ai/api-reference/tasks/generate-an-image-with-flux-11
 */

import type { ImageProvider, ImageGenerationParams, ImageGenerationResult } from './types'

export class FluxProvider implements ImageProvider {
  async generate(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    return {
      success: false,
      error: 'FLUX provider not implemented yet (use ComfyUI for local generation)',
    }
  }
}
