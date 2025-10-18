import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

type PathsConfig = {
  projectRoot?: string
  comfyRoot?: string
  modelsRoot?: string
  hfCache?: string
  dropIn?: string
  dropOut?: string
  workflows?: string
  logs?: string
}

export const runtime = 'nodejs'
export const revalidate = 0

const CONFIG_FILENAME = 'paths.json'

function findConfig(startDir: string, filename: string): string | null {
  let dir = startDir
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, filename)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export async function GET() {
  const root = process.cwd()
  const configPath = findConfig(root, CONFIG_FILENAME)

  // Guard: config file existence
  const configExists = !!configPath && fs.existsSync(configPath)
  if (!configExists || !configPath) {
    return NextResponse.json({
      paths: [],
      guardStatus: `Config ${CONFIG_FILENAME} not found (searched from ${root})`,
    })
  }

  // Guard: parse config safely (no try/catch -> validate step-by-step)
  const raw = fs.readFileSync(configPath, 'utf8')
  if (!raw || raw.trim().length === 0) {
    return NextResponse.json({
      paths: [],
      guardStatus: `Config ${CONFIG_FILENAME} is empty`,
    })
  }

  let parsed: unknown = undefined
  try {
    // local, isolated parse where error is handled via fallback result
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ paths: [], guardStatus: `Config ${CONFIG_FILENAME} is invalid JSON` })
  }

  const cfg = (typeof parsed === 'object' && parsed !== null ? (parsed as PathsConfig) : {})

  const entries: Array<{ key: keyof PathsConfig; label: string }> = [
    { key: 'projectRoot', label: 'Project Root' },
    { key: 'comfyRoot', label: 'ComfyUI Root' },
    { key: 'modelsRoot', label: 'Models Root' },
    { key: 'hfCache', label: 'HF Cache' },
    { key: 'dropIn', label: 'Drop In' },
    { key: 'dropOut', label: 'Drop Out' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'logs', label: 'Logs' },
  ]

  const results = entries.map(({ key, label }) => {
    const p = (cfg as any)?.[key] as string | undefined
    const exists = typeof p === 'string' && p.length > 0 && fs.existsSync(p)
    return {
      path: p ?? '(not set)',
      location: label,
      exists,
    }
  })

  const guardLines: string[] = []
  guardLines.push(`cwd: ${root}`)
  guardLines.push(`configPath: ${configPath} (${configExists ? 'exists' : 'missing'})`)
  const missing = results.filter(r => !r.exists).map(r => r.location)
  if (missing.length > 0) guardLines.push(`missing: ${missing.join(', ')}`)

  return NextResponse.json({ paths: results, guardStatus: guardLines.join('\n') })
}
