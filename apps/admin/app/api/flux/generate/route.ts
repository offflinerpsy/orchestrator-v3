/**
 * Прокси для FLUX API /flux-pro-1.1-ultra
 * ВАЖНО: платный эндпоинт, требует подтверждения перед вызовом
 * 
 * Используется ТОЛЬКО для браузерных запросов.
 * Внутренняя логика сервера должна импортировать lib/flux-client.ts напрямую.
 * 
 * РЕЖИМЫ:
 * 1. Dry-run (по умолчанию): Валидация payload без вызова API
 * 2. Confirmed: Реальный вызов API (требует ALLOW_GENERATION=true + confirmed=true)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateFlux } from '@/lib/flux-client'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 0

// Ориентировочная цена FLUX 1.1 Pro Ultra
const ESTIMATED_COST_USD = 0.04

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { confirmed = false } = body

    // Валидация обязательных полей
    if (!body.prompt) {
      return Response.json(
        { error: 'Поле prompt обязательно' },
        { status: 400 }
      )
    }

    // Валидация payload structure (перед сборкой конфига)
    const config = {
      prompt: body.prompt,
      width: body.width || undefined,
      height: body.height || undefined,
      seed: body.seed || undefined,
      raw: body.raw || undefined,
      aspect_ratio: body.aspect_ratio || undefined,
      image_prompt: body.image_prompt || undefined,
      image_prompt_strength: body.image_prompt_strength || undefined,
      output_format: body.output_format || undefined,
    }

    // DRY-RUN MODE: Возвращаем валидацию без вызова API
    const allowGeneration = env.ALLOW_GENERATION === 'true' && confirmed === true

    if (!allowGeneration) {
      logger.info({
        message: 'FLUX dry-run validation',
        prompt: body.prompt?.slice(0, 50) + '...',
        confirmed,
        allowFlag: env.ALLOW_GENERATION
      })

      return Response.json({
        dryRun: true,
        valid: true,
        payload: config,
        estimatedCost: `$${ESTIMATED_COST_USD}`,
        message: confirmed 
          ? 'ALLOW_GENERATION=false. Установите ALLOW_GENERATION=true в .env для реальной генерации.'
          : 'Payload валиден. Установите confirmed=true для запроса генерации.',
        note: 'Это dry-run режим — API не вызывается, деньги не списываются.'
      })
    }

    // REAL GENERATION: Только если ALLOW_GENERATION=true И confirmed=true
    logger.warn({
      message: '💸 FLUX real generation',
      prompt: body.prompt?.slice(0, 50) + '...',
      estimatedCost: ESTIMATED_COST_USD
    })

    const data = await generateFlux(config)

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
