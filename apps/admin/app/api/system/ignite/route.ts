/**
 * Запуск всего стека Orchestrator («Ignite»)
 * POST /api/system/ignite
 * 
 * Последовательно запускает:
 * 1. OrchestratorComfyUI
 * 2. OrchestratorPanel (если не dev-режим)
 * 3. OrchestratorWorker (если установлен)
 */

import { logger } from '@/lib/logger'
import { runServiceCommand, waitForServiceStart } from '@/lib/service-control'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST() {
  const results: any[] = []
  
  try {
    // 1. ComfyUI
    logger.info({ message: 'IGNITE: Starting ComfyUI' })
    try {
      const startResult = await runServiceCommand('start', 'OrchestratorComfyUI')
      
      if (startResult.success) {
        // Ждём фактического запуска (до 30 секунд)
        const started = await waitForServiceStart('OrchestratorComfyUI', 30000, 1000)
        
        if (started) {
          // Проверяем API доступность
          await new Promise(resolve => setTimeout(resolve, 3000))
          try {
            const apiCheck = await fetch(`${env.COMFY_URL}/system_stats`, {
              signal: AbortSignal.timeout(5000)
            })
            results.push({
              service: 'ComfyUI',
              success: true,
              status: 'running',
              apiOnline: apiCheck.ok
            })
          } catch {
            results.push({
              service: 'ComfyUI',
              success: true,
              status: 'running',
              apiOnline: false,
              note: 'Service started but API not responding yet'
            })
          }
        } else {
          results.push({
            service: 'ComfyUI',
            success: false,
            error: 'Service start timeout (30s)'
          })
        }
      } else {
        results.push({
          service: 'ComfyUI',
          success: false,
          error: startResult.error || 'Failed to start'
        })
      }
    } catch (error: any) {
      results.push({ service: 'ComfyUI', success: false, error: error.message })
    }
    
    // 2. Panel (только если в production режиме)
    if (env.NODE_ENV === 'production') {
      logger.info({ message: 'IGNITE: Starting Panel' })
      try {
        const panelResult = await runServiceCommand('start', 'OrchestratorPanel')
        results.push({
          service: 'Panel',
          success: panelResult.success,
          status: panelResult.status
        })
      } catch (error: any) {
        results.push({ service: 'Panel', success: false, error: error.message })
      }
    } else {
      results.push({ service: 'Panel', success: true, status: 'dev-mode', note: 'Skipped (dev mode)' })
    }
    
    // 3. Worker (опционально)
    logger.info({ message: 'IGNITE: Checking Worker' })
    try {
      const workerResult = await runServiceCommand('start', 'OrchestratorWorker', 5000)
      results.push({
        service: 'Worker',
        success: workerResult.success,
        status: workerResult.status
      })
    } catch (error: any) {
      results.push({
        service: 'Worker',
        success: false,
        status: 'not-installed',
        note: 'Optional service'
      })
    }
    
    const criticalServices = results.filter(r => r.service === 'ComfyUI' || r.service === 'Panel')
    const allSuccess = criticalServices.every(r => r.success)
    
    return Response.json({
      success: allSuccess,
      message: allSuccess ? 'System started successfully' : 'Some services failed to start',
      services: results,
    })
  } catch (error: any) {
    logger.error({
      message: 'IGNITE error',
      error: error.message,
      stack: error.stack,
      services: results
    })
    return Response.json(
      {
        success: false,
        error: error.message,
        services: results,
      },
      { status: 500 }
    )
  }
}
