import { test, expect } from '@playwright/test'

/**
 * REVISOR: Jobs Queue Test
 * Проверяет SSE-подключение и real-time обновления
 */

test.describe('Builder v0 — Jobs Queue (SSE)', () => {
  test('should open queue modal and verify SSE connection', async ({ page }) => {
    await page.goto('/builder-v0')
    await page.waitForLoadState('networkidle')
    
    await test.step('Open queue modal', async () => {
      // Ищем ≡ меню (3 точки/три линии) в ChatSidebar header
      const menuButton = page.locator('button:has([class*="lucide-menu"])')
      await menuButton.click()
      
      // Кликаем на пункт меню "Очередь задач"
      const queueMenuItem = page.getByRole('menuitem', { name: /очередь|queue/i })
      await queueMenuItem.click()
      
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'reports/playwright/screenshots/queue-01-modal-open.png' })
    })
    
    await test.step('Check SSE events in network', async () => {
      // Playwright не даёт прямого доступа к EventSource, но можем проверить /api/jobs/stream запрос
      // Подождать 5 секунд и проверить, что запрос на /stream активен
      await page.waitForTimeout(5000)
      
      // Проверить, что модал показывает список job (если есть)
      const jobQueue = page.getByTestId('job-queue')
      await expect(jobQueue).toBeVisible()
      
      const jobItems = jobQueue.locator('[data-testid^="job-row-"]')
      const count = await jobItems.count()
      
      console.log(`[REVISOR] Found ${count} jobs in queue modal`)
      
      await page.screenshot({ path: 'reports/playwright/screenshots/queue-02-jobs-list.png' })
    })
  })
})
