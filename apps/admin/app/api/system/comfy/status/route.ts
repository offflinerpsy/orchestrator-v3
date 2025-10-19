/**
 * Статус службы OrchestratorComfyUI
 * GET /api/system/comfy/status
 */

import { spawn } from 'child_process'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    const result = await runCommand('sc', ['query', 'OrchestratorComfyUI'])
    
    const running = result.includes('RUNNING')
    const stopped = result.includes('STOPPED')
    const startPending = result.includes('START_PENDING')
    
    return Response.json({
      running: running || startPending,
      stopped,
      pending: startPending,
      status: running ? 'running' : stopped ? 'stopped' : startPending ? 'starting' : 'unknown',
      output: result,
    })
  } catch (error: any) {
    // Служба не установлена или ошибка
    logger.error({
      message: 'ComfyUI status error',
      error: error.message,
      stack: error.stack
    })
    return Response.json({
      running: false,
      stopped: true,
      pending: false,
      status: 'not-installed',
      error: error.message,
    })
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
      if (code === 0) {
        resolve(stdout + stderr);
      } else {
        reject(new Error(`Служба не найдена или ошибка: ${stderr || stdout}`));
      }
    });

    proc.on('error', reject);
  });
}
