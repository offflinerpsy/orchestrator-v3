#!/usr/bin/env node
/**
 * REVISOR: Axe-core Accessibility Test
 * 
 * Прогоняет axe-core на ключевых страницах и сохраняет JSON-отчёты
 * Docs: https://playwright.dev/docs/accessibility-testing
 */

import { chromium } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const pages = [
  { url: '/', name: 'home' },
  { url: '/diagnostics', name: 'diagnostics' },
  { url: '/builder-v0', name: 'builder-v0' }, // Если такой роут есть
]

async function runAxe() {
  console.log('[REVISOR AXE] Starting accessibility audit...')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  // Создать папку для отчётов
  mkdirSync('reports/axe', { recursive: true })
  
  for (const { url, name } of pages) {
    console.log(`[REVISOR AXE] Checking ${url}...`)
    
    try {
      await page.goto(`http://127.0.0.1:3000${url}`, { waitUntil: 'networkidle' })
      
      // Inject axe-core
      await injectAxe(page)
      
      // Run axe
      const results = await page.evaluate(async () => {
        // @ts-ignore (axe injected globally)
        return await window.axe.run()
      })
      
      // Сохранить результаты
      const reportPath = join('reports', 'axe', `${name}.json`)
      writeFileSync(reportPath, JSON.stringify(results, null, 2))
      
      console.log(`[REVISOR AXE] ${name}: ${results.violations.length} violations found`)
      console.log(`[REVISOR AXE] Report saved: ${reportPath}`)
      
    } catch (error) {
      console.error(`[REVISOR AXE ERROR] ${name}:`, error.message)
      
      // Сохранить ошибку в JSON
      const errorReport = {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      }
      writeFileSync(join('reports', 'axe', `${name}.error.json`), JSON.stringify(errorReport, null, 2))
    }
  }
  
  await browser.close()
  console.log('[REVISOR AXE] Accessibility audit complete!')
}

runAxe().catch((err) => {
  console.error('[REVISOR AXE FATAL]', err)
  process.exit(1)
})
