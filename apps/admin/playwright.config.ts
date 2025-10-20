import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  
  // Test timeout
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: process.env.CI ? 'github' : [['html', { outputFolder: 'playwright-report' }]],
  
  // Shared settings
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3001',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before tests (optional)
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
