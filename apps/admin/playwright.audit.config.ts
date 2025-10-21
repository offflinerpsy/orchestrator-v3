import { defineConfig, devices } from '@playwright/test'

/**
 * REVISOR Playwright Config
 * Docs: https://playwright.dev/docs/test-configuration
 * 
 * РЕЖИМ: Audit-only (без автоматических правок кода)
 * - Скриншоты/видео/трейсы при падении
 * - HTML + JSON репортеры
 * - Chromium только (достаточно для начала)
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Тайм-ауты
  timeout: 30 * 1000, // 30s на тест
  expect: {
    timeout: 5000, // 5s на assertion
  },
  
  // Parallel execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Запретить .only() в CI
  retries: process.env.CI ? 2 : 0, // 2 ретрая в CI, 0 локально
  workers: process.env.CI ? 1 : undefined, // 1 воркер в CI (stability)
  
  // Репортеры
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }], // HTML report, НЕ открывать автоматически
    ['list'], // Console output
    ['json', { outputFile: 'test-results/results.json' }], // JSON для парсинга
    // Раскомментировать если нужен Allure:
    // ['allure-playwright', { outputFolder: 'reports/allure-results' }],
  ],
  
  // Настройки использования
  use: {
    // Base URL (port 3002 для REVISOR audit, избегаем конфликтов)
    baseURL: 'http://127.0.0.1:3002',
    
    // Test ID attribute (Playwright best practices)
    testIdAttribute: 'data-testid',
    
    // Трейсы только при ретраях (чтобы не засорять диск)
    trace: 'on-first-retry', // https://playwright.dev/docs/trace-viewer
    
    // Скриншоты/видео при падении
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Сохранить artifacts
    actionTimeout: 10 * 1000, // 10s на action (click, fill, etc.)
    navigationTimeout: 15 * 1000, // 15s на navigation
  },
  
  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Раскомментировать если нужны другие браузеры:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // НЕ используем webServer (поднимаем вручную через npm scripts)
  // Это позволяет прогнать LHCI и другие проверки на том же инстансе
})
