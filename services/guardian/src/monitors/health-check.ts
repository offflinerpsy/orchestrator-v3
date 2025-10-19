/**
 * V1 Guardian - Health Check Monitor
 * 
 * Monitors the AdminPanel /api/health endpoint.
 */

import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export interface HealthStatus {
  healthy: boolean;
  timestamp: string;
  error?: string;
  services?: Record<string, unknown>;
  system?: Record<string, unknown>;
}

/**
 * Check AdminPanel health endpoint
 */
export async function checkHealth(): Promise<HealthStatus> {
  const url = config.endpoints.adminHealth;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'V1Guardian/1.0' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn({ status: response.status, url }, 'Health check returned non-OK status');
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json() as {
      status?: string;
      timestamp?: string;
      services?: Record<string, unknown>;
      system?: Record<string, unknown>;
    };
    logger.debug({ url, status: data.status }, 'Health check successful');

    return {
      healthy: data.status === 'healthy',
      timestamp: data.timestamp || new Date().toISOString(),
      services: data.services,
      system: data.system,
    };
  } catch (error) {
    clearTimeout(timeout);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({ url, error: errorMessage }, 'Health check failed');
    
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    };
  }
}
