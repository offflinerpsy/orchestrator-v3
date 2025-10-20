/**
 * Generation API — Job Creation Only
 * 
 * Creates job files for Worker to process.
 * Worker (NSSM service) handles ALL execution (FLUX, ComfyUI, etc.)
 * 
 * Architecture:
 * 1. API creates job JSON file with status='created' or 'queued'
 * 2. Worker scans jobs/ every 2 seconds
 * 3. Worker executes job (FLUX API or ComfyUI)
 * 4. Worker updates job status to 'done' or 'failed'
 * 5. UI polls /api/jobs to show results
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { resolvePath } from '@/lib/paths'
import { logger } from '@/lib/logger'

function getJobsDir() {
  return resolvePath('jobs')
}

export const runtime = 'nodejs'
export const revalidate = 0

type JobStatus = 'created' | 'queued' | 'running' | 'done' | 'failed'

interface Job {
  id: string
  backend: 'flux' | 'sdxl' | 'sd35' | 'svd'
  status: JobStatus
  input: any
  prompt: string
  params: any
  result?: {
    url?: string
    file?: string
    error?: string
  }
  createdAt: string
  startedAt?: string
  finishedAt?: string
  progress?: number
  logs: string[]
}

/**
 * POST /api/generate
 * Create generation job (FLUX, SDXL, SD3.5, SVD)
 * 
 * Request body:
 * {
 *   "backend": "flux" | "sdxl" | "sd35" | "svd",
 *   "prompt": "your prompt here",
 *   "params": { width, height, seed, steps, cfg, ... },
 *   "runNow": true  // optional, defaults to false
 * }
 * 
 * Returns:
 * {
 *   "success": true,
 *   "jobId": "uuid",
 *   "status": "created" | "queued",
 *   "message": "Job created, Worker will process it"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { backend, prompt, params, runNow = false } = body

    // Validate backend
    if (!backend || !['flux', 'sdxl', 'sd35', 'svd'].includes(backend)) {
      return NextResponse.json(
        { error: 'Invalid backend. Use: flux, sdxl, sd35, svd' },
        { status: 400 }
      )
    }

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be non-empty string' },
        { status: 400 }
      )
    }

    // Ensure jobs directory exists
    const jobsDir = getJobsDir()
    if (!existsSync(jobsDir)) {
      await mkdir(jobsDir, { recursive: true })
    }

    // Create job object
    const jobId = randomUUID()
    const job: Job = {
      id: jobId,
      backend,
      status: runNow ? 'queued' : 'created',
      input: body,
      prompt: prompt.trim(),
      params: params || {},
      createdAt: new Date().toISOString(),
      logs: [`Job created with backend: ${backend}`]
    }

    // Write job file (Worker picks it up within 2 seconds)
    const jobPath = join(jobsDir, `${jobId}.json`)
    await writeFile(jobPath, JSON.stringify(job, null, 2))

    logger.info({
      message: 'Job created',
      jobId,
      backend,
      status: job.status
    })

    return NextResponse.json({
      success: true,
      jobId,
      status: job.status,
      message: 'Job created, Worker will process it within 2 seconds'
    })

  } catch (error: any) {
    logger.error({
      message: 'Generate API error',
      error: error.message,
      stack: error.stack,
      url: request.url
    })
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ALL execution logic moved to Worker (services/worker/src/index.ts)
// This API file is now CLEAN — only creates job files
