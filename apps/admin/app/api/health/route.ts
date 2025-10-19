/**
 * Health Check Endpoint (Kubernetes-style)
 * 
 * Comprehensive system health with disk, memory, and service status.
 * Used by V1 Guardian for monitoring.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';
import { runServiceCommand } from '@/lib/service-control';
import { env } from '@/lib/env';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const revalidate = 0;

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    comfy: {
      installed: boolean;
      status: string;
      running: boolean;
      apiOnline: boolean;
      models: number;
    };
  };
  system: {
    diskF: {
      free: string;
      total: string;
      freeBytes: number;
    };
    memory: {
      used: string;
      total: string;
      usedPercent: number;
    };
  };
  environment: {
    allowGeneration: boolean;
    fluxKeyConfigured: boolean;
    v0KeyConfigured: boolean;
    nodeEnv: string;
  };
}

/**
 * Get disk space for F: drive using PowerShell
 */
async function getDiskSpace(): Promise<{ free: string; total: string; freeBytes: number }> {
  try {
    const { stdout } = await execAsync(
      'powershell -Command "Get-Volume -DriveLetter F | Select-Object SizeRemaining,Size | ConvertTo-Json"',
      { timeout: 3000 }
    );
    const data = JSON.parse(stdout) as { SizeRemaining: number; Size: number };
    
    const freeBytes = data.SizeRemaining;
    const totalBytes = data.Size;
    const freeGB = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
    const totalGB = (totalBytes / 1024 / 1024 / 1024).toFixed(2);

    return {
      free: `${freeGB} GB`,
      total: `${totalGB} GB`,
      freeBytes,
    };
  } catch (error) {
    logger.warn({ error: String(error) }, 'Failed to get disk space');
    return {
      free: 'unknown',
      total: 'unknown',
      freeBytes: 0,
    };
  }
}

/**
 * Get memory usage using PowerShell
 */
async function getMemoryUsage(): Promise<{ used: string; total: string; usedPercent: number }> {
  try {
    const { stdout } = await execAsync(
      'powershell -Command "Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json"',
      { timeout: 3000 }
    );
    const data = JSON.parse(stdout) as { TotalVisibleMemorySize: number; FreePhysicalMemory: number };
    
    const totalKB = data.TotalVisibleMemorySize;
    const freeKB = data.FreePhysicalMemory;
    const usedKB = totalKB - freeKB;
    const usedPercent = Math.round((usedKB / totalKB) * 100);

    const usedGB = (usedKB / 1024 / 1024).toFixed(2);
    const totalGB = (totalKB / 1024 / 1024).toFixed(2);

    return {
      used: `${usedGB} GB`,
      total: `${totalGB} GB`,
      usedPercent,
    };
  } catch (error) {
    logger.warn({ error: String(error) }, 'Failed to get memory usage');
    return {
      used: 'unknown',
      total: 'unknown',
      usedPercent: 0,
    };
  }
}

export async function GET() {
  try {
    // Check ComfyUI service
    const comfyServiceResult = await runServiceCommand('query', 'OrchestratorComfyUI', 5000);
    
    // Check ComfyUI API availability
    let comfyApiOnline = false;
    let comfyModels = 0;
    try {
      const statsResponse = await fetch(`${env.COMFY_URL}/system_stats`, {
        signal: AbortSignal.timeout(3000),
      });
      comfyApiOnline = statsResponse.ok;
      
      if (comfyApiOnline) {
        const objectInfoResponse = await fetch(`${env.COMFY_URL}/object_info`, {
          signal: AbortSignal.timeout(3000),
        });
        if (objectInfoResponse.ok) {
          const objectInfo = await objectInfoResponse.json() as {
            CheckpointLoaderSimple?: {
              input?: {
                required?: {
                  ckpt_name?: [string[]];
                };
              };
            };
          };
          comfyModels = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]?.length || 0;
        }
      }
    } catch {
      comfyApiOnline = false;
    }

    // Get system metrics
    const [diskSpace, memoryUsage] = await Promise.all([
      getDiskSpace(),
      getMemoryUsage(),
    ]);

    // Determine overall health
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!comfyApiOnline) {
      overallStatus = 'degraded';
    }
    if (diskSpace.freeBytes < 10 * 1024 * 1024 * 1024) { // < 10GB
      overallStatus = 'degraded';
    }
    if (memoryUsage.usedPercent > 90) {
      overallStatus = 'degraded';
    }

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        comfy: {
          installed: comfyServiceResult.status !== 'not-installed',
          status: comfyServiceResult.status,
          running: comfyServiceResult.status === 'running',
          apiOnline: comfyApiOnline,
          models: comfyModels,
        },
      },
      system: {
        diskF: diskSpace,
        memory: memoryUsage,
      },
      environment: {
        allowGeneration: env.ALLOW_GENERATION === 'true',
        fluxKeyConfigured: !!env.BFL_API_KEY,
        v0KeyConfigured: !!env.V0_API_KEY,
        nodeEnv: env.NODE_ENV,
      },
    };

    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, 'Health check error');

    return Response.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
