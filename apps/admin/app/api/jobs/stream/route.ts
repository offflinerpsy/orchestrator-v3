/**
 * SSE API: /api/jobs/stream
 * 
 * Server-Sent Events endpoint for real-time job status updates
 * Streams job state changes from Worker
 * 
 * Modern patterns (Context7: SSE React hooks)
 * - Content-Type: text/event-stream with charset=utf-8
 * - X-Accel-Buffering: no (nginx compatibility)
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

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send headers immediately (SSE spec)
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data))
      }

      // Send initial connection event
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
            const content = await readFile(jobPath, 'utf-8')
            const job = JSON.parse(content)

            const jobId = job.id
            const currentState = JSON.stringify({ status: job.status, progress: job.progress })

            // Only send update if state changed
            if (lastJobStates.get(jobId) !== currentState) {
              lastJobStates.set(jobId, currentState)

              // SSE format: data: ...\n\n
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
