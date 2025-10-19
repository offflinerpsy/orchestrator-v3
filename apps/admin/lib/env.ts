/**
 * Environment Variables Validation — Zod Schema
 * 
 * Валидируется при старте приложения.
 * Если какая-то переменная отсутствует — приложение не запустится.
 * 
 * USAGE:
 * import { env } from '@/lib/env'
 * console.log(env.BFL_API_KEY)
 */

import { z } from 'zod'

const envSchema = z.object({
  // Hugging Face Token (optional for production, required for model downloads)
  HF_TOKEN: z.string().optional(),

  // Black Forest Labs FLUX API Key (required for FLUX generation)
  BFL_API_KEY: z.string().min(1, 'BFL_API_KEY is required for FLUX generation'),

  // ComfyUI Service URL (default: http://127.0.0.1:8188)
  COMFY_URL: z.string().url().default('http://127.0.0.1:8188'),

  // v0.dev API Key (optional for UI generation)
  V0_API_KEY: z.string().optional(),

  // Data directory (absolute path for orchestrator.db)
  DATA_DIR: z.string().optional(),

  // Next.js public URL (for rewrites and SSE)
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Log level (debug | info | warn | error)
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Node environment (auto-detected, don't override)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/**
 * Parse and validate environment variables
 * Throws if validation fails (app won't start)
 */
function parseEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
      throw new Error('Invalid environment variables. Check .env.local against .env.example')
    }
    throw error
  }
}

/**
 * Validated environment variables
 * Safe to use throughout the app
 */
export const env = parseEnv()

console.log('[ENV] ✅ Environment variables validated')
console.log('[ENV] NODE_ENV:', env.NODE_ENV)
console.log('[ENV] COMFY_URL:', env.COMFY_URL)
console.log('[ENV] DATA_DIR:', env.DATA_DIR || '(using paths.json fallback)')
console.log('[ENV] LOG_LEVEL:', env.LOG_LEVEL)
console.log('[ENV] BFL_API_KEY:', env.BFL_API_KEY ? '***' + env.BFL_API_KEY.slice(-4) : '(not set)')
