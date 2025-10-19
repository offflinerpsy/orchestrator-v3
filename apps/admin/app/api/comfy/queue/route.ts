/**
 * Прокси для ComfyUI /queue эндпоинта
 * Получение текущей очереди задач
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/comfy-client.ts напрямую.
 */

import { getQueue } from '@/lib/comfy-client'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    // Вызываем shared client напрямую
    const data = await getQueue()

    return Response.json(data)
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy /queue error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    )
  }
}
