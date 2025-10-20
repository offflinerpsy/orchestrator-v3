import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import pino from 'pino'

type JobStatus = 'created' | 'queued' | 'running' | 'done' | 'failed'
type Backend = 'flux' | 'sdxl' | 'sd35' | 'svd'

interface Job {
  id: string
  backend: Backend
  status: JobStatus
  input: any
  prompt: string
  params: Record<string, any>
  result?: Record<string, any>
  createdAt: string
  startedAt?: string
  finishedAt?: string
  progress?: number
  logs: string[]
}

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

interface PathsConfig { projectRoot: string; comfyRoot: string; modelsRoot: string; hfCache: string; dropIn: string; dropOut: string; workflows: string; logs: string; data: string; jobs?: string }

function getPaths(): PathsConfig {
  try {
    const root = process.cwd()
    const p = join(root, 'paths.json')
    const text = require('fs').readFileSync(p, 'utf-8')
    const json = JSON.parse(text)
    return json
  } catch {
    const projectRoot = 'C:\\Work\\Orchestrator'
    return {
      projectRoot,
      comfyRoot: 'F:\\ComfyUI',
      modelsRoot: 'F:\\Models',
      hfCache: 'F:\\Cache\\HF',
      dropIn: 'F:\\Drop\\in',
      dropOut: 'F:\\Drop\\out',
      workflows: 'F:\\Workflows',
      logs: join(projectRoot, 'logs'),
      data: join(projectRoot, 'data'),
      jobs: join(projectRoot, 'jobs')
    }
  }
}

function getJobsDir() {
  const paths = getPaths()
  return paths.jobs || join(getPaths().projectRoot, 'jobs')
}

async function listJobFiles(): Promise<string[]> {
  const dir = getJobsDir()
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  return files.filter(f => f.endsWith('.json')).map(f => join(dir, f))
}

async function loadJob(path: string): Promise<Job> {
  const text = await readFile(path, 'utf-8')
  return JSON.parse(text)
}

async function saveJob(job: Job) {
  const path = join(getJobsDir(), `${job.id}.json`)
  await writeFile(path, JSON.stringify(job, null, 2))
}

// ---------- env fallback loader ----------
function loadEnvFromLocalFiles() {
  try {
    const root = 'C\\Work\\Orchestrator'
    const candidates = [
      join(root, '.env.local'),
      join(root, 'apps', 'admin', '.env.local')
    ]
    for (const p of candidates) {
      try {
        const txt = require('fs').readFileSync(p, 'utf-8')
        for (const line of txt.split(/\r?\n/)) {
          const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
          if (!m) continue
          const key = m[1]
          let val = m[2]
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (!process.env[key]) process.env[key] = val
        }
      } catch {}
    }
  } catch {}
}

// ---------- FLUX minimal client ----------
const FLUX_API_URL = 'https://api.bfl.ai/v1'

async function fluxGenerate(prompt: string, params: any): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  if (!process.env.BFL_API_KEY) loadEnvFromLocalFiles()
  const apiKey = process.env.BFL_API_KEY
  if (!apiKey) return { ok: false, error: 'BFL_API_KEY not set' }
  const body: any = {
    prompt,
    output_format: 'jpeg',
    aspect_ratio: params?.aspectRatio || '16:9',
    raw: params?.raw ?? false,
  }
  if (params?.seed !== undefined) body.seed = params.seed
  if (params?.image_prompt) {
    body.image_prompt = params.image_prompt
    body.image_prompt_strength = params.image_prompt_strength ?? 0.5
  }
  const r = await fetch(`${FLUX_API_URL}/flux-pro-1.1-ultra`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Key': apiKey }, body: JSON.stringify(body)
  })
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}: ${await r.text()}` }
  const data: any = await r.json()
  return { ok: true, taskId: data.id }
}

async function fluxPoll(taskId: string): Promise<{ status: string; imageUrl?: string; error?: string }> {
  const apiKey = process.env.BFL_API_KEY
  const r = await fetch(`${FLUX_API_URL}/get_result?id=${taskId}`, { headers: { 'X-Key': apiKey! } })
  if (!r.ok) return { status: 'Error', error: `HTTP ${r.status}` }
  const data: any = await r.json()
  if (data.status === 'Ready') return { status: 'Ready', imageUrl: data.result?.sample }
  if (data.status === 'Error') return { status: 'Error', error: data.error || 'Error' }
  return { status: data.status }
}

// ---------- ComfyUI minimal client ----------
function getComfyUrl() { return process.env.COMFY_URL || 'http://127.0.0.1:8188' }
function getWorkflowsDir() { return getPaths().workflows }
async function ensureDir(dir: string) { if (!existsSync(dir)) await mkdir(dir, { recursive: true }) }

async function ensureDummyImage(): Promise<string> {
  const p = getPaths()
  const inDir = p.dropIn
  await ensureDir(inDir)
  const file = join(inDir, 'dummy.png')
  if (!existsSync(file)) {
    // 1x1 transparent PNG
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/WW9D8kAAAAASUVORK5CYII='
    const buf = Buffer.from(base64, 'base64')
    await writeFile(file, buf)
  }
  return file
}

async function comfySubmit(workflow: any): Promise<{ ok: boolean; promptId?: string; error?: string }> {
  const r = await fetch(`${getComfyUrl()}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow }) })
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}: ${await r.text()}` }
  const data: any = await r.json()
  return { ok: true, promptId: data.prompt_id }
}

async function comfyHistory(promptId: string): Promise<any> {
  const r = await fetch(`${getComfyUrl()}/history/${promptId}`)
  if (!r.ok) return null
  return r.json()
}

async function comfyGetAllowedSamplers(): Promise<string[] | null> {
  try {
    const r = await fetch(`${getComfyUrl()}/object_info/KSampler`)
    if (!r.ok) return null
    const data: any = await r.json()
    const list = data?.KSampler?.input?.required?.sampler_name
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0]
      return Array.isArray(first) ? first : list
    }
    return null
  } catch { return null }
}

async function comfyGetAllowedCheckpoints(): Promise<string[] | null> {
  try {
    const r = await fetch(`${getComfyUrl()}/object_info/CheckpointLoaderSimple`)
    if (!r.ok) return null
    const data: any = await r.json()
    const list = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0]
      return Array.isArray(first) ? first : list
    }
    return null
  } catch { return null }
}

function normalizeWorkflow(workflow: any) {
  // replace euler_a -> euler where needed
  const fix = (node: any) => {
    if (node?.class_type === 'KSampler' && node?.inputs) {
      if (node.inputs.sampler_name === 'euler_a') node.inputs.sampler_name = 'euler'
    }
  }
  Object.keys(workflow).forEach(id => fix((workflow as any)[id]))
}

async function buildComfyWorkflow(prompt: string, backend: Backend): Promise<any> {
  const wfName = backend === 'sdxl' ? 'sdxl-i2i' : backend === 'sd35' ? 'sd35-i2i' : 'svd-i2v'
  const wfPath = join(getWorkflowsDir(), `${wfName}.json`)
  const wfText = await readFile(wfPath, 'utf-8')
  const wf = JSON.parse(wfText)

  // inject prompt for typical node titles
  for (const [, node] of Object.entries<any>(wf)) {
    if (node.class_type === 'CLIPTextEncode' && (node._meta?.title?.toLowerCase().includes('positive') || node.inputs?.text === 'PLACEHOLDER_POSITIVE')) {
      node.inputs.text = prompt
    }
    // If workflow is i2i and requires image, inject dummy
    if (node.class_type === 'LoadImage' && (!node.inputs?.image || typeof node.inputs.image !== 'string' || node.inputs.image.trim() === '')) {
      const dummy = await ensureDummyImage()
      node.inputs.image = dummy
    }
  }
  // normalize sampler
  normalizeWorkflow(wf)
  const allowed = await comfyGetAllowedSamplers()
  if (Array.isArray(allowed) && !allowed.includes((wf['3']?.inputs?.sampler_name) as any)) {
    ;(wf['3'] = wf['3'] || { inputs: {} }).inputs.sampler_name = allowed.includes('euler') ? 'euler' : allowed[0]
  }
  // ensure checkpoint exists AND force SD 1.5 (sd3.5/sdxl corrupted)
  const ckpts = await comfyGetAllowedCheckpoints()
  if (Array.isArray(ckpts) && ckpts.length > 0) {
    // Prefer SD 1.5 (v1-5-pruned-emaonly) — sdxl/sd3.5 corrupted (SafetensorError)
    const preferred = ckpts.find(c => c.includes('v1-5') || c.includes('v1_5')) || ckpts[0]
    for (const [, node] of Object.entries<any>(wf)) {
      if (node.class_type === 'CheckpointLoaderSimple' && node.inputs) {
        node.inputs.ckpt_name = preferred
      }
    }
  }
  return wf
}

async function execute(job: Job) {
  job.status = 'running'
  job.startedAt = new Date().toISOString()
  job.logs.push('[worker] start execution')
  await saveJob(job)

  try {
    if (job.backend === 'flux') {
      const gen = await fluxGenerate(job.prompt, job.params)
      if (!gen.ok) throw new Error(gen.error)
      // poll for result and save
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const pol = await fluxPoll(gen.taskId!)
        if (pol.status === 'Ready') {
          const imageUrl = pol.imageUrl!
          const dropOut = getPaths().dropOut
          await ensureDir(dropOut)
          const res = await fetch(imageUrl)
          const buf = Buffer.from(await res.arrayBuffer())
          const outPath = join(dropOut, `flux_${job.id}.jpg`)
          await writeFile(outPath, buf)
          job.result = { file: outPath }
          break
        }
        if (pol.status === 'Error') throw new Error(pol.error)
      }
      if (!job.result?.file) throw new Error('flux timeout')
    } else {
      job.logs.push('[worker] comfy build workflow...')
      await saveJob(job)
      const wf = await buildComfyWorkflow(job.prompt, job.backend)
      job.logs.push('[worker] comfy submit...')
      await saveJob(job)
      const submit = await comfySubmit(wf)
      if (!submit.ok) throw new Error(submit.error)
      const promptId = submit.promptId!
      job.logs.push(`[worker] comfy promptId: ${promptId}`)
      await saveJob(job)

      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const hist: any = await comfyHistory(promptId)
        if (!hist) continue
        const entry = hist[promptId]
        if (entry?.status?.status_str === 'error') {
          const errMsg = (entry?.status?.messages||[]).find((m:any)=>m[0]==='execution_error')?.[1]?.exception_message || 'Comfy error'
          throw new Error(errMsg)
        }
        if (entry?.status?.completed) {
          const outputs = entry.outputs || {}
          for (const output of Object.values<any>(outputs)) {
            if (output?.images?.length > 0) {
              const img = output.images[0]
              const filename = img.filename
              const subfolder = img.subfolder || ''
              const dropOut = getPaths().dropOut
              await ensureDir(dropOut)
              const url = `${getComfyUrl()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`
              const res = await fetch(url)
              if (!res.ok) throw new Error(`download failed: ${res.status}`)
              const buf = Buffer.from(await res.arrayBuffer())
              const outPath = join(dropOut, filename)
              await writeFile(outPath, buf)
              job.result = { file: outPath }
              job.logs.push(`[worker] comfy saved: ${outPath}`)
              break
            }
          }
          break
        }
        if (i % 6 === 0) { job.logs.push('[worker] comfy polling...'); await saveJob(job) }
      }
      if (!job.result?.file) throw new Error('comfy timeout or no outputs')
    }
    job.status = 'done'
    job.finishedAt = new Date().toISOString()
    job.logs.push('[worker] completed')
  } catch (e: any) {
    job.status = 'failed'
    job.finishedAt = new Date().toISOString()
    job.result = { error: e?.message || String(e) }
    job.logs.push(`[worker] error: ${job.result.error}`)
  }
  await saveJob(job)
}

async function main() {
  logger.info('Worker starting...')
  while (true) {
    try {
      const files = await listJobFiles()
      logger.info({ msg: 'scan', files: files.length, dir: getJobsDir() })
      for (const file of files) {
        const job = await loadJob(file)
        logger.info({ msg: 'found job', id: job.id, status: job.status, backend: job.backend })
        if (job.status === 'created' || job.status === 'queued') {
          await execute(job)
        }
      }
    } catch (e: any) {
      logger.error({ msg: 'loop error', error: e?.message })
    }
    await new Promise(r => setTimeout(r, 2000))
  }
}

main().catch(err => {
  logger.fatal(err)
  process.exit(1)
})


