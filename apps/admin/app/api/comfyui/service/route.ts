import { NextResponse } from 'next/server'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export const runtime = 'nodejs'
export const revalidate = 0

function json(data: any, status = 200) { return NextResponse.json(data, { status }) }

export async function GET() {
  return json({ ok: true })
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (!isJson) return json({ success: false, message: 'Content-Type must be application/json' }, 400)

  const body = await request.json().catch(() => ({})) as { action?: string }
  const action = (body?.action || '').toLowerCase()
  if (!action) return json({ success: false, message: 'Missing action' }, 400)

  // Only Windows supported here (local dev environment)
  if (os.platform() !== 'win32') return json({ success: false, message: 'Service control supported only on Windows' }, 400)

  const comfyRoot = 'F:/ComfyUI'
  const gpuBat = path.join(comfyRoot, 'run_nvidia_gpu.bat')
  const cpuBat = path.join(comfyRoot, 'run_cpu.bat')

  if (action === 'start') {
    const candidate = fs.existsSync(gpuBat) ? gpuBat : (fs.existsSync(cpuBat) ? cpuBat : '')
    if (!candidate) return json({ success: false, message: 'No start script found (run_nvidia_gpu.bat or run_cpu.bat)' }, 404)

    // Start detached process via cmd to open its own window, avoid blocking
    const child = spawn('cmd.exe', ['/c', 'start', '""', candidate], {
      cwd: comfyRoot,
      detached: true,
      windowsHide: false,
      stdio: 'ignore',
    })
    child.unref()
    return json({ success: true, message: `Started: ${path.basename(candidate)}` })
  }

  if (action === 'stop') {
    // Not implemented: safe stopping requires tracking PID; return soft message
    return json({ success: false, message: 'Stop not implemented. Close ComfyUI window manually.' }, 501)
  }

  return json({ success: false, message: `Unknown action: ${action}` }, 400)
}
