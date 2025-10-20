/**
 * Builder v0 Image Generation API
 * 
 * Direct ComfyUI generation for Design Mode (bypasses Worker queue).
 * Used when user clicks "Сгенерировать (локально)" in Inspector.
 * 
 * POST /api/builder-v0/generate-image
 * Body: { prompt, locator?, width?, height?, seed? }
 * 
 * Returns: { success, imagePath, metadata }
 */

import { NextRequest, NextResponse } from 'next/server'
import { ComfyUIProvider } from '@/src/providers/image/comfy'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, locator, width, height, seed } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use ComfyUI provider directly
    const provider = new ComfyUIProvider()
    
    const result = await provider.generate({
      backend: 'sdxl',
      prompt,
      width: width || 1024,
      height: height || 1024,
      seed: seed || Math.floor(Math.random() * 1000000),
      steps: 20,
      cfg: 7,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imagePath: result.imagePath,
      locator,
      metadata: result.metadata
    })

  } catch (error: any) {
    console.error('[builder-v0 generate-image] Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
