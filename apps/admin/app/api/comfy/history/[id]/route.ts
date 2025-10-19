/**
 * Прокси для ComfyUI /history/:id эндпоинта
 * Получение истории задачи по prompt_id
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/comfy-client.ts напрямую.
 */

import { getHistory } from '@/lib/comfy-client'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Вызываем shared client напрямую
    const data = await getHistory(id)

    return Response.json(data)
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy /history error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    )
  }
}
