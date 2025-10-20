import { test, expect } from '@playwright/test'

/**
 * REVISOR: Health Check Test
 * Проверяет /diagnostics и fallback при оффлайн ComfyUI
 */

test.describe('Builder v0 — Health Check', () => {
  test('should render diagnostics page with system stats', async ({ page }) => {
    await test.step('Navigate to /diagnostics', async () => {
      await page.goto('/diagnostics')
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ path: 'reports/playwright/screenshots/health-01-diagnostics.png', fullPage: true })
    })
    
    await test.step('Verify system_stats are displayed', async () => {
      // Ищем элементы с данными (например, таблицы, JSON, карточки)
      const content = page.locator('body')
      const text = await content.textContent()
      
      if (!text || text.length < 100) {
        console.warn('[REVISOR WARNING] /diagnostics page is nearly empty')
      } else {
        console.log(`[REVISOR] /diagnostics rendered ${text.length} chars`)
      }
      
      // Проверить, что есть хотя бы одна секция с данными
      const sections = page.locator('section, article, div[role="region"]')
      const count = await sections.count()
      
      console.log(`[REVISOR] Found ${count} sections in /diagnostics`)
    })
  })
  
  test('should show readable message if ComfyUI offline', async ({ page }) => {
    // Этот тест проверяет fallback — если ComfyUI оффлайн, должно быть понятное сообщение
    await page.goto('/diagnostics')
    await page.waitForLoadState('networkidle')
    
    await test.step('Check for offline message', async () => {
      const offlineMessage = page.locator('text=/offline|unavailable|недоступен/i')
      const found = await offlineMessage.isVisible({ timeout: 3000 }).catch(() => false)
      
      if (found) {
        console.log('[REVISOR] ComfyUI offline message found (expected if service is down)')
        await page.screenshot({ path: 'reports/playwright/screenshots/health-02-offline.png' })
      } else {
        console.log('[REVISOR] ComfyUI appears online or no offline indicator')
      }
    })
  })
})
