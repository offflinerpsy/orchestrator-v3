/**
 * API Route: /api/design/apply
 * 
 * Applies DOM patches to iframe content
 * Supports: innerHTML, className, style updates
 * 
 * POST body:
 * {
 *   locator: string (CSS selector)
 *   changes: {
 *     innerHTML?: string
 *     className?: string
 *     style?: Record<string, string>
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

interface ApplyRequest {
  locator: string
  changes: {
    innerHTML?: string
    className?: string
    style?: Record<string, string>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyRequest = await request.json()
    
    // Validation
    if (!body.locator || typeof body.locator !== 'string') {
      return NextResponse.json(
        { error: 'Invalid locator: must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!body.changes || typeof body.changes !== 'object') {
      return NextResponse.json(
        { error: 'Invalid changes: must be an object' },
        { status: 400 }
      )
    }

    // Validate CSS selector (basic check)
    try {
      // Try parsing selector in browser context (won't work server-side, but structure check)
      if (body.locator.includes('<') || body.locator.includes('>') && !body.locator.match(/^[\w\s\.\#\[\]\:\-\>\+\~\*\(\)]+$/)) {
        throw new Error('Invalid CSS selector syntax')
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid CSS selector format' },
        { status: 400 }
      )
    }

    // Return change instructions (client-side will apply via postMessage)
    return NextResponse.json({
      success: true,
      locator: body.locator,
      changes: body.changes,
      message: 'Changes ready to apply. Send to iframe via postMessage.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API /design/apply] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process design changes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
