import { NextResponse } from 'next/server'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

type PathsConfig = { dropOut?: string }
const CONFIG_FILENAME = 'paths.json'
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
}

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
  const name = url.searchParams.get('p') || ''
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const cwd = process.cwd()
  const configPath = findConfig(cwd, CONFIG_FILENAME)
  if (!configPath) return new NextResponse('Not Found', { status: 404 })
  const raw = await fsp.readFile(configPath, 'utf8').catch(() => '')
  if (!raw) return new NextResponse('Not Found', { status: 404 })

  let cfg: PathsConfig = {}
  try { cfg = JSON.parse(raw) as PathsConfig } catch { return new NextResponse('Not Found', { status: 404 }) }
  const baseDir = typeof cfg.dropOut === 'string' ? cfg.dropOut : ''
  if (!baseDir || !fs.existsSync(baseDir)) return new NextResponse('Not Found', { status: 404 })

  const abs = path.join(baseDir, name)
  if (!fs.existsSync(abs)) return new NextResponse('Not Found', { status: 404 })
  const ext = path.extname(abs).toLowerCase()
  const contentType = MIME[ext] || 'application/octet-stream'
  const file = await fsp.readFile(abs)
  return new NextResponse(new Uint8Array(file), { status: 200, headers: { 'Content-Type': contentType } })
}
