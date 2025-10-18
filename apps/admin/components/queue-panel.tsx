/**
 * Queue Component — Real-time job tracking
 * Shows jobs list with Run/Cancel/Progress controls
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Play, X, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Job {
  id: string
  backend: 'flux' | 'sdxl' | 'sd35' | 'svd'
  status: 'created' | 'queued' | 'running' | 'done' | 'failed'
  prompt: string
  progress?: number
  createdAt: string
}

export function QueuePanel() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000) // Poll every 3s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No jobs yet. Start a generation!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {job.status === 'running' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {job.status === 'done' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {job.status === 'failed' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {['created', 'queued'].includes(job.status) && (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {job.backend}
                </span>
                <span className="text-xs text-muted-foreground">
                  {job.status}
                </span>
              </div>
              <p className="text-sm truncate mb-2">{job.prompt}</p>
              
              {job.status === 'running' && typeof job.progress === 'number' && (
                <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-1">
                {job.status === 'created' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => runJob(job.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                )}
                {['queued', 'running'].includes(job.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => cancelJob(job.id)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                {job.status === 'done' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => viewResult(job.id)}
                  >
                    View Result
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function runJob(jobId: string) {
  // TODO: Implement job execution trigger
  console.log('Run job:', jobId)
}

async function cancelJob(jobId: string) {
  // TODO: Implement job cancellation
  console.log('Cancel job:', jobId)
}

async function viewResult(jobId: string) {
  // TODO: Open result in Canvas tab
  console.log('View result:', jobId)
}
