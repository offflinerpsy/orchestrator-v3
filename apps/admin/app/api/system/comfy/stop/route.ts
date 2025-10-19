/**
 * Остановка службы OrchestratorComfyUI
 * POST /api/system/comfy/stop
 */

import { logger } from '@/lib/logger'
import { runServiceCommand, waitForServiceStop } from '@/lib/service-control'

export const runtime = 'nodejs'
export const revalidate = 0

const SERVICE_NAME = 'OrchestratorComfyUI'

export async function POST() {
  try {
    logger.info({ message: 'ComfyUI service stop requested' })
    
    const result = await runServiceCommand('stop', SERVICE_NAME)
    
    if (!result.success) {
      logger.error({
        message: 'ComfyUI service stop failed',
        output: result.output,
        error: result.error
      })
      return Response.json(
        {
          success: false,
          message: 'Не удалось остановить службу',
          status: result.status,
          error: result.error
        },
        { status: 500 }
      )
    }
    
    // Ожидание остановки (до 15 секунд)
    logger.info({ message: 'Waiting for service to stop...' })
    const stopped = await waitForServiceStop(SERVICE_NAME, 15000, 500)
    
    if (!stopped) {
      logger.warn({ message: 'Service stop timeout' })
      return Response.json(
        {
          success: false,
          message: 'Служба не остановилась за 15 секунд',
          status: 'timeout'
        },
        { status: 500 }
      )
    }
    
    logger.info({ message: 'ComfyUI service stopped successfully' })
    return Response.json({
      success: true,
      message: 'ComfyUI служба остановлена',
      status: 'stopped'
    })
    
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI stop error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
