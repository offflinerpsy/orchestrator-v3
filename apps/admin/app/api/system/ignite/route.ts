/**
 * Запуск всего стека Orchestrator («Ignite»)
 * POST /api/system/ignite
 * 
 * Последовательно запускает:
 * 1. OrchestratorComfyUI
 * 2. OrchestratorPanel (если не dev-режим)
 * 3. OrchestratorWorker (если установлен)
 */

import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function POST() {
  const results: any[] = [];
  
  try {
    // 1. ComfyUI
    console.log('[IGNITE] Starting ComfyUI...');
    try {
      const comfyResult = await startService('OrchestratorComfyUI');
      results.push({ service: 'ComfyUI', success: true, output: comfyResult });
    } catch (error: any) {
      results.push({ service: 'ComfyUI', success: false, error: error.message });
    }
    
    // Ждём 3 секунды, чтобы ComfyUI успел инициализироваться
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Panel (только если в production режиме)
    if (process.env.NODE_ENV === 'production') {
      console.log('[IGNITE] Starting Panel...');
      try {
        const panelResult = await startService('OrchestratorPanel');
        results.push({ service: 'Panel', success: true, output: panelResult });
      } catch (error: any) {
        results.push({ service: 'Panel', success: false, error: error.message });
      }
    } else {
      results.push({ service: 'Panel', success: true, note: 'Пропущено (dev режим)' });
    }
    
    // 3. Worker (опционально)
    console.log('[IGNITE] Starting Worker...');
    try {
      const workerResult = await startService('OrchestratorWorker');
      results.push({ service: 'Worker', success: true, output: workerResult });
    } catch (error: any) {
      results.push({
        service: 'Worker',
        success: false,
        error: error.message,
        note: 'Не критично, если worker не установлен',
      });
    }
    
    const allSuccess = results.filter(r => r.service !== 'Worker').every(r => r.success);
    
    return Response.json({
      success: allSuccess,
      message: allSuccess ? 'Система запущена' : 'Запуск завершён с ошибками',
      services: results,
    });
  } catch (error: any) {
    console.error('[IGNITE] Error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        services: results,
      },
      { status: 500 }
    );
  }
}

async function startService(serviceName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('sc', ['start', serviceName], {
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
      const output = stdout + stderr;
      
      // Служба уже запущена или успешно стартует
      if (
        code === 0 ||
        output.includes('START_PENDING') ||
        output.includes('RUNNING') ||
        output.includes('already running')
      ) {
        resolve(output);
      } else {
        reject(new Error(`Код ${code}: ${output}`));
      }
    });

    proc.on('error', reject);
  });
}
