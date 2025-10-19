/**
 * V1 Guardian - Logger Utility
 * 
 * Structured JSON logging with Pino for Guardian service.
 */

import pino from 'pino';
import { config } from '../config.js';
import { join } from 'path';

const logPath = join(config.logging.logDir, config.logging.logFile);

export const logger = pino({
  level: config.logging.level,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  ...(config.logging.prettyPrint ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  } : {
    // Production: write JSON to file
    destination: logPath,
  }),
});

logger.info({ component: 'logger' }, 'Guardian logger initialized');
