/**
 * Запуск службы OrchestratorComfyUI
 * POST /api/system/comfy/start
 */

import { logger } from '@/lib/logger'
import { runServiceCommand, waitForServiceStart } from '@/lib/service-control'

export const runtime = 'nodejs'
export const revalidate = 0

const SERVICE_NAME = 'OrchestratorComfyUI'

export async function POST() {
  try {
    logger.info({ message: 'ComfyUI service start requested' })
    
    // Запуск службы
    const result = await runServiceCommand('start', SERVICE_NAME)
    
    if (!result.success) {
      logger.error({
        message: 'ComfyUI service start failed',
        output: result.output,
        error: result.error
      })
      return Response.json(
        {
          success: false,
          message: 'Не удалось запустить службу',
          status: result.status,
          error: result.error
        },
        { status: 500 }
      )
    }
    
    // Ожидание фактического запуска (до 30 секунд)
    logger.info({ message: 'Waiting for service to start...' })
    const started = await waitForServiceStart(SERVICE_NAME, 30000, 1000)
    
    if (!started) {
      logger.warn({ message: 'Service start timeout' })
      return Response.json(
        {
          success: false,
          message: 'Служба не запустилась за 30 секунд',
          status: 'timeout'
        },
        { status: 500 }
      )
    }
    
    logger.info({ message: 'ComfyUI service started successfully' })
    return Response.json({
      success: true,
      message: 'ComfyUI служба запущена',
      status: 'running'
    })
    
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI start error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
