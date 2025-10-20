/**
 * Jobs API — List, retrieve, update, delete generation jobs
 * GET /api/jobs - List all jobs
 * GET /api/jobs?id=... - Get specific job
 * PATCH /api/jobs?id=... - Update job (e.g., retry)
 * DELETE /api/jobs?id=... - Delete job
 */

import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const revalidate = 0

const JOBS_DIR = 'C:\\Work\\Orchestrator\\jobs'

/**
 * GET /api/jobs - List all jobs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')

  // Get specific job
  if (jobId) {
    return getJobById(jobId)
  }

  // List all jobs
  try {
    if (!existsSync(JOBS_DIR)) {
      return NextResponse.json({ jobs: [] })
    }

    const files = await readdir(JOBS_DIR)
    const jobFiles = files.filter(f => f.endsWith('.json'))

    const jobs = await Promise.all(
      jobFiles.map(async (file) => {
        const content = await readFile(join(JOBS_DIR, file), 'utf-8')
        return JSON.parse(content)
      })
    )

    // Sort by creation date (newest first)
    jobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ jobs })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get job by ID
 */
async function getJobById(jobId: string) {
  try {
    const jobPath = join(JOBS_DIR, `${jobId}.json`)
    
    if (!existsSync(jobPath)) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const content = await readFile(jobPath, 'utf-8')
    const job = JSON.parse(content)

    return NextResponse.json({ job })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/jobs?id=... - Update job status (e.g., retry)
 */
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }

  try {
    const jobPath = join(JOBS_DIR, `${jobId}.json`)
    
    if (!existsSync(jobPath)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const content = await readFile(jobPath, 'utf-8')
    const job = JSON.parse(content)

    const body = await request.json()

    // Update status (e.g., retry failed job)
    if (body.status) {
      job.status = body.status
      job.logs = job.logs || []
      job.logs.push(`[${new Date().toISOString()}] Status changed to: ${body.status}`)

      // Reset error on retry
      if (body.status === 'queued' && job.error) {
        delete job.error
      }

      await writeFile(jobPath, JSON.stringify(job, null, 2))
    }

    return NextResponse.json({ success: true, job })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/jobs?id=... - Delete job
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }

  try {
    const jobPath = join(JOBS_DIR, `${jobId}.json`)
    
    if (!existsSync(jobPath)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await unlink(jobPath)

    return NextResponse.json({ success: true, message: 'Job deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
