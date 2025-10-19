/**
 * ComfyUI API Client — прямые вызовы к 127.0.0.1:8188
 * Используется:
 * - /api/comfy/* (для браузера)
 * - /api/generate (внутренняя логика)
 * 
 * ВАЖНО: НЕ вызывать через HTTP fetch между Route Handlers!
 * Это создаёт recursive loop и удваивает latency.
 */

import { env } from '@/lib/env'

export const runtime = 'nodejs'

const COMFYUI_URL = env.COMFY_URL

export interface ComfyPromptRequest {
  prompt: Record<string, any> // workflow JSON
  client_id?: string
}

export interface ComfyPromptResponse {
  prompt_id: string
  number: number
  node_errors?: Record<string, any>
}

export interface ComfyHistoryResponse {
  [promptId: string]: {
    prompt: any
    outputs: Record<string, any>
    status: {
      status_str: string
      completed: boolean
      messages: any[]
    }
  }
}

export interface ComfyQueueResponse {
  queue_running: any[]
  queue_pending: any[]
}

export interface ComfyModelsResponse {
  checkpoints: string[]
  loras: string[]
  controlnet: string[]
}

/**
 * POST /prompt — отправить workflow на исполнение
 */
export async function submitPrompt(request: ComfyPromptRequest): Promise<ComfyPromptResponse> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30000), // 30s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ComfyUI /prompt error (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * GET /history/{promptId} — получить результат workflow
 */
export async function getHistory(promptId: string): Promise<ComfyHistoryResponse> {
  const response = await fetch(`${COMFYUI_URL}/history/${promptId}`, {
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ComfyUI /history error (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * GET /queue — получить очередь выполнения
 */
export async function getQueue(): Promise<ComfyQueueResponse> {
  const response = await fetch(`${COMFYUI_URL}/queue`, {
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ComfyUI /queue error (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * POST /interrupt — прервать текущее выполнение
 */
export async function interruptExecution(): Promise<void> {
  const response = await fetch(`${COMFYUI_URL}/interrupt`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ComfyUI /interrupt error (${response.status}): ${errorText}`)
  }
}

/**
 * GET /object_info — получить список доступных моделей
 * @returns список checkpoint, lora, controlnet моделей
 */
export async function getModels(): Promise<ComfyModelsResponse> {
  const response = await fetch(`${COMFYUI_URL}/object_info`, {
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ComfyUI /object_info error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  // Извлекаем списки моделей из object_info
  const checkpoints = data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || []
  const loras = data.LoraLoader?.input?.required?.lora_name?.[0] || []
  const controlnet = data.ControlNetLoader?.input?.required?.control_net_name?.[0] || []

  return {
    checkpoints,
    loras,
    controlnet,
  }
}
