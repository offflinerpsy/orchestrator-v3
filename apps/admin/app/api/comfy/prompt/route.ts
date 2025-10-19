/**
 * Прокси для ComfyUI /prompt эндпоинта
 * Убирает CORS, скрывает прямые запросы к 127.0.0.1:8188
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/comfy-client.ts напрямую.
 */

import { submitPrompt } from '@/lib/comfy-client'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Вызываем shared client напрямую
    const data = await submitPrompt(body)

    return Response.json(data)
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy /prompt error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    )
  }
}
