/**
 * Service Keys Validation API
 * Check validity of FLUX (BFL_API_KEY) and v0 (V0_API_KEY) without making paid calls
 * @see https://docs.bfl.ai/api-reference
 * @see https://v0.dev/docs/v0-platform-api
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

/**
 * GET /api/keys/validate - Validate API keys
 */
export async function GET() {
  const results = {
    flux: { valid: false, error: null as string | null },
    v0: { valid: false, error: null as string | null }
  }

  // Validate FLUX (BFL_API_KEY)
  const fluxKey = process.env.BFL_API_KEY
  if (!fluxKey) {
    results.flux.error = 'BFL_API_KEY not found in environment'
  } else {
    try {
      // Dry-run validation: check if key format is valid (starts with "bfl_")
      // We don't make actual API call to avoid charges
      if (fluxKey.startsWith('bfl_')) {
        results.flux.valid = true
      } else {
        results.flux.error = 'Invalid key format (should start with "bfl_")'
      }
    } catch (error: any) {
      results.flux.error = error.message
    }
  }

  // Validate v0 (V0_API_KEY)
  const v0Key = process.env.V0_API_KEY
  if (!v0Key) {
    results.v0.error = 'V0_API_KEY not found in environment'
  } else {
    try {
      // v0 SDK auto-validates on import
      // We can do a simple check or ping endpoint
      // For now, just check if key exists and has reasonable length
      if (v0Key.length > 20) {
        results.v0.valid = true
      } else {
        results.v0.error = 'Key too short (possibly invalid)'
      }
    } catch (error: any) {
      results.v0.error = error.message
    }
  }

  return NextResponse.json(results)
}
