/**
 * ComfyUI Catch-All Proxy
 * Прокси для всех ComfyUI API endpoints через /api/comfy/*
 * 
 * Примеры:
 * - GET /api/comfy/system_stats → http://127.0.0.1:8188/system_stats
 * - POST /api/comfy/prompt → http://127.0.0.1:8188/prompt
 * - GET /api/comfy/history/123 → http://127.0.0.1:8188/history/123
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 0

const COMFY_BASE = env.COMFY_URL

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path?.join('/') || ''
  const searchParams = request.nextUrl.searchParams.toString()
  const targetUrl = `${COMFY_BASE}/${path}${searchParams ? '?' + searchParams : ''}`

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'accept': request.headers.get('accept') || 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    const contentType = response.headers.get('content-type') || 'application/json'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    })
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy GET error',
      path,
      error: error.message,
    })

    return Response.json(
      { 
        error: 'ComfyUI proxy error',
        message: error.message,
        path: `/${path}`,
      },
      { status: 502 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path?.join('/') || ''
  const targetUrl = `${COMFY_BASE}/${path}`

  try {
    const contentType = request.headers.get('content-type') || 'application/json'
    const body = await request.arrayBuffer()

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'content-type': contentType,
      },
      body,
      signal: AbortSignal.timeout(30000),
    })

    const responseContentType = response.headers.get('content-type') || 'application/json'
    const responseBody = await response.arrayBuffer()

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': responseContentType,
      },
    })
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy POST error',
      path,
      error: error.message,
    })

    return Response.json(
      { 
        error: 'ComfyUI proxy error',
        message: error.message,
        path: `/${path}`,
      },
      { status: 502 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path?.join('/') || ''
  const targetUrl = `${COMFY_BASE}/${path}`

  try {
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000),
    })

    const responseBody = await response.arrayBuffer()

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI proxy DELETE error',
      path,
      error: error.message,
    })

    return Response.json(
      { 
        error: 'ComfyUI proxy error',
        message: error.message,
        path: `/${path}`,
      },
      { status: 502 }
    )
  }
}
