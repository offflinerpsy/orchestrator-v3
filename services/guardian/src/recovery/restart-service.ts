/**
 * V1 Guardian - Service Restart Recovery
 * 
 * Auto-restart failed Windows services with cooldown and attempt limits.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { queryService } from '../monitors/service-watch.js';

const execAsync = promisify(exec);

/** Track restart attempts per service */
const restartAttempts = new Map<string, number>();

/** Track last restart timestamp per service */
const lastRestartTime = new Map<string, number>();

/**
 * Restart a Windows service using sc.exe
 */
export async function restartService(serviceName: string): Promise<boolean> {
  const now = Date.now();
  const attempts = restartAttempts.get(serviceName) || 0;
  const lastRestart = lastRestartTime.get(serviceName) || 0;

  // Check max attempts
  if (attempts >= config.thresholds.maxRestartAttempts) {
    logger.error(
      { serviceName, attempts },
      'Max restart attempts reached, giving up'
    );
    return false;
  }

  // Check cooldown period
  const timeSinceLastRestart = now - lastRestart;
  if (timeSinceLastRestart < config.thresholds.restartCooldown) {
    const waitTime = config.thresholds.restartCooldown - timeSinceLastRestart;
    logger.info(
      { serviceName, waitTime },
      'Cooldown period active, waiting before restart'
    );
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    logger.info({ serviceName, attempt: attempts + 1 }, 'Attempting to restart service');

    // Start the service
    await execAsync(`sc start "${serviceName}"`, {
      timeout: 30_000,
      windowsHide: true,
    });

    // Wait 5 seconds and verify it's running
    await new Promise(resolve => setTimeout(resolve, 5000));
    const status = await queryService(serviceName);

    if (status.running) {
      logger.info({ serviceName }, '✅ Service restarted successfully');
      // Reset attempts on success
      restartAttempts.set(serviceName, 0);
      lastRestartTime.set(serviceName, now);
      return true;
    } else {
      logger.warn({ serviceName, state: status.state }, 'Service start command succeeded but not running');
      // Increment attempts
      restartAttempts.set(serviceName, attempts + 1);
      lastRestartTime.set(serviceName, now);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ serviceName, error: errorMessage }, 'Failed to restart service');
    
    // Increment attempts on error
    restartAttempts.set(serviceName, attempts + 1);
    lastRestartTime.set(serviceName, now);
    return false;
  }
}

/**
 * Reset restart attempts counter (for testing or manual intervention)
 */
export function resetRestartAttempts(serviceName: string): void {
  restartAttempts.delete(serviceName);
  lastRestartTime.delete(serviceName);
  logger.info({ serviceName }, 'Restart attempts counter reset');
}

/**
 * Get current restart attempts for a service
 */
export function getRestartAttempts(serviceName: string): number {
  return restartAttempts.get(serviceName) || 0;
}
