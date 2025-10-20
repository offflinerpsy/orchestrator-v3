#!/usr/bin/env node
/**
 * REVISOR: Audit Summarize
 * 
 * Собирает все отчёты (Playwright, LHCI, axe) в единый INDEX.md
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const auditDir = join('docs', '_audit', timestamp)

// Создать папку для артефактов
mkdirSync(auditDir, { recursive: true })

console.log(`[REVISOR SUMMARY] Creating audit report in ${auditDir}`)

let summary = `# REVISOR Audit Report\n\n`
summary += `**Timestamp**: ${new Date().toISOString()}\n`
summary += `**Node**: ${process.version}\n`
summary += `**Platform**: ${process.platform} ${process.arch}\n\n`

// 1. Playwright results
summary += `## 📊 Playwright E2E Tests\n\n`
const playwrightResults = join('reports', 'playwright', 'results.json')

if (existsSync(playwrightResults)) {
  const data = JSON.parse(readFileSync(playwrightResults, 'utf8'))
  const { passed = 0, failed = 0, skipped = 0 } = data.stats || {}
  
  summary += `- ✅ **Passed**: ${passed}\n`
  summary += `- ❌ **Failed**: ${failed}\n`
  summary += `- ⏭️ **Skipped**: ${skipped}\n`
  summary += `- 📁 [HTML Report](../../reports/playwright/html/index.html)\n\n`
  
  if (failed > 0) {
    summary += `### ⚠️ Failed Tests:\n\n`
    const failures = data.suites?.flatMap(s => s.specs?.filter(spec => spec.ok === false)) || []
    failures.slice(0, 5).forEach(spec => {
      summary += `- **${spec.title}** (${spec.file})\n`
    })
    summary += `\n`
  }
} else {
  summary += `⚠️ **No Playwright results found**\n\n`
}

// 2. Lighthouse CI
summary += `## ⚡ Lighthouse CI (Performance)\n\n`
const lhciDir = join('reports', 'lhci')

if (existsSync(lhciDir)) {
  const lhciFiles = readdirSync(lhciDir).filter(f => f.endsWith('.json'))
  
  if (lhciFiles.length > 0) {
    summary += `- 📁 [LHCI Reports](../../reports/lhci/)\n`
    summary += `- **Files**: ${lhciFiles.length}\n\n`
  } else {
    summary += `⚠️ **No LHCI JSON files found**\n\n`
  }
} else {
  summary += `⚠️ **LHCI directory not found**\n\n`
}

// 3. Axe-core A11y
summary += `## ♿ Axe-core Accessibility\n\n`
const axeDir = join('reports', 'axe')

if (existsSync(axeDir)) {
  const axeFiles = readdirSync(axeDir).filter(f => f.endsWith('.json') && !f.includes('.error'))
  
  summary += `| Page | Violations |\n`
  summary += `|------|------------|\n`
  
  for (const file of axeFiles) {
    const data = JSON.parse(readFileSync(join(axeDir, file), 'utf8'))
    const violations = data.violations?.length || 0
    const pageName = file.replace('.json', '')
    
    summary += `| ${pageName} | ${violations} |\n`
  }
  
  summary += `\n- 📁 [Axe Reports](../../reports/axe/)\n\n`
} else {
  summary += `⚠️ **Axe directory not found**\n\n`
}

// 4. Top 3 issues
summary += `## 🔥 Top 3 Critical Issues\n\n`

const issues = []

// Collect Playwright failures
if (existsSync(playwrightResults)) {
  const data = JSON.parse(readFileSync(playwrightResults, 'utf8'))
  const failures = data.suites?.flatMap(s => s.specs?.filter(spec => spec.ok === false)) || []
  
  failures.slice(0, 3).forEach(spec => {
    issues.push(`**Playwright E2E**: ${spec.title} — ${spec.tests?.[0]?.results?.[0]?.error?.message || 'Unknown error'}`)
  })
}

// Collect Axe violations
if (existsSync(axeDir)) {
  const axeFiles = readdirSync(axeDir).filter(f => f.endsWith('.json') && !f.includes('.error'))
  
  for (const file of axeFiles) {
    const data = JSON.parse(readFileSync(join(axeDir, file), 'utf8'))
    const violations = data.violations || []
    
    violations.slice(0, 2).forEach(v => {
      issues.push(`**A11y (${file.replace('.json', '')})**: ${v.id} — ${v.description}`)
    })
  }
}

if (issues.length === 0) {
  summary += `✅ **No critical issues found!**\n\n`
} else {
  issues.slice(0, 3).forEach((issue, i) => {
    summary += `${i + 1}. ${issue}\n`
  })
  summary += `\n`
}

// 5. Artifacts links
summary += `## 📦 Artifacts\n\n`
summary += `- 🎬 [Videos & Traces](../../reports/playwright/)\n`
summary += `- 📸 [Screenshots](../../reports/playwright/screenshots/)\n`
summary += `- 📄 [JSON Results](../../reports/playwright/results.json)\n`
summary += `- ⚡ [Lighthouse Reports](../../reports/lhci/)\n`
summary += `- ♿ [Axe Reports](../../reports/axe/)\n\n`

// Сохранить INDEX.md в audit folder
const indexPath = join(auditDir, 'INDEX.md')
writeFileSync(indexPath, summary)

console.log(`[REVISOR SUMMARY] Report saved: ${indexPath}`)

// Создать AUDIT-<timestamp>.md в docs/
const auditLinkPath = join('docs', `AUDIT-${timestamp}.md`)
const auditLink = `# REVISOR Audit — ${timestamp}\n\n`
  + `🔗 [Full Report](./_audit/${timestamp}/INDEX.md)\n\n`
  + `---\n\n`
  + summary

writeFileSync(auditLinkPath, auditLink)

console.log(`[REVISOR SUMMARY] Audit link created: ${auditLinkPath}`)
console.log(`[REVISOR SUMMARY] ✅ All done!`)
