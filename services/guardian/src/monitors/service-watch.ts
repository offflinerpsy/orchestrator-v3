/**
 * V1 Guardian - Service Watch Monitor
 * 
 * Monitors Windows services using sc.exe query command.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

const execAsync = promisify(exec);

export interface ServiceStatus {
  name: string;
  running: boolean;
  state: string;
  error?: string;
}

/**
 * Query Windows service status using sc.exe
 */
export async function queryService(serviceName: string): Promise<ServiceStatus> {
  try {
    const { stdout } = await execAsync(`sc query "${serviceName}"`, {
      timeout: 5000,
      windowsHide: true,
    });

    // Parse sc query output
    // STATE line format: "    STATE              : 4  RUNNING"
    const stateMatch = stdout.match(/STATE\s+:\s+\d+\s+(\w+)/);
    const state = stateMatch?.[1] || 'UNKNOWN';
    const running = state === 'RUNNING';

    logger.debug({ serviceName, state, running }, 'Service status queried');

    return {
      name: serviceName,
      running,
      state,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Service not found or other error
    logger.warn({ serviceName, error: errorMessage }, 'Failed to query service');
    
    return {
      name: serviceName,
      running: false,
      state: 'ERROR',
      error: errorMessage,
    };
  }
}

/**
 * Check all configured services
 */
export async function checkAllServices(): Promise<ServiceStatus[]> {
  const results = await Promise.all(
    config.services.map(name => queryService(name))
  );

  const downServices = results.filter(s => !s.running);
  if (downServices.length > 0) {
    logger.warn(
      { services: downServices.map(s => s.name) },
      'Some services are not running'
    );
  }

  return results;
}
