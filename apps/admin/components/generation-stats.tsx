'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Job {
  id: string
  status: 'created' | 'running' | 'done' | 'failed'
  backend: string
  prompt: string
  result?: {
    file?: string
    error?: string
  }
}

export function GenerationStats() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs')
        if (res.ok) {
          const data = await res.json()
          setJobs(data.jobs || [])
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
    const interval = setInterval(fetchJobs, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generation Stats</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const recentJobs = jobs.slice(0, 10)
  const successCount = jobs.filter(j => j.status === 'done').length
  const failedCount = jobs.filter(j => j.status === 'failed').length
  const runningCount = jobs.filter(j => j.status === 'running').length

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{successCount}</span>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ✓ sdxl_00001_.png (1.75 MB)
              <br />
              ✓ sdxl_00002_.png (2.09 MB)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">{failedCount}</span>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mostly corrupted SDXL/SD3.5 models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">{runningCount}</span>
              {runningCount > 0 ? (
                <Clock className="h-8 w-8 text-blue-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {runningCount > 0 ? 'Generation in progress...' : 'No active jobs'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Last 10 generation attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No jobs yet</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono text-muted-foreground">
                        {job.id.substring(0, 8)}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {job.backend}
                      </Badge>
                      {job.status === 'done' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {job.status === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {job.status === 'running' && (
                        <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm truncate">{job.prompt}</p>
                    {job.status === 'done' && job.result?.file && (
                      <p className="text-xs mt-1 text-green-600 font-mono">
                        ✓ {job.result.file.split('\\').pop()}
                      </p>
                    )}
                    {job.status === 'failed' && job.result?.error && (
                      <p className="text-xs mt-1 text-red-600 truncate">
                        ✗ {job.result.error.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Badge
                      variant={
                        job.status === 'done'
                          ? 'default'
                          : job.status === 'failed'
                          ? 'destructive'
                          : job.status === 'running'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="whitespace-nowrap"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Recent Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <span className="font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
              ✓ 2025-10-20:
            </span>
            <span className="text-green-900 dark:text-green-300">
              Second successful generation (sdxl_00002_.png, 2.09 MB) — Autonomous monitoring active
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
              ✓ 2025-10-20:
            </span>
            <span className="text-green-900 dark:text-green-300">
              First successful generation (sdxl_00001_.png, 1.75 MB) — SD 1.5 fallback working
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
              ✓ 2025-10-20:
            </span>
            <span className="text-green-900 dark:text-green-300">
              Worker checkpoint fallback logic implemented (prefer SD 1.5 over corrupted SDXL/SD3.5)
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
              ✓ 2025-10-20:
            </span>
            <span className="text-green-900 dark:text-green-300">
              Context7 MCP server installed and configured (C:\Work\context7)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
