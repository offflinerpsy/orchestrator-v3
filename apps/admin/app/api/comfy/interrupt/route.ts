/**
 * Прокси для ComfyUI /interrupt эндпоинта
 * Прерывание текущей генерации
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/comfy-client.ts напрямую.
 */

import { interruptExecution } from '@/lib/comfy-client'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST() {
  try {
    // Вызываем shared client напрямую
    await interruptExecution()

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('[COMFY PROXY] /interrupt error:', error)
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    )
  }
}
