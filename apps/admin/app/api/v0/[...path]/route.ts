/**
 * v0.dev API Proxy Route Handler
 * Proxies all requests to v0.dev API
 * 
 * Ref: https://v0.dev/api (v0 API documentation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const V0_API_BASE = 'https://api.v0.dev'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToV0(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToV0(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToV0(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToV0(request, path, 'DELETE')
}

async function proxyToV0(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Check V0_API_KEY
    if (!env.V0_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: 'V0_API_KEY is not configured. Add it to .env.local',
        },
        { status: 500 }
      )
    }

    const path = pathSegments.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${V0_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Authorization', `Bearer ${env.V0_API_KEY}`)

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(60000), // 60s timeout for v0 API
    }

    // Forward body for POST/PUT
    if (method === 'POST' || method === 'PUT') {
      try {
        const body = await request.text()
        if (body) {
          options.body = body
        }
      } catch (e) {
        // No body
      }
    }

    const response = await fetch(url, options)
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('v0 proxy error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'v0 proxy request failed',
      },
      { status: 500 }
    )
  }
}
