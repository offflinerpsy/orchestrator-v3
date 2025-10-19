/**
 * Остановка службы OrchestratorComfyUI
 * POST /api/system/comfy/stop
 */

import { spawn } from 'child_process'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST() {
  try {
    const result = await runCommand('sc', ['stop', 'OrchestratorComfyUI'])
    
    if (result.includes('STOP_PENDING') || result.includes('STOPPED')) {
      return Response.json({
        success: true,
        message: 'ComfyUI служба остановлена',
        output: result,
      })
    }
    
    return Response.json(
      {
        success: false,
        message: 'Не удалось остановить ComfyUI службу',
        output: result,
      },
      { status: 500 }
    )
  } catch (error: any) {
    logger.error({
      message: 'ComfyUI stop error',
      error: error.message,
      stack: error.stack
    })
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: true,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 || stdout.includes('STOP_PENDING') || stdout.includes('STOPPED')) {
        resolve(stdout + stderr);
      } else {
        reject(new Error(`Команда завершилась с кодом ${code}: ${stderr || stdout}`));
      }
    });

    proc.on('error', reject);
  });
}
