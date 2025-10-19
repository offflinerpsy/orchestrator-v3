/**
 * Windows Service Control utilities
 * Управление службами Windows через sc.exe (без child_process.spawn в каждом роуте)
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Запуск команды Windows Service Control с таймаутом
 */
export async function runServiceCommand(
  command: 'start' | 'stop' | 'query' | 'restart',
  serviceName: string,
  timeoutMs = 30000
): Promise<ServiceCommandResult> {
  try {
    const { stdout, stderr } = await execAsync(
      `sc ${command} ${serviceName}`,
      {
        timeout: timeoutMs,
        windowsHide: true
      }
    )
    
    const output = stdout + stderr
    
    return {
      success: true,
      output,
      status: parseServiceStatus(output)
    }
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.stderr || '',
      error: error.message,
      status: 'error'
    }
  }
}

/**
 * Парсинг статуса службы из вывода sc query
 */
function parseServiceStatus(output: string): ServiceStatus {
  if (output.includes('RUNNING')) return 'running'
  if (output.includes('STOPPED')) return 'stopped'
  if (output.includes('START_PENDING')) return 'starting'
  if (output.includes('STOP_PENDING')) return 'stopping'
  if (output.includes('1060')) return 'not-installed' // ERROR_SERVICE_DOES_NOT_EXIST
  return 'unknown'
}

/**
 * Ожидание запуска службы (polling с таймаутом)
 */
export async function waitForServiceStart(
  serviceName: string,
  maxWaitMs = 30000,
  pollIntervalMs = 1000
): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const result = await runServiceCommand('query', serviceName, 5000)
    
    if (result.status === 'running') {
      return true
    }
    
    if (result.status === 'error' || result.status === 'not-installed') {
      return false
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
  
  return false
}

/**
 * Ожидание остановки службы
 */
export async function waitForServiceStop(
  serviceName: string,
  maxWaitMs = 15000,
  pollIntervalMs = 500
): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const result = await runServiceCommand('query', serviceName, 5000)
    
    if (result.status === 'stopped') {
      return true
    }
    
    if (result.status === 'error' || result.status === 'not-installed') {
      return false
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
  
  return false
}

/**
 * Проверка существования службы
 */
export async function serviceExists(serviceName: string): Promise<boolean> {
  const result = await runServiceCommand('query', serviceName, 5000)
  return result.status !== 'not-installed' && result.status !== 'error'
}

// Types
export type ServiceStatus = 
  | 'running' 
  | 'stopped' 
  | 'starting' 
  | 'stopping' 
  | 'not-installed' 
  | 'unknown' 
  | 'error'

export interface ServiceCommandResult {
  success: boolean
  output: string
  error?: string
  status: ServiceStatus
}
