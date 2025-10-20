import { test, expect } from '@playwright/test'

test.describe('AdminPanel Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Home page loads and displays correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check title or main heading exists
    await expect(page.locator('h1, h2').first()).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/home-page.png', fullPage: true })
  })

  test('Builder page loads with form', async ({ page }) => {
    await page.goto('http://localhost:3000/builder')
    
    await page.waitForLoadState('networkidle')
    
    // Check if generation form exists
    const form = page.locator('form, [role="form"]')
    await expect(form).toBeVisible({ timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/builder-page.png', fullPage: true })
  })

  test('Diagnostics page loads with service status', async ({ page }) => {
    await page.goto('http://localhost:3000/diagnostics')
    
    await page.waitForLoadState('networkidle')
    
    // Check if system status card exists
    const statusCard = page.locator('text=/System|Service|Status/i').first()
    await expect(statusCard).toBeVisible({ timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/diagnostics-page.png', fullPage: true })
  })

  test('API metrics endpoint returns Prometheus format', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/metrics')
    
    expect(response.ok()).toBeTruthy()
    
    const text = await response.text()
    
    // Check for Prometheus metric format (# HELP, # TYPE, metric_name)
    expect(text).toContain('# HELP')
    expect(text).toContain('# TYPE')
    expect(text).toContain('orchestrator_')
  })

  test('Health check endpoint returns JSON', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health')
    
    expect(response.ok()).toBeTruthy()
    
    const json = await response.json()
    
    // Check structure
    expect(json).toHaveProperty('status')
    expect(json).toHaveProperty('timestamp')
  })
})

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`Home page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:3000/')
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({
        path: `tests/screenshots/home-${viewport.name}.png`,
        fullPage: true,
      })
    })
  }
})
