/**
 * Chat Messages API
 * GET /api/chat/messages — получить последние сообщения
 * POST /api/chat/messages — создать новое сообщение
 */

import { createMessage, listMessages, type Message } from '@/lib/db'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

/**
 * GET — получить список сообщений
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const messages = listMessages(limit, offset)

    return Response.json({
      ok: true,
      messages: messages.reverse(), // Реверсим чтобы старые были вверху
      count: messages.length,
    })
  } catch (error: any) {
    logger.error({
      message: 'Chat API GET error',
      error: error.message,
      stack: error.stack,
      url: request.url
    })
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST — создать новое сообщение
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, content, jobId } = body

    if (!role || !content) {
      return Response.json(
        { ok: false, error: 'Поля role и content обязательны' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return Response.json(
        { ok: false, error: 'role должен быть: user, assistant или system' },
        { status: 400 }
      )
    }

    const message: Message = {
      id: randomUUID(),
      role,
      content,
      jobId,
      timestamp: new Date().toISOString(),
    }

    createMessage(message)

    return Response.json({ ok: true, message })
  } catch (error: any) {
    logger.error({
      message: 'Chat API POST error',
      error: error.message,
      stack: error.stack,
      url: request.url
    })
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
}
