/**
 * Generation API — FLUX Ultra + ComfyUI (SDXL/SD3.5/SVD)
 * 
 * Main endpoint for image/video generation with job queue system
 * @see https://docs.bfl.ai/api-reference/tasks/generate-an-image-with-flux-11-%5Bpro%5D-with-ultra-mode-and-optional-raw-mode
 * @see https://www.viewcomfy.com/blog/building-a-production-ready-comfyui-api
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const JOBS_DIR = 'C:\\Work\\Orchestrator\\jobs'
const OUT_DIR = 'F:\\Drop\\out'

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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { backend, prompt, params, runNow = false } = body

    if (!backend || !['flux', 'sdxl', 'sd35', 'svd'].includes(backend)) {
      return NextResponse.json(
        { error: 'Invalid backend. Use: flux, sdxl, sd35, svd' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Create jobs directory if not exists
    if (!existsSync(JOBS_DIR)) {
      await mkdir(JOBS_DIR, { recursive: true })
    }

    // Create job
    const jobId = randomUUID()
    const job: Job = {
      id: jobId,
      backend,
      status: runNow ? 'queued' : 'created',
      input: body,
      prompt,
      params: params || {},
      createdAt: new Date().toISOString(),
      logs: [`Job created with backend: ${backend}`]
    }

    // Save job to disk
    const jobPath = join(JOBS_DIR, `${jobId}.json`)
    await writeFile(jobPath, JSON.stringify(job, null, 2))

    // If runNow, execute immediately (otherwise just queue it)
    if (runNow) {
      // Execute in background without blocking response
      executeJob(job).catch(err => {
        console.error(`Job ${jobId} failed:`, err)
      })
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: job.status,
      message: runNow ? 'Job queued for execution' : 'Job created'
    })
  } catch (error: any) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Execute job based on backend
 */
async function executeJob(job: Job) {
  const jobPath = join(JOBS_DIR, `${job.id}.json`)
  
  try {
    // Update status to running
    job.status = 'running'
    job.startedAt = new Date().toISOString()
    job.logs.push('Job execution started')
    await writeFile(jobPath, JSON.stringify(job, null, 2))

    switch (job.backend) {
      case 'flux':
        await executeFlux(job)
        break
      case 'sdxl':
      case 'sd35':
      case 'svd':
        await executeComfyUI(job)
        break
    }

    // Mark as done
    job.status = 'done'
    job.finishedAt = new Date().toISOString()
    job.logs.push('Job completed successfully')
    await writeFile(jobPath, JSON.stringify(job, null, 2))
  } catch (error: any) {
    // Mark as failed
    job.status = 'failed'
    job.finishedAt = new Date().toISOString()
    job.result = { error: error.message }
    job.logs.push(`Error: ${error.message}`)
    await writeFile(jobPath, JSON.stringify(job, null, 2))
  }
}

/**
 * Execute FLUX generation
 * @see https://docs.bfl.ai/api-reference/tasks/generate-an-image-with-flux-11-%5Bpro%5D-with-ultra-mode-and-optional-raw-mode
 */
async function executeFlux(job: Job) {
  const BFL_API_KEY = process.env.BFL_API_KEY
  if (!BFL_API_KEY) {
    throw new Error('BFL_API_KEY not configured')
  }

  job.logs.push('Calling FLUX 1.1 Pro Ultra API...')

  const requestBody: any = {
    prompt: job.prompt,
    output_format: 'jpeg',
    aspect_ratio: job.params.aspectRatio || '16:9',
    raw: job.params.raw || false
  }

  if (job.params.seed) requestBody.seed = job.params.seed
  if (job.params.imagePrompt) {
    requestBody.image_prompt = job.params.imagePrompt // base64
    requestBody.image_prompt_strength = job.params.imagePromptStrength || 0.5
  }

  // POST to FLUX API
  const response = await fetch('https://api.bfl.ai/v1/flux-pro-1.1-ultra', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': BFL_API_KEY
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FLUX API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const { id: taskId, polling_url } = data

  job.logs.push(`FLUX task created: ${taskId}`)
  job.logs.push(`Polling URL: ${polling_url}`)

  // Poll for result
  let attempts = 0
  const maxAttempts = 60 // 5 minutes (5s interval)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s
    attempts++

    const pollResponse = await fetch(polling_url, {
      headers: { 'X-Key': BFL_API_KEY }
    })

    if (!pollResponse.ok) {
      throw new Error(`Polling failed: ${pollResponse.status}`)
    }

    const pollData = await pollResponse.json()
    job.logs.push(`Poll attempt ${attempts}: ${pollData.status}`)

    if (pollData.status === 'Ready') {
      // Download result
      const imageUrl = pollData.result.sample
      job.logs.push(`Downloading result from ${imageUrl}`)

      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      
      // Save to F:\Drop\out
      const filename = `flux_${job.id}.jpg`
      const outputPath = join(OUT_DIR, filename)
      await writeFile(outputPath, Buffer.from(imageBuffer))

      job.result = {
        file: outputPath,
        url: imageUrl
      }
      job.logs.push(`Saved to: ${outputPath}`)
      return
    }

    if (pollData.status === 'Error') {
      throw new Error(pollData.error || 'FLUX generation failed')
    }
  }

  throw new Error('FLUX generation timeout (5 minutes)')
}

/**
 * Execute ComfyUI workflow (SDXL/SD3.5/SVD)
 * @see https://www.viewcomfy.com/blog/building-a-production-ready-comfyui-api
 */
async function executeComfyUI(job: Job) {
  const COMFYUI_URL = 'http://127.0.0.1:8188'
  
  job.logs.push(`Calling ComfyUI API (${job.backend})...`)

  // Load workflow JSON based on backend
  const workflowPath = `F:\\Workflows\\${job.backend}-i2i.json`
  const workflow = require(workflowPath)

  // Inject prompt and params into workflow
  // (This is simplified — actual implementation would need to parse workflow nodes)
  // TODO: Implement proper workflow node injection

  // POST /prompt
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  })

  if (!response.ok) {
    throw new Error(`ComfyUI API error: ${response.status}`)
  }

  const data = await response.json()
  const { prompt_id } = data

  job.logs.push(`ComfyUI prompt ID: ${prompt_id}`)

  // Poll /history for result
  let attempts = 0
  const maxAttempts = 120 // 10 minutes

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++

    const historyResponse = await fetch(`${COMFYUI_URL}/history/${prompt_id}`)
    const historyData = await historyResponse.json()

    if (historyData[prompt_id]?.status?.completed) {
      job.logs.push('ComfyUI generation completed')
      
      // Extract output filename from history
      // (Simplified — actual parsing depends on workflow structure)
      const outputs = historyData[prompt_id].outputs as any
      const firstOutput = Object.values(outputs)[0] as any
      const filename = firstOutput?.images?.[0]?.filename

      if (filename) {
        job.result = {
          file: join(OUT_DIR, filename)
        }
        job.logs.push(`Result: ${filename}`)
      }
      return
    }

    job.progress = (attempts / maxAttempts) * 100
  }

  throw new Error('ComfyUI generation timeout (10 minutes)')
}
