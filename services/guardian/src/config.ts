/**
 * V1 Guardian Configuration
 * 
 * Centralized configuration for monitoring intervals, thresholds, and endpoints.
 */

export const config = {
  /** Monitoring intervals (milliseconds) */
  intervals: {
    healthCheck: 15_000,      // 15 seconds - check /api/health
    serviceWatch: 30_000,     // 30 seconds - check Windows services
    diskCheck: 300_000,       // 5 minutes - check disk space
  },

  /** Thresholds for alerts */
  thresholds: {
    maxRestartAttempts: 3,    // Max restart attempts before giving up
    restartCooldown: 30_000,  // 30 seconds cooldown between restarts
    diskSpaceWarning: 10,     // 10 GB free space warning threshold
    memoryWarning: 80,        // 80% memory usage warning
  },

  /** Monitored services */
  services: [
    'OrchestratorComfyUI',
    'OrchestratorPanel',
  ],

  /** Endpoints to monitor */
  endpoints: {
    adminHealth: 'http://localhost:3000/api/health',
    comfyHealth: 'http://localhost:8188/system_stats',
  },

  /** Logging configuration */
  logging: {
    logDir: 'F:\\Logs\\guardian',
    logFile: 'guardian.log',
    level: 'info',
    prettyPrint: false, // JSON logs for production
  },

  /** Bug report configuration */
  reporting: {
    reportDir: 'F:\\Logs\\reports',
    maxRecentLogs: 50, // Include last 50 log lines in bug reports
  },
} as const;
