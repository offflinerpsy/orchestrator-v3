/**
 * SSE API: /api/jobs/stream
 * 
 * Server-Sent Events endpoint for real-time job status updates
 * Streams job state changes from Worker
 * 
 * Modern patterns (Context7: SSE React hooks)
 * - Content-Type: text/event-stream with charset=utf-8
 * - X-Accel-Buffering: no (nginx compatibility)
 * - Event IDs (monotonic counter) for client reconnect (Last-Event-ID)
 * - Retry hint (3s) for automatic reconnection
 * - Heartbeat comments (: ping) every 30s
 * - Double \n\n event separator
 * 
 * GET /api/jobs/stream
 * Returns: SSE stream with job-update events
 */

import { NextRequest } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { resolvePath } from '@/lib/paths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getJobsDir() {
  return resolvePath('jobs')
}

let globalEventId = 0 // Monotonic event ID counter

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  // Support Last-Event-ID for reconnection
  const lastEventId = request.headers.get('Last-Event-ID')
  let eventId = lastEventId ? parseInt(lastEventId, 10) + 1 : globalEventId++
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send headers immediately (SSE spec)
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data))
      }

      // Send retry hint (3s) and initial connection event
      send(`retry: 3000\n`)
      send(`: connected\n\n`)

      let lastJobStates = new Map<string, string>()

      // Poll jobs directory every 2 seconds
      const interval = setInterval(async () => {
        try {
          const jobsDir = getJobsDir()
          const files = await readdir(jobsDir)
          const jobFiles = files.filter(f => f.endsWith('.json'))

          for (const file of jobFiles) {
            const jobPath = join(jobsDir, file)
            const rawContent = await readFile(jobPath, 'utf-8')
            const content = rawContent.trim()

            // Skip files that are still being written (no closing brace yet)
            if (!content || !content.endsWith('}')) {
              continue
            }

            const job = JSON.parse(content)

            const jobId = job.id
            const currentState = JSON.stringify({ status: job.status, progress: job.progress })

            // Only send update if state changed
            if (lastJobStates.get(jobId) !== currentState) {
              lastJobStates.set(jobId, currentState)

              // SSE format with id: event: data: \n\n
              send(`id: ${eventId++}\n`)
              send(`event: job-update\n`)
              send(`data: ${JSON.stringify(job)}\n\n`)
            }
          }
        } catch (error) {
          console.error('[SSE] Poll error:', error)
        }
      }, 2000)

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        send(`: ping\n\n`)
      }, 30000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
