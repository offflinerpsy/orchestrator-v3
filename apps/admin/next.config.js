const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'standalone' output requires elevated permissions for symlink creation
  // Run build as Administrator or use default output mode
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry build-time configuration
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Upload source maps only if auth token is set
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
})
