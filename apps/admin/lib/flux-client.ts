/**
 * FLUX API Client — прямые вызовы к api.bfl.ai
 * Используется:
 * - /api/flux/generate (для браузера)
 * - /api/generate (внутренняя логика)
 * 
 * ВАЖНО: НЕ вызывать через HTTP fetch между Route Handlers!
 * Это создаёт recursive loop и удваивает latency.
 */

import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const FLUX_API_URL = 'https://api.bfl.ai/v1'

export interface FluxGenerateParams {
  prompt: string
  width?: number
  height?: number
  seed?: number
  raw?: boolean
  aspect_ratio?: string
  image_prompt?: string // base64
  image_prompt_strength?: number
  output_format?: 'jpeg' | 'png'
}

export interface FluxTaskResponse {
  id: string
  polling_url?: string
}

export interface FluxPollResponse {
  id: string
  status: 'Pending' | 'Request Moderated' | 'Content Moderated' | 'Ready' | 'Error'
  result?: {
    sample: string // URL to image
  }
  error?: string
}

/**
 * POST /flux-pro-1.1-ultra — создать задачу
 * @throws Error если API ключ не настроен или запрос провалился
 */
export async function generateFlux(params: FluxGenerateParams): Promise<FluxTaskResponse> {
  if (!env.BFL_API_KEY) {
    throw new Error('BFL_API_KEY не настроен в .env.local')
  }

  if (!params.prompt) {
    throw new Error('Поле prompt обязательно')
  }

  const payload = {
    prompt: params.prompt,
    width: params.width || 1024,
    height: params.height || 768,
    seed: params.seed,
    raw: params.raw || false,
    aspect_ratio: params.aspect_ratio,
    image_prompt: params.image_prompt,
    image_prompt_strength: params.image_prompt_strength,
    output_format: params.output_format || 'jpeg',
  }

  logger.info({
    message: 'FLUX generation started',
    prompt: payload.prompt.slice(0, 50),
    width: payload.width,
    height: payload.height,
    raw: payload.raw
  })

  const response = await fetch(`${FLUX_API_URL}/flux-pro-1.1-ultra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': env.BFL_API_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000), // 30s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({
      message: 'FLUX API error',
      status: response.status,
      error: errorText
    })
    throw new Error(`FLUX API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  logger.info({
    message: 'FLUX task created',
    taskId: data.id
  })

  return data
}

/**
 * GET /get_result?id={taskId} — проверить статус задачи
 * @throws Error если polling провалился
 */
export async function pollFlux(taskId: string): Promise<FluxPollResponse> {
  if (!env.BFL_API_KEY) {
    throw new Error('BFL_API_KEY не настроен')
  }

  const response = await fetch(`${FLUX_API_URL}/get_result?id=${taskId}`, {
    headers: {
      'X-Key': env.BFL_API_KEY,
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FLUX polling error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data
}
