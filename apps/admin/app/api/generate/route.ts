/**
 * Generation API — FLUX Ultra + ComfyUI (SDXL/SD3.5/SVD)
 * 
 * Main endpoint for image/video generation with job queue system
 * @see https://docs.bfl.ai/api-reference/tasks/generate-an-image-with-flux-11-%5Bpro%5D-with-ultra-mode-and-optional-raw-mode
 * @see https://www.viewcomfy.com/blog/building-a-production-ready-comfyui-api
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { resolvePath } from '@/lib/paths'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

// Lazy evaluation — resolve paths on first use
function getJobsDir() {
  return resolvePath('jobs')
}

function getOutDir() {
  return resolvePath('dropOut')
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
    const jobsDir = getJobsDir()
    if (!existsSync(jobsDir)) {
      await mkdir(jobsDir, { recursive: true })
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
    const jobPath = join(jobsDir, `${jobId}.json`)
    await writeFile(jobPath, JSON.stringify(job, null, 2))

    // If runNow, execute immediately (otherwise just queue it)
    if (runNow) {
      // Execute in background without blocking response
      executeJob(job).catch(err => {
        logger.error({
          message: 'Job execution failed',
          jobId,
          backend,
          error: err.message,
          stack: err.stack
        })
      })
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: job.status,
      message: runNow ? 'Job queued for execution' : 'Job created'
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

/**
 * Execute job based on backend
 */
async function executeJob(job: Job) {
  const jobsDir = getJobsDir()
  const jobPath = join(jobsDir, `${job.id}.json`)
  
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
  // Импорт client для прямого вызова (БЕЗ HTTP)
  const { generateFlux, pollFlux } = await import('@/lib/flux-client')

  job.logs.push('Calling FLUX 1.1 Pro Ultra API (прямой вызов)...')

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

  // Прямой вызов FLUX API через lib/flux-client.ts (НЕ через HTTP fetch)
  const data = await generateFlux(requestBody)
  const taskId = data.id

  job.logs.push(`FLUX task created: ${taskId}`)

  // Poll for result (прямой вызов через lib/flux-client.ts)
  let attempts = 0
  const maxAttempts = 60 // 5 minutes (5s interval)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s
    attempts++

    const pollData = await pollFlux(taskId)
    job.logs.push(`Poll attempt ${attempts}: ${pollData.status}`)

    if (pollData.status === 'Ready') {
      // Download result
      const imageUrl = pollData.result!.sample
      job.logs.push(`Downloading result from ${imageUrl}`)

      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      
      // Save to dropOut directory
      const outDir = getOutDir()
      await ensureDir(outDir)
      const filename = `flux_${job.id}.jpg`
      const outputPath = join(outDir, filename)
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
  // Импорт client для прямого вызова (БЕЗ HTTP)
  const { submitPrompt, getHistory } = await import('@/lib/comfy-client')
  
  job.logs.push(`Calling ComfyUI API (${job.backend}) — прямой вызов...`)
  await persistJob(job)

  // Load workflow JSON based on backend
  const workflowsDir = getWorkflowsDir()
  const workflowPath = join(workflowsDir, `${job.backend}-i2i.json`)
  
  if (!existsSync(workflowPath)) {
    throw new Error(`Workflow not found: ${workflowPath}`)
  }

  const workflowText = await readFile(workflowPath, 'utf-8')
  const workflow = JSON.parse(workflowText)

  // Inject prompt into workflow (replace PLACEHOLDER_POSITIVE)
  if (workflow['75']?.inputs?.text === 'PLACEHOLDER_POSITIVE') {
    workflow['75'].inputs.text = job.prompt
  }

  // Inject parameters into workflow
  if (workflow['3']?.inputs) {
    // Seed
    if (job.params.seed !== undefined) {
      workflow['3'].inputs.seed = Number(job.params.seed)
    }
    // Steps
    if (job.params.steps !== undefined) {
      workflow['3'].inputs.steps = Math.min(150, Math.max(1, Number(job.params.steps)))
    }
    // CFG
    if (job.params.cfg !== undefined) {
      workflow['3'].inputs.cfg = Math.min(30, Math.max(0, Number(job.params.cfg)))
    }

    // Validate sampler_name against ComfyUI object_info and auto-fix
    try {
      const allowedSamplers = await getAllowedSamplerNames()
      const preferred = 'euler'
      const fixSampler = (inputsObj: any) => {
        const currentSampler = inputsObj.sampler_name
        if (Array.isArray(allowedSamplers) && allowedSamplers.length > 0) {
          const fallback = allowedSamplers.includes(preferred) ? preferred : allowedSamplers[0]
          if (!currentSampler || !allowedSamplers.includes(currentSampler)) {
            job.logs.push(`Sampler set: ${currentSampler || '(none)'} -> ${fallback}`)
            inputsObj.sampler_name = fallback
          }
        } else {
          inputsObj.sampler_name = preferred
        }
        // Force replace euler_a -> euler as last resort
        if (inputsObj.sampler_name === 'euler_a') {
          job.logs.push(`Replacing disallowed sampler 'euler_a' -> 'euler'`)
          inputsObj.sampler_name = 'euler'
        }
      }
      fixSampler(workflow['3'].inputs)
    } catch (e: any) {
      job.logs.push(`Sampler validation error: ${e?.message || 'unknown error'}. Forcing sampler_name='euler'`)
      workflow['3'].inputs.sampler_name = 'euler'
    }
  }
  // As an additional safety, if some other node id is KSampler, normalize it too
  Object.keys(workflow).forEach((nodeId) => {
    const node = (workflow as any)[nodeId]
    if (node?.class_type === 'KSampler' && node?.inputs) {
      if (node.inputs.sampler_name === 'euler_a') {
        node.inputs.sampler_name = 'euler'
      }
    }
  })

  // Inject size into EmptyLatentImage node
  if (workflow['68']?.inputs) {
    if (job.params.width !== undefined) {
      workflow['68'].inputs.width = Math.min(2048, Math.max(256, Number(job.params.width)))
    }
    if (job.params.height !== undefined) {
      workflow['68'].inputs.height = Math.min(2048, Math.max(256, Number(job.params.height)))
    }
  }

  job.logs.push(`Workflow loaded: ${Object.keys(workflow).length} nodes`)
  await persistJob(job)

  // Прямой вызов ComfyUI API через lib/comfy-client.ts (НЕ через HTTP fetch)
  job.logs.push(`KSampler[3].sampler_name before submit: ${workflow['3']?.inputs?.sampler_name}`)
  // Final safety: normalize any 'euler_a' across all KSampler nodes to 'euler'
  Object.keys(workflow).forEach((nodeId) => {
    const node = (workflow as any)[nodeId]
    if (node?.class_type === 'KSampler' && node?.inputs?.sampler_name === 'euler_a') {
      node.inputs.sampler_name = 'euler'
    }
  })
  job.logs.push(`KSampler[3].sampler_name after normalize: ${workflow['3']?.inputs?.sampler_name}`)
  const data = await submitPrompt({ prompt: workflow })
  const { prompt_id } = data

  job.logs.push(`ComfyUI prompt ID: ${prompt_id}`)
  await persistJob(job)

  // Poll /history for result (прямой вызов через lib/comfy-client.ts)
  let attempts = 0
  const maxAttempts = 120 // 10 minutes

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++

    const historyData = await getHistory(prompt_id)

    if (historyData[prompt_id]?.status?.completed) {
      job.logs.push('ComfyUI generation completed')
      
      // Extract output filename from history
      // (Simplified — actual parsing depends on workflow structure)
      const outputs = historyData[prompt_id].outputs as any
      const firstOutput = Object.values(outputs)[0] as any
      const filename = firstOutput?.images?.[0]?.filename

      if (filename) {
        // Download from Comfy view and save into dropOut
        const outDir = getOutDir()
        await ensureDir(outDir)
        const ext = filename.split('.').pop() || 'png'
        const outputPath = join(outDir, `comfy_${job.id}.${ext}`)
        const viewUrl = `${env.COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`
        const imageResponse = await fetch(viewUrl)
        if (!imageResponse.ok) {
          job.logs.push(`Failed to download from Comfy /view: HTTP ${imageResponse.status}`)
        } else {
          const buf = await imageResponse.arrayBuffer()
          await writeFile(outputPath, Buffer.from(buf))
          job.result = {
            file: outputPath
          }
          job.logs.push(`Saved to: ${outputPath}`)
        }
      }
      await persistJob(job)
      return
    }

    job.progress = (attempts / maxAttempts) * 100
    if (attempts % 6 === 0) {
      await persistJob(job)
    }
  }

  throw new Error('ComfyUI generation timeout (10 minutes)')
}

function getWorkflowsDir() {
  return resolvePath('workflows')
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function getAllowedSamplerNames(): Promise<string[] | null> {
  try {
    const r = await fetch(`${env.COMFY_URL}/object_info`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return null
    const data = await r.json()
    // KSampler.input.required.sampler_name -> [[ 'samplerA', ... ]] or similar
    const fromRequired = data?.KSampler?.input?.required?.sampler_name
    const fromOptional = data?.KSampler?.input?.optional?.sampler_name
    const pick = Array.isArray(fromRequired) ? fromRequired : (Array.isArray(fromOptional) ? fromOptional : null)
    if (Array.isArray(pick) && pick.length > 0) {
      const first = pick[0]
      return Array.isArray(first) ? first : pick
    }
    return null
  } catch {
    return null
  }
}

async function persistJob(job: Job) {
  try {
    const jobsDir = getJobsDir()
    const jobPath = join(jobsDir, `${job.id}.json`)
    await writeFile(jobPath, JSON.stringify(job, null, 2))
  } catch {}
}
