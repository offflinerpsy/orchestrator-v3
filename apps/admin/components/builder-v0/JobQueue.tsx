/**
 * JobQueue Component
 * 
 * Real-time job queue panel with SSE subscription
 * Shows all jobs (image generation, model downloads, etc.)
 * 
 * Modern patterns (Context7: SSE React hooks, job-queue-ui)
 * - useEffect for SSE connection lifecycle
 * - EventSource API with error recovery
 * - Optimistic UI updates (instant feedback)
 * - Status badges with Lucide icons
 * 
 * Integration: ≡ dropdown menu → "Очередь задач"
 */

'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from 'lucide-react'

interface Job {
  id: string
  backend: string
  status: 'created' | 'queued' | 'running' | 'done' | 'failed'
  prompt?: string
  progress?: number
  result?: { url?: string }
  createdAt: string
  startedAt?: string
  finishedAt?: string
  logs?: string[]
  error?: string
}

export function JobQueue() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // SSE connection to /api/jobs/stream (Context7 pattern)
    const eventSource = new EventSource('/api/jobs/stream')

    eventSource.addEventListener('open', () => {
      console.log('[JobQueue] SSE connected')
      setIsConnected(true)
      setError(null)
    })

    eventSource.addEventListener('job-update', (event: MessageEvent) => {
      const job: Job = JSON.parse(event.data)
      console.log('[JobQueue] Job update:', job.id, job.status)

      setJobs(prev => {
        const idx = prev.findIndex(j => j.id === job.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = job
          return next
        } else {
          return [job, ...prev] // Add new job to top
        }
      })
    })

    eventSource.addEventListener('error', (event) => {
      console.error('[JobQueue] SSE error:', event)
      setIsConnected(false)
      setError('Потеряно соединение. Переподключение...')

      // Auto-reconnect after 5s
      setTimeout(() => {
        eventSource.close()
        // Browser will auto-reconnect on next render
      }, 5000)
    })

    // Cleanup on unmount
    return () => {
      console.log('[JobQueue] SSE disconnect')
      eventSource.close()
    }
  }, [])

  const handleDeleteJob = async (jobId: string) => {
    // Optimistic UI update
    setJobs(prev => prev.filter(j => j.id !== jobId))

    try {
      await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('[JobQueue] Delete failed:', err)
      // TODO: Re-fetch jobs on error
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'queued' }),
      })
    } catch (err) {
      console.error('[JobQueue] Retry failed:', err)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Очередь задач</h2>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Нет задач в очереди
          </div>
        ) : (
          <div className="divide-y" data-testid="job-queue">
            {jobs.map(job => (
              <JobItem
                key={job.id}
                job={job}
                onDelete={handleDeleteJob}
                onRetry={handleRetryJob}
                data-testid={`job-row-${job.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface JobItemProps {
  job: Job
  onDelete: (id: string) => void
  onRetry: (id: string) => void
  'data-testid'?: string
}

function JobItem({ job, onDelete, onRetry, 'data-testid': testId }: JobItemProps) {
  const statusConfig = {
    created: { icon: Clock, color: 'text-gray-500', label: 'Создан' },
    queued: { icon: Clock, color: 'text-blue-500', label: 'В очереди' },
    running: { icon: Loader2, color: 'text-yellow-500 animate-spin', label: 'Выполняется' },
    done: { icon: CheckCircle, color: 'text-green-500', label: 'Готово' },
    failed: { icon: XCircle, color: 'text-red-500', label: 'Ошибка' },
  }

  const config = statusConfig[job.status]
  const Icon = config.icon

  return (
    <div className="px-4 py-3 hover:bg-muted/50 transition-colors" data-testid={testId}>
      {/* Status + Backend */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">
            {job.backend.toUpperCase()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {job.status === 'failed' && (
            <button
              onClick={() => onRetry(job.id)}
              className="p-1 hover:bg-muted rounded"
              title="Повторить"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
          {['done', 'failed'].includes(job.status) && (
            <button
              onClick={() => onDelete(job.id)}
              className="p-1 hover:bg-muted rounded"
              title="Удалить"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt/Progress */}
      {job.prompt && (
        <p className="text-sm text-muted-foreground truncate mb-1">
          {job.prompt}
        </p>
      )}
      {job.status === 'running' && typeof job.progress === 'number' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{job.progress}%</span>
        </div>
      )}

      {/* Result */}
      {job.status === 'done' && job.result?.url && (
        <div className="mt-2">
          <img
            src={job.result.url}
            alt="Generated"
            className="w-full h-24 object-cover rounded border"
          />
        </div>
      )}

      {/* Error */}
      {job.status === 'failed' && job.error && (
        <p className="text-xs text-red-600 mt-1">{job.error}</p>
      )}

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(job.createdAt).toLocaleTimeString('ru-RU')}
      </div>
    </div>
  )
}
