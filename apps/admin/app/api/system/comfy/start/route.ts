/**
 * Запуск службы OrchestratorComfyUI
 * POST /api/system/comfy/start
 */

import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function POST() {
  try {
    // Используем sc start (Windows Service Control)
    const result = await runCommand('sc', ['start', 'OrchestratorComfyUI']);
    
    if (result.includes('START_PENDING') || result.includes('RUNNING')) {
      return Response.json({
        success: true,
        message: 'ComfyUI служба запущена',
        output: result,
      });
    }
    
    return Response.json(
      {
        success: false,
        message: 'Не удалось запустить ComfyUI службу',
        output: result,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[SYSTEM] ComfyUI start error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Запуск команды и получение вывода
 */
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
      if (code === 0 || stdout.includes('START_PENDING') || stdout.includes('RUNNING')) {
        resolve(stdout + stderr);
      } else {
        reject(new Error(`Команда завершилась с кодом ${code}: ${stderr || stdout}`));
      }
    });

    proc.on('error', reject);
  });
}
