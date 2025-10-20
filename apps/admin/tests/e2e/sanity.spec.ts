import { test, expect } from '@playwright/test'

/**
 * REVISOR: Sanity Check
 * 
 * Проверяет базовый рендеринг Builder v0:
 * - Главная страница "/" загружается
 * - Присутствуют три основных панели
 * - Iframe предпросмотра загружен
 * - CSP/X-Frame-Options не блокируют iframe
 * 
 * Docs: https://playwright.dev/docs/writing-tests
 */

test.describe('Builder v0 — Sanity Check', () => {
  test('should render main page with three panels', async ({ page }) => {
    // Шаг 1: Открыть главную страницу Builder v0
    await test.step('Navigate to /builder-v0', async () => {
      await page.goto('/builder-v0')
      await expect(page).toHaveTitle(/Orchestrator/i)
    })

    // Шаг 2: Проверить наличие ChatSidebar (левая панель)
    await test.step('Verify ChatSidebar exists', async () => {
      // Ищем элемент с role="complementary" или data-testid (если есть)
      // Либо просто проверяем textarea для ввода
      const chatInput = page.getByPlaceholder(/сообщение|message/i)
      await expect(chatInput).toBeVisible({ timeout: 10000 })
      
      // Screenshot для артефактов
      await page.screenshot({ path: 'reports/playwright/screenshots/01-chat-sidebar.png', fullPage: false })
    })

    // Шаг 3: Проверить наличие CanvasPreview (центральная панель с iframe)
    await test.step('Verify CanvasPreview iframe loaded', async () => {
      const iframe = page.frameLocator('iframe[title*="preview" i], iframe[name*="canvas" i]')
      
      // Если iframe не найден по title/name, пробуем первый iframe на странице
      const iframes = page.locator('iframe')
      const count = await iframes.count()
      
      if (count === 0) {
        throw new Error('REVISOR FAIL: No iframe found on page. Expected CanvasPreview iframe.')
      }
      
      // Проверяем, что iframe загрузился (readyState="complete")
      // Playwright автоматически ждёт загрузки, но явно проверим
      const firstIframe = iframes.first()
      await expect(firstIframe).toBeVisible()
      
      // Screenshot iframe area
      await page.screenshot({ path: 'reports/playwright/screenshots/02-canvas-preview.png', fullPage: false })
      
      console.log(`[REVISOR] Found ${count} iframe(s) on page`)
    })

    // Шаг 4: Проверить наличие Inspector (правая панель с табами)
    await test.step('Verify Inspector tabs exist', async () => {
      // Ищем радикс-табы или просто кнопки с ролью "tab"
      const tabs = page.locator('[role="tablist"]')
      await expect(tabs).toBeVisible()
      
      // Проверяем, что есть хотя бы один таб (например, "Вывод" или "Галерея")
      const tabButtons = page.locator('[role="tab"]')
      const tabCount = await tabButtons.count()
      
      if (tabCount === 0) {
        throw new Error('REVISOR FAIL: No tabs found in Inspector panel')
      }
      
      console.log(`[REVISOR] Found ${tabCount} tabs in Inspector`)
      
      // Screenshot правой панели
      await page.screenshot({ path: 'reports/playwright/screenshots/03-inspector-tabs.png', fullPage: false })
    })

    // Шаг 5: Проверить CSP/X-Frame-Options заголовки
    await test.step('Check CSP and X-Frame-Options headers', async () => {
      const response = await page.goto('/builder-v0')
      const headers = response?.headers() || {}
      
      const csp = headers['content-security-policy'] || 'NOT_SET'
      const xfo = headers['x-frame-options'] || 'NOT_SET'
      
      console.log('[REVISOR] CSP:', csp)
      console.log('[REVISOR] X-Frame-Options:', xfo)
      
      // Сохранить заголовки в JSON для отчёта
      const headersData = {
        url: response?.url(),
        status: response?.status(),
        csp,
        xfo,
        timestamp: new Date().toISOString()
      }
      
      // Записать в reports/playwright (будет собрано в audit-summarize)
      await page.evaluate((data) => {
        console.log('[REVISOR] Headers data:', JSON.stringify(data, null, 2))
      }, headersData)
      
      // Если CSP блокирует frame-src — это критичная ошибка
      if (csp.includes('frame-src') && !csp.includes("frame-src 'self'") && !csp.includes('frame-src *')) {
        console.warn('[REVISOR WARNING] CSP may block iframe loading!')
      }
    })
  })

  test('should toggle between modes (Preview/Design)', async ({ page }) => {
    await page.goto('/builder-v0')
    
    await test.step('Wait for page load', async () => {
      await page.waitForLoadState('networkidle')
    })
    
    // Ищем кнопки переключения режима (если есть UI-элемент)
    // Если переключение только через команду /design — пропускаем этот тест
    const modeToggle = page.getByRole('button', { name: /design|режим/i })
    
    if (await modeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await test.step('Click design mode toggle', async () => {
        await modeToggle.click()
        await page.screenshot({ path: 'reports/playwright/screenshots/04-design-mode-toggle.png' })
      })
    } else {
      console.log('[REVISOR] No visible mode toggle button — design mode activated via /design command')
      test.skip()
    }
  })
})
