/**
 * Прокси для FLUX API /flux-pro-1.1-ultra
 * ВАЖНО: платный эндпоинт, требует подтверждения перед вызовом
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/flux-client.ts напрямую.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateFlux } from '@/lib/flux-client'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Валидация обязательных полей
    if (!body.prompt) {
      return Response.json(
        { error: 'Поле prompt обязательно' },
        { status: 400 }
      )
    }

    // Вызываем shared client напрямую
    const data = await generateFlux({
      prompt: body.prompt,
      width: body.width,
      height: body.height,
      seed: body.seed,
      raw: body.raw,
      aspect_ratio: body.aspect_ratio,
      image_prompt: body.image_prompt,
      image_prompt_strength: body.image_prompt_strength,
      output_format: body.output_format,
    })

    return Response.json(data)
  } catch (error: any) {
    logger.error({
      message: 'FLUX proxy /generate error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { error: `Ошибка генерации FLUX: ${error.message}` },
      { status: 500 }
    )
  }
}
