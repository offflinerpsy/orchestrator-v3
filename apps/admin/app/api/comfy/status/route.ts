/**
 * ComfyUI Status Endpoint
 * Returns system stats and available models
 * 
 * Ref: https://docs.comfy.org/essentials/comfyui_api
 */

import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMFY_BASE = env.COMFY_URL

export async function GET() {
  try {
    // Get system stats
    const statsResponse = await fetch(`${COMFY_BASE}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    })
    
    if (!statsResponse.ok) {
      return NextResponse.json({
        ok: false,
        online: false,
        error: 'ComfyUI не отвечает',
      }, { status: 502 })
    }

    const stats = await statsResponse.json()

    // Get object info (models list)
    const objectInfoResponse = await fetch(`${COMFY_BASE}/object_info`, {
      signal: AbortSignal.timeout(5000),
    })

    let models: string[] = []
    let modelCount = 0

    if (objectInfoResponse.ok) {
      const objectInfo = await objectInfoResponse.json()
      
      // Extract checkpoint models
      const checkpointLoader = objectInfo?.CheckpointLoaderSimple
      if (checkpointLoader?.input?.required?.ckpt_name) {
        models = checkpointLoader.input.required.ckpt_name[0] || []
        modelCount = models.length
      }
    }

    return NextResponse.json({
      ok: true,
      online: true,
      stats,
      models: {
        count: modelCount,
        list: models,
      },
    })
  } catch (error) {
    console.error('ComfyUI status error:', error)
    return NextResponse.json({
      ok: false,
      online: false,
      error: error instanceof Error ? error.message : 'ComfyUI connection failed',
    }, { status: 502 })
  }
}
