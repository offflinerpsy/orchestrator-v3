/**
 * Прокси для FLUX API polling
 * Опрос статуса задачи по task_id
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/flux-client.ts напрямую.
 */

import { pollFlux } from '@/lib/flux-client'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    // Вызываем shared client напрямую
    const data = await pollFlux(taskId)

    // Статусы: Ready, Pending, Request Moderated, Content Moderated, Error
    return Response.json({
      status: data.status,
      result: data.result, // URL изображения если Ready
      error: data.error,
    })
  } catch (error: any) {
    console.error('[FLUX PROXY] /poll error:', error)
    return Response.json(
      { error: `Ошибка опроса FLUX: ${error.message}` },
      { status: 500 }
    )
  }
}
