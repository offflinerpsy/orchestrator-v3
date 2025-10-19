/**
 * System Status Endpoint
 * Aggregated health check for all services
 */

import { logger } from '@/lib/logger'
import { runServiceCommand, serviceExists } from '@/lib/service-control'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    // Check ComfyUI service
    const comfyServiceResult = await runServiceCommand('query', 'OrchestratorComfyUI', 5000)
    
    // Check ComfyUI API availability
    let comfyApiOnline = false
    let comfyModels = 0
    try {
      const statsResponse = await fetch(`${env.COMFY_URL}/system_stats`, {
        signal: AbortSignal.timeout(3000)
      })
      comfyApiOnline = statsResponse.ok
      
      if (comfyApiOnline) {
        const objectInfoResponse = await fetch(`${env.COMFY_URL}/object_info`, {
          signal: AbortSignal.timeout(3000)
        })
        if (objectInfoResponse.ok) {
          const objectInfo = await objectInfoResponse.json()
          comfyModels = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]?.length || 0
        }
      }
    } catch {
      comfyApiOnline = false
    }

    // Check environment flags
    const allowGeneration = env.ALLOW_GENERATION === 'true'
    const hasFluxKey = !!env.BFL_API_KEY
    const hasV0Key = !!env.V0_API_KEY

    const status = {
      overall: comfyApiOnline ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        comfy: {
          installed: comfyServiceResult.status !== 'not-installed',
          status: comfyServiceResult.status,
          running: comfyServiceResult.status === 'running',
          apiOnline: comfyApiOnline,
          models: comfyModels,
        },
      },
      environment: {
        allowGeneration,
        fluxKeyConfigured: hasFluxKey,
        v0KeyConfigured: hasV0Key,
        nodeEnv: env.NODE_ENV,
        logLevel: env.LOG_LEVEL,
      },
      endpoints: {
        comfyUrl: env.COMFY_URL,
        dataDir: env.DATA_DIR || '(using paths.json)',
      },
    }

    return Response.json(status)
  } catch (error: any) {
    logger.error({
      message: 'Status check error',
      error: error.message,
      stack: error.stack,
    })

    return Response.json(
      {
        overall: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
