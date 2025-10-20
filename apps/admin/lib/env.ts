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

  // Black Forest Labs FLUX API Key (optional for FLUX generation)
  BFL_API_KEY: z.string().optional(),

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

  // Allow real API generation (FLUX, ComfyUI) — по умолчанию false для безопасности
  ALLOW_GENERATION: z.enum(['true', 'false']).default('false'),
})

/**
 * Parse and validate environment variables
 * Uses safeParse to avoid throwing during module initialization
 * 
 * Ref: https://nextjs.org/docs/app/building-your-configuration/environment-variables
 */
function parseEnv() {
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    
    // Log to console (visible in Next.js output)
    console.error('❌ Environment validation failed:')
    console.error(JSON.stringify(errors, null, 2))
    
    // Return safe defaults + error marker
    return {
      HF_TOKEN: undefined,
      BFL_API_KEY: 'missing',
      COMFY_URL: 'http://127.0.0.1:8188',
      V0_API_KEY: undefined,
      DATA_DIR: undefined,
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      LOG_LEVEL: 'info' as const,
      NODE_ENV: 'development' as const,
      ALLOW_GENERATION: 'false' as const,
      _validationErrors: errors,
      _isValid: false,
    }
  }
  
  return {
    ...result.data,
    _validationErrors: undefined,
    _isValid: true,
  }
}

/**
 * Validated environment variables
 * Safe to use throughout the app
 * Check env._isValid in layout.tsx to show error UI
 */
export const env = parseEnv()

// Environment validated (logs removed to prevent Next.js module eval issues)
