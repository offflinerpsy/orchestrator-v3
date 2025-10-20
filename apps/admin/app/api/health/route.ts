import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const now = new Date().toISOString()

  // ComfyUI system_stats
  let comfyOnline = false
  let comfyModels = 0
  let comfyVersion: string | undefined
  try {
    const r = await fetch(`${env.COMFY_URL}/system_stats`, { signal: AbortSignal.timeout(3000), cache: 'no-store' as RequestCache })
    if (r.ok) {
      comfyOnline = true
      const stats: any = await r.json()
      comfyVersion = stats?.system?.comfyui_version
    }
  } catch {}

  // ComfyUI object_info (models count)
  if (comfyOnline) {
    try {
      const r = await fetch(`${env.COMFY_URL}/object_info`, { signal: AbortSignal.timeout(3000), cache: 'no-store' as RequestCache })
      if (r.ok) {
        const oi: any = await r.json()
        const names = oi?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]
        if (Array.isArray(names)) comfyModels = names.length
      }
    } catch {}
  }

  const allowGeneration = env.ALLOW_GENERATION === 'true'
  const fluxKeyConfigured = !!env.BFL_API_KEY && env.BFL_API_KEY !== 'missing'

  const overall = comfyOnline ? 'healthy' : 'degraded'

  return NextResponse.json({
    overall,
    timestamp: now,
    services: {
      comfy: {
        online: comfyOnline,
        models: comfyModels,
        version: comfyVersion,
      },
      flux: {
        keyConfigured: fluxKeyConfigured,
      }
    },
    environment: {
      allowGeneration,
      nodeEnv: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
    },
    endpoints: {
      comfyUrl: env.COMFY_URL,
    }
  })
}


