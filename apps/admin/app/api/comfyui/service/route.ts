/**
 * ComfyUI Service Control API
 * Start/Stop ComfyUI server and check status
 * @see https://www.viewcomfy.com/blog/building-a-production-ready-comfyui-api
 */

import { NextRequest, NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const COMFYUI_PATH = 'F:\\ComfyUI'
const COMFYUI_PORT = 8188
const COMFYUI_URL = `http://127.0.0.1:${COMFYUI_PORT}`

// Global process reference
let comfyProcess: ReturnType<typeof spawn> | null = null

/**
 * Check if ComfyUI is running by hitting /system_stats
 */
async function checkComfyUIStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * GET /api/comfyui/service - Check ComfyUI status
 */
export async function GET() {
  const isRunning = await checkComfyUIStatus()
  
  return NextResponse.json({
    status: isRunning ? 'online' : 'offline',
    url: COMFYUI_URL,
    port: COMFYUI_PORT,
    path: COMFYUI_PATH
  })
}

/**
 * POST /api/comfyui/service - Start/Stop ComfyUI
 */
export async function POST(request: NextRequest) {
  const { action } = await request.json()

  if (action === 'start') {
    // Check if already running
    const isRunning = await checkComfyUIStatus()
    if (isRunning) {
      return NextResponse.json({ 
        success: false, 
        message: 'ComfyUI is already running',
        url: COMFYUI_URL
      })
    }

    // Start ComfyUI process
    try {
      comfyProcess = spawn(
        'cmd.exe',
        ['/c', 'run_nvidia_gpu.bat'],
        {
          cwd: COMFYUI_PATH,
          detached: false,
          stdio: 'ignore'
        }
      )

      // Wait 5 seconds for startup
      await new Promise(resolve => setTimeout(resolve, 5000))

      const isOnline = await checkComfyUIStatus()
      
      if (isOnline) {
        return NextResponse.json({
          success: true,
          message: 'ComfyUI started successfully',
          url: COMFYUI_URL,
          pid: comfyProcess.pid
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'ComfyUI process started but not responding. Check F:\\ComfyUI\\comfyui.log'
        }, { status: 500 })
      }
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: `Failed to start ComfyUI: ${error.message}`
      }, { status: 500 })
    }
  }

  if (action === 'stop') {
    try {
      // Kill process by port on Windows
      if (process.platform === 'win32') {
        await execAsync(`powershell "Get-Process | Where-Object {$_.MainWindowTitle -like '*ComfyUI*'} | Stop-Process -Force"`)
      } else {
        // Linux/Mac
        await execAsync(`lsof -ti:${COMFYUI_PORT} | xargs kill -9`)
      }

      if (comfyProcess) {
        comfyProcess.kill()
        comfyProcess = null
      }

      // Verify stopped
      await new Promise(resolve => setTimeout(resolve, 2000))
      const isRunning = await checkComfyUIStatus()

      return NextResponse.json({
        success: !isRunning,
        message: isRunning ? 'Failed to stop ComfyUI' : 'ComfyUI stopped successfully'
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: `Error stopping ComfyUI: ${error.message}`
      }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: false,
    message: 'Invalid action. Use "start" or "stop"'
  }, { status: 400 })
}
