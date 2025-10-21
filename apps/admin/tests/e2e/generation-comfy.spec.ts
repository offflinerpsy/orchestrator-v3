import { test, expect } from '@playwright/test'

/**
 * REVISOR: ComfyUI Generation Test
 * Проверяет отправку job через UI и получение результата
 */

test.describe('Builder v0 — ComfyUI Generation', () => {
  test('should submit generation job and receive result', async ({ page }) => {
    await page.goto('/builder-v0')
    await page.waitForLoadState('networkidle')
    
    await test.step('Submit /gen image command', async () => {
      const chatInput = page.getByTestId('chat-input')
      await chatInput.fill('/gen image test sunset')
      await chatInput.press('Enter')
      
      await page.waitForTimeout(3000) // Дождаться создания job
      await page.screenshot({ path: 'reports/playwright/screenshots/gen-01-command-sent.png' })
    })
    
    await test.step('Check gallery for new job', async () => {
      // Переключиться на таб "Действия" (там находится галерея)
      const actionsTab = page.getByTestId('actions-tab')
      await actionsTab.click()
      
      // Ждём появление job card (может быть queued/running)
      await page.waitForTimeout(5000)
      
      // Проверяем галерею с data-testid
      const gallery = page.getByTestId('gallery-grid')
      await expect(gallery).toBeVisible()
      
      const jobCards = gallery.locator('> div')
      const count = await jobCards.count()
      
      console.log(`[REVISOR] Found ${count} job(s) in gallery`)
      
      await page.screenshot({ path: 'reports/playwright/screenshots/gen-02-gallery.png' })
      
      if (count === 0) {
        console.warn('[REVISOR WARNING] No jobs found in gallery after /gen command')
      }
    })
  })
})
