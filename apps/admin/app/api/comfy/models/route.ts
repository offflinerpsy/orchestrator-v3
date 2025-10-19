/**
 * Прокси для ComfyUI /object_info эндпоинта (расширенный)
 * Возвращает полную структуру доступных моделей
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/comfy-client.ts напрямую.
 */

import { getModels } from '@/lib/comfy-client'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    // Вызываем shared client напрямую
    const models = await getModels()

    return Response.json({
      models: {
        checkpoints: models.checkpoints,
        loras: models.loras,
        controlnets: models.controlnet,
        vae: [], // TODO: добавить в comfy-client
      },
      online: true,
    })
  } catch (error: any) {
    console.error('[COMFY PROXY] /object_info error:', error)
    return Response.json(
      {
        error: `Не удалось подключиться к ComfyUI: ${error.message}`,
        online: false,
        models: {
          checkpoints: [],
          loras: [],
          controlnets: [],
          vae: [],
        },
      },
      { status: 503 }
    )
  }
}
