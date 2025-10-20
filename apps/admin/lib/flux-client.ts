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

  const response = await fetchWithRetry(`${FLUX_API_URL}/flux-pro-1.1-ultra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': env.BFL_API_KEY,
    },
    body: JSON.stringify(payload),
  }, { attempts: 3, baseMs: 500 })

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

  const response = await fetchWithRetry(`${FLUX_API_URL}/get_result?id=${taskId}`, {
    method: 'GET',
    headers: {
      'X-Key': env.BFL_API_KEY,
    },
  }, { attempts: 5, baseMs: 300 })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FLUX polling error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data
}

type RetryOptions = { attempts: number, baseMs: number }

async function fetchWithRetry(url: string, init: RequestInit, opts: RetryOptions) {
  let lastErr: any
  for (let i = 0; i < opts.attempts; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const r = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timeout)
      if (r.ok) return r
      lastErr = new Error(`HTTP ${r.status}: ${await r.text()}`)
      // 4xx should not be retried except 429
      if (r.status >= 400 && r.status < 500 && r.status !== 429) break
    } catch (e: any) {
      lastErr = e
    }
    await new Promise(res => setTimeout(res, opts.baseMs * Math.pow(2, i)))
  }
  throw lastErr
}
