import * as Sentry from '@sentry/nextjs'
import { env } from './lib/env'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: env._isValid ? 0.1 : 0,
  
  // Environment
  environment: env.NODE_ENV,
  
  // Only enable if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Server-specific options
  beforeSend(event) {
    // Filter out sensitive data from env variables
    if (event.contexts?.runtime?.env) {
      delete event.contexts.runtime.env
    }
    return event
  },
})
