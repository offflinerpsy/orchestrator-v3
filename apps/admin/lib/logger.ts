/**
 * Structured Logger — pino
 * 
 * Замена console.log для production.
 * JSON logs в production, pretty-print в dev.
 * 
 * USAGE:
 * import { logger } from '@/lib/logger'
 * logger.info('Generation started', { jobId: '123', backend: 'flux' })
 * logger.error('FLUX API failed', { error: err.message })
 */

import pino from 'pino'
import { env } from './env'

/**
 * Create pino logger instance
 * - Pretty format for development
 * - JSON format for production
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  // Pretty-print in development
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      singleLine: false,
    }
  } : undefined,
  // Base fields for all logs
  base: {
    env: env.NODE_ENV,
  },
  // Timestamp format
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
})

/**
 * Log levels:
 * logger.trace() - very detailed debugging
 * logger.debug() - debugging information
 * logger.info()  - informational messages
 * logger.warn()  - warning messages
 * logger.error() - error messages
 * logger.fatal() - fatal errors (app crash)
 */

// Log startup
if (env.NODE_ENV === 'development') {
  logger.info({
    message: 'Logger initialized',
    level: env.LOG_LEVEL,
    format: 'pretty',
  })
} else {
  logger.info({
    message: 'Logger initialized',
    level: env.LOG_LEVEL,
    format: 'json',
  })
}

