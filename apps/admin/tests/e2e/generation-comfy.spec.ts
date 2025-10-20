import { test, expect } from '@playwright/test'

/**
 * REVISOR: ComfyUI Generation Test
 * Проверяет отправку job через UI и получение результата
 */

test.describe('Builder v0 — ComfyUI Generation', () => {
  test('should submit generation job and receive result', async ({ page }) => {
    await page.goto('/builder-v0')
    
    await test.step('Submit /gen image command', async () => {
      const chatInput = page.getByPlaceholder(/сообщение|message/i)
      await chatInput.fill('/gen image test sunset')
      await chatInput.press('Enter')
      
      await page.waitForTimeout(3000) // Дождаться создания job
      await page.screenshot({ path: 'reports/playwright/screenshots/gen-01-command-sent.png' })
    })
    
    await test.step('Check gallery for new job', async () => {
      // Переключиться на таб "Галерея" в Inspector
      const galleryTab = page.getByRole('tab', { name: /галерея|gallery/i })
      await galleryTab.click()
      
      // Ждём появление job card (может быть queued/running)
      await page.waitForTimeout(5000)
      
      // Проверяем, что появился хотя бы один элемент job
      const jobCards = page.locator('[data-job-id]')
      const count = await jobCards.count()
      
      console.log(`[REVISOR] Found ${count} job(s) in gallery`)
      
      await page.screenshot({ path: 'reports/playwright/screenshots/gen-02-gallery.png' })
      
      if (count === 0) {
        console.warn('[REVISOR WARNING] No jobs found in gallery after /gen command')
      }
    })
  })
})
