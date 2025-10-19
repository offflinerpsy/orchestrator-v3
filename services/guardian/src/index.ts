/**
 * V1 Guardian - Main Service
 * 
 * Autonomous monitoring and recovery service.
 * Runs health checks and service watches on configured intervals.
 */

import { logger } from './utils/logger.js';
import { config } from './config.js';
import { checkHealth } from './monitors/health-check.js';
import { checkAllServices } from './monitors/service-watch.js';
import { restartService, getRestartAttempts } from './recovery/restart-service.js';

/** Graceful shutdown flag */
let isShuttingDown = false;

/**
 * Health check monitoring loop
 */
async function healthCheckLoop(): Promise<void> {
  if (isShuttingDown) return;

  try {
    const health = await checkHealth();
    
    if (!health.healthy) {
      logger.warn(
        { error: health.error },
        '⚠️ AdminPanel health check failed'
      );
      // In future: generate bug report, send alert
    } else {
      logger.info({ timestamp: health.timestamp }, '✅ Health check passed');
    }
  } catch (error) {
    logger.error({ error: String(error) }, 'Health check loop error');
  }

  // Schedule next check
  if (!isShuttingDown) {
    setTimeout(healthCheckLoop, config.intervals.healthCheck);
  }
}

/**
 * Service watch monitoring loop
 */
async function serviceWatchLoop(): Promise<void> {
  if (isShuttingDown) return;

  try {
    const statuses = await checkAllServices();
    
    // Check for down services and attempt recovery
    for (const status of statuses) {
      if (!status.running && !status.error?.includes('does not exist')) {
        const attempts = getRestartAttempts(status.name);
        
        logger.warn(
          { service: status.name, state: status.state, attempts },
          '⚠️ Service not running, attempting recovery'
        );

        const restarted = await restartService(status.name);
        
        if (!restarted) {
          logger.error(
            { service: status.name, attempts: attempts + 1 },
            '❌ Failed to restart service'
          );
          // In future: generate bug report if max attempts reached
        }
      } else if (status.running) {
        logger.debug({ service: status.name }, '✅ Service running');
      }
    }
  } catch (error) {
    logger.error({ error: String(error) }, 'Service watch loop error');
  }

  // Schedule next check
  if (!isShuttingDown) {
    setTimeout(serviceWatchLoop, config.intervals.serviceWatch);
  }
}

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal: string): void {
  logger.info({ signal }, 'Received shutdown signal, stopping Guardian...');
  isShuttingDown = true;
  
  // Give loops time to finish current iteration
  setTimeout(() => {
    logger.info('V1 Guardian stopped');
    process.exit(0);
  }, 2000);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info(
    {
      version: '1.0.0',
      config: {
        healthCheckInterval: config.intervals.healthCheck / 1000 + 's',
        serviceWatchInterval: config.intervals.serviceWatch / 1000 + 's',
        monitoredServices: config.services,
      },
    },
    '🚀 V1 Guardian starting...'
  );

  // Setup shutdown handlers
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Start monitoring loops
  logger.info('Starting health check loop...');
  healthCheckLoop().catch(err => logger.error({ error: String(err) }, 'Health loop crashed'));

  logger.info('Starting service watch loop...');
  serviceWatchLoop().catch(err => logger.error({ error: String(err) }, 'Service watch loop crashed'));

  logger.info('✅ V1 Guardian started successfully');
}

// Start the service
main().catch(err => {
  logger.fatal({ error: String(err) }, 'Fatal error during startup');
  process.exit(1);
});
