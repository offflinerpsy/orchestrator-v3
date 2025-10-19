/**
 * Статус службы OrchestratorComfyUI
 * GET /api/system/comfy/status
 */

import { logger } from '@/lib/logger'
import { runServiceCommand } from '@/lib/service-control'

export const runtime = 'nodejs'
export const revalidate = 0

const SERVICE_NAME = 'OrchestratorComfyUI'

export async function GET() {
  try {
    const result = await runServiceCommand('query', SERVICE_NAME, 5000)
    
    return Response.json({
      success: result.success,
      status: result.status,
      running: result.status === 'running',
      stopped: result.status === 'stopped',
      pending: result.status === 'starting' || result.status === 'stopping',
      installed: result.status !== 'not-installed',
      message: getStatusMessage(result.status)
    })
    
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI status error',
      error: error.message,
      stack: error.stack
    })
    return Response.json({
      success: false,
      status: 'error',
      running: false,
      stopped: true,
      pending: false,
      installed: false,
      error: error.message
    })
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'running':
      return 'Служба запущена'
    case 'stopped':
      return 'Служба остановлена'
    case 'starting':
      return 'Служба запускается...'
    case 'stopping':
      return 'Служба останавливается...'
    case 'not-installed':
      return 'Служба не установлена'
    case 'unknown':
      return 'Статус неизвестен'
    case 'error':
      return 'Ошибка получения статуса'
    default:
      return 'Неизвестное состояние'
  }
}
