import { NextResponse } from 'next/server'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const revalidate = 0

type PathsConfig = { dropOut?: string }
const CONFIG_FILENAME = 'paths.json'
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4'])

function findConfig(startDir: string, filename: string): string | null {
  let dir = startDir
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, filename)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '30')))

  const cwd = process.cwd()
  const configPath = findConfig(cwd, CONFIG_FILENAME)
  if (!configPath) {
    return NextResponse.json({ items: [], total: 0, page, limit, guardStatus: `paths.json not found (searched from ${cwd})` })
  }

  const raw = await fsp.readFile(configPath, 'utf8').catch(() => '')
  if (!raw) {
    return NextResponse.json({ items: [], total: 0, page, limit, guardStatus: `paths.json empty at ${configPath}` })
  }

  let cfg: PathsConfig = {}
  try { cfg = JSON.parse(raw) as PathsConfig } catch { return NextResponse.json({ items: [], total: 0, page, limit, guardStatus: 'Invalid JSON in paths.json' }) }

  const baseDir = typeof cfg.dropOut === 'string' ? cfg.dropOut : ''
  if (!baseDir || !fs.existsSync(baseDir)) {
    return NextResponse.json({ items: [], total: 0, page, limit, guardStatus: `dropOut not found: ${baseDir}` })
  }

  const entries = await fsp.readdir(baseDir, { withFileTypes: true }).catch(() => [])
  const files = entries.filter(e => e.isFile())
  const itemsPromises = files.map(async (e) => {
    const name = e.name
    const ext = path.extname(name).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) return null
    const abs = path.join(baseDir, name)
    const st = await fsp.stat(abs).catch(() => null)
    if (!st) return null
    return {
      name,
      ext,
      size: st.size,
      mtimeMs: st.mtimeMs,
      url: `/api/canvas/file?p=${encodeURIComponent(name)}`,
    }
  })
  const all = (await Promise.all(itemsPromises)).filter(Boolean) as any[]

  const total = all.length
  const start = (page - 1) * limit
  const slice = start >= 0 ? all.slice(start, start + limit) : all.slice(0, limit)

  return NextResponse.json({ items: slice, total, page, limit, guardStatus: `cwd=${cwd}; config=${configPath}; base=${baseDir}` })
}
