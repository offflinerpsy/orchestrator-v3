# 🔍 REVISOR v0 — COMPLETE AUDIT REPORT

**Generated**: 2025-10-20 23:56 UTC  
**Branch**: `audit/revisor-20251020-2356`  
**Pull Request**: [#3](https://github.com/offflinerpsy/orchestrator-v3/pull/3)  
**Status**: ✅ **ALL SYSTEMS IMPLEMENTED** (awaiting execution)

---

## 📊 EXECUTIVE SUMMARY

**REVISOR v0** — жесткая проверка Builder v0 без автоматических правок кода. Только тесты, артефакты и детальные отчёты.

**What's Done**:
- ✅ **Playwright E2E Tests** (5 test suites covering all critical flows)
- ✅ **Axe-core A11y** (automated accessibility violations detection)
- ✅ **Lighthouse CI** (performance, SEO, best practices metrics)
- ✅ **GitHub Actions CI** (automated workflow with artifact uploads)
- ✅ **Audit Summarize** (script to collect all reports into INDEX.md)

**Commits**: 7 atomic commits (structure → scripts → tests → a11y → lhci → ci → summarize)

---

## 🎯 SCOPE & OBJECTIVES

### Primary Goals
1. **Validate UI/UX** — все ключевые экраны рендерятся без белого экрана
2. **Test Critical Flows** — chat, design mode, generation, queue, health checks
3. **Capture Artifacts** — видео падений, трейсы, скриншоты, JSON-логи
4. **Accessibility Audit** — axe-core violations на всех страницах
5. **Performance Metrics** — Lighthouse CI scores (performance, SEO, PWA)

### Non-Goals (REVISOR НЕ ЧИНИТ)
- ❌ Fixing bugs in app code
- ❌ Refactoring components
- ❌ Adding new features
- ❌ Merging into main branch

**All findings** → documented in reports → separate fix PRs

---

## 📂 PROJECT STRUCTURE

```
C:\Work\Orchestrator\apps\admin\
├── tests/
│   ├── e2e/
│   │   ├── sanity.spec.ts               # Базовый рендеринг (3 панели, iframe, CSP)
│   │   ├── design-mode.spec.ts          # /design on, /select, /apply
│   │   ├── generation-comfy.spec.ts     # /gen image → job → gallery
│   │   ├── jobs-queue.spec.ts           # SSE modal, real-time updates
│   │   └── health.spec.ts               # /diagnostics + ComfyUI offline fallback
│   ├── a11y/
│   │   └── run-axe.mjs                  # Axe-core runner (saves JSON reports)
│   └── utils/                           # (reserved for test helpers)
├── reports/
│   ├── playwright/
│   │   ├── html/index.html              # HTML report
│   │   ├── results.json                 # JSON results
│   │   └── screenshots/                 # Captured screenshots
│   ├── lhci/                            # Lighthouse CI reports
│   └── axe/                             # Axe-core JSON violations
├── docs/
│   └── _audit/
│       └── <timestamp>/
│           └── INDEX.md                 # Aggregated audit report
├── playwright.audit.config.ts           # Playwright config (trace, video, reporters)
├── lighthouserc.json                    # LHCI config (3 runs, filesystem upload)
└── package.json                         # Scripts: revisor:build, revisor:test, revisor:all
```

---

## 🧪 TEST COVERAGE

### E2E Tests (Playwright)

**1. Sanity Check** (`sanity.spec.ts`)
- ✅ Navigate to `/` → page loads
- ✅ ChatSidebar visible (textarea for input)
- ✅ CanvasPreview iframe loaded (readyState="complete")
- ✅ Inspector tabs present (Gallery, Templates, Output)
- ✅ CSP/X-Frame-Options headers captured (JSON logged)
- ✅ Screenshots: 01-chat-sidebar, 02-canvas-preview, 03-inspector-tabs

**2. Design Mode** (`design-mode.spec.ts`)
- ✅ `/design on` → overlay активируется (2s wait)
- ✅ `/select body > div` → Inspector показывает properties
- ✅ `/apply body > div innerHTML="<p>REVISOR TEST</p>"` → iframe патчится runtime
- ✅ `/design off` → overlay деактивируется
- ✅ Screenshots: design-01-command-sent, design-02-overlay-active, design-03-deactivated, design-04-element-selected, design-05-apply-patch

**3. ComfyUI Generation** (`generation-comfy.spec.ts`)
- ✅ `/gen image test sunset` → job создаётся
- ✅ Gallery tab → job card появляется (queued/running)
- ✅ Wait 5s → check job status (может быть done/failed)
- ✅ Screenshots: gen-01-command-sent, gen-02-gallery

**4. Jobs Queue (SSE)** (`jobs-queue.spec.ts`)
- ✅ Open ≡ menu → "Очередь задач" → modal открывается
- ✅ SSE connection active (check /api/jobs/stream in network)
- ✅ Job items rendered with `[data-job-status]`
- ✅ Screenshots: queue-01-modal-open, queue-02-jobs-list

**5. Health Check** (`health.spec.ts`)
- ✅ Navigate to `/diagnostics` → page renders
- ✅ System stats displayed (content length > 100 chars)
- ✅ ComfyUI offline fallback → readable message (if service down)
- ✅ Screenshots: health-01-diagnostics, health-02-offline (if applicable)

### Accessibility Tests (Axe-core)

**Pages Tested**:
- `/` (home page)
- `/diagnostics` (health dashboard)
- `/builder-v0` (если такой роут есть)

**Output**: JSON reports in `reports/axe/*.json` with violations list

### Performance Tests (Lighthouse CI)

**Config**:
- **Runs**: 3 (averaging scores)
- **Targets**: Performance (0.7+), Accessibility (0.9+), Best Practices (0.8+), SEO (0.8+)
- **Output**: HTML + JSON reports in `reports/lhci/`

---

## 🔧 DEPENDENCIES INSTALLED

```json
{
  "devDependencies": {
    "@playwright/test": "^1.56.1",       // E2E testing framework
    "@axe-core/playwright": "^4.10.2",   // Accessibility testing
    "@lhci/cli": "^0.15.1",              // Lighthouse CI runner
    "wait-on": "^9.0.1",                 // Wait for server ready
    "concurrently": "^9.2.1"             // Parallel script execution
  }
}
```

**Browsers Installed**: Chromium (via `npx playwright install chromium`)

---

## 📜 NPM SCRIPTS

```json
{
  "revisor:build": "pnpm build",                              // Build Next.js production
  "revisor:start": "pnpm start",                              // Start Next.js server (port 3000)
  "revisor:wait": "wait-on http://127.0.0.1:3000",            // Wait for server ready
  "revisor:test": "playwright test -c playwright.audit.config.ts", // Run Playwright E2E
  "revisor:lhci": "lhci autorun --collect.url=http://127.0.0.1:3000 --upload.target=filesystem --upload.outputDir=reports/lhci", // Run Lighthouse CI
  "revisor:axe": "node tests/a11y/run-axe.mjs",               // Run axe-core A11y
  "revisor:all": "concurrently -k -s first \"pnpm revisor:start\" \"pnpm revisor:wait && pnpm revisor:test && pnpm revisor:lhci && pnpm revisor:axe\"", // Full audit suite
  "revisor:report": "node scripts/audit-summarize.mjs"        // Generate INDEX.md summary
}
```

---

## 🚀 EXECUTION WORKFLOW

### Local Run

```powershell
cd C:\Work\Orchestrator\apps\admin

# Step 1: Build production
pnpm revisor:build

# Step 2: Run full audit suite
pnpm revisor:all
# (This will: start server → wait → run Playwright → run LHCI → run axe → stop server)

# Step 3: Generate summary report
pnpm revisor:report
# (Creates docs/_audit/<timestamp>/INDEX.md and docs/AUDIT-<timestamp>.md)
```

### CI Workflow (GitHub Actions)

**Trigger**: Push to `audit/**` branches or PR opened/synchronized

**Steps**:
1. Checkout code
2. Setup Node.js 22 with pnpm cache
3. Install dependencies (`pnpm install --frozen-lockfile`)
4. Install Playwright browsers (`npx playwright install --with-deps chromium`)
5. Build Next.js (`pnpm revisor:build`)
6. Run REVISOR suite (`pnpm revisor:all`)
7. Upload artifacts (Playwright HTML/JSON, LHCI reports, Axe JSON)
8. Comment PR with summary (if applicable)

**Workflow File**: `.github/workflows/revisor.yml`

---

## 📦 ARTIFACTS GENERATED

After execution, the following artifacts are available:

### Playwright
- `reports/playwright/html/index.html` — Interactive HTML report
- `reports/playwright/results.json` — JSON test results (parsable)
- `reports/playwright/screenshots/*.png` — Key step screenshots
- `reports/playwright/videos/*.webm` — Test run videos (on failure)
- `reports/playwright/traces/*.zip` — Trace files for Trace Viewer (on retry)

### Lighthouse CI
- `reports/lhci/*.html` — Performance reports
- `reports/lhci/*.json` — JSON metrics (scores, audits)

### Axe-core
- `reports/axe/home.json` — Accessibility violations for `/`
- `reports/axe/diagnostics.json` — Violations for `/diagnostics`
- `reports/axe/builder-v0.json` — Violations for `/builder-v0`

### Summary
- `docs/_audit/<timestamp>/INDEX.md` — Aggregated report (Playwright stats, LHCI links, Axe violations table, Top 3 issues)
- `docs/AUDIT-<timestamp>.md` — Root-level link to full report

---

## 🎨 PLAYWRIGHT CONFIG HIGHLIGHTS

```typescript
// playwright.audit.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,                 // 30s per test
  fullyParallel: true,                // Parallel execution
  retries: process.env.CI ? 2 : 0,    // 2 retries in CI
  workers: process.env.CI ? 1 : undefined, // 1 worker in CI (stability)
  
  reporter: [
    ['list'],                         // Console output
    ['html', { outputFolder: 'reports/playwright/html' }],
    ['json', { outputFile: 'reports/playwright/results.json' }],
    // ['allure-playwright', { outputFolder: 'reports/allure-results' }], // Optional
  ],
  
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',          // Trace on retry only (save disk space)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

---

## ⚡ LIGHTHOUSE CI CONFIG

```json
{
  "ci": {
    "collect": {
      "url": ["http://127.0.0.1:3000/"],
      "numberOfRuns": 3,
      "settings": {
        "chromeFlags": "--no-sandbox --disable-dev-shm-usage"
      }
    },
    "assert": {
      "categories:performance": ["warn", {"minScore": 0.7}],
      "categories:accessibility": ["error", {"minScore": 0.9}],
      "categories:best-practices": ["warn", {"minScore": 0.8}],
      "categories:seo": ["warn", {"minScore": 0.8}]
    }
  }
}
```

---

## 📊 AUDIT SUMMARIZE SCRIPT

**Purpose**: Collect all test results into a single INDEX.md

**What it Does**:
1. Parse `reports/playwright/results.json` → extract passed/failed/skipped counts
2. List LHCI JSON files
3. Parse `reports/axe/*.json` → count violations per page
4. Extract top 3 critical issues (from Playwright failures + Axe violations)
5. Generate `docs/_audit/<timestamp>/INDEX.md` with links to all artifacts
6. Create `docs/AUDIT-<timestamp>.md` as root-level link

**Output Example**:

```markdown
# REVISOR Audit Report

**Timestamp**: 2025-10-20T23:56:00Z
**Node**: v22.20.0
**Platform**: win32 x64

## 📊 Playwright E2E Tests
- ✅ **Passed**: 8
- ❌ **Failed**: 2
- ⏭️ **Skipped**: 0
- 📁 [HTML Report](../../reports/playwright/html/index.html)

### ⚠️ Failed Tests:
- **Design Mode: should apply changes to element** (tests/e2e/design-mode.spec.ts)
- **Jobs Queue: should open queue modal** (tests/e2e/jobs-queue.spec.ts)

## ⚡ Lighthouse CI (Performance)
- 📁 [LHCI Reports](../../reports/lhci/)
- **Files**: 6

## ♿ Axe-core Accessibility
| Page | Violations |
|------|------------|
| home | 3 |
| diagnostics | 1 |
| builder-v0 | 5 |

- 📁 [Axe Reports](../../reports/axe/)

## 🔥 Top 3 Critical Issues
1. **Playwright E2E**: Design Mode apply patch — iframe did not update (timeout)
2. **A11y (home)**: color-contrast — Ensures background/foreground color contrast
3. **A11y (builder-v0)**: aria-hidden-focus — Ensures focusable elements are not hidden

## 📦 Artifacts
- 🎬 [Videos & Traces](../../reports/playwright/)
- 📸 [Screenshots](../../reports/playwright/screenshots/)
- 📄 [JSON Results](../../reports/playwright/results.json)
- ⚡ [Lighthouse Reports](../../reports/lhci/)
- ♿ [Axe Reports](../../reports/axe/)
```

---

## 🔗 GITHUB PULL REQUEST

**Branch**: `audit/revisor-20251020-2356`  
**PR**: [#3 — REVISOR Audit: Reports Only (DO NOT MERGE)](https://github.com/offflinerpsy/orchestrator-v3/pull/3)

**Status**: 🟡 **Draft PR** (not intended for merge)

**Actions**:
- ✅ View test results in CI artifacts
- ✅ Create separate fix PRs for each issue
- ✅ Close this PR after migrating all findings

---

## 📋 COMMITS (7 total)

```
ec584b5 — chore(revisor): scaffold - structure, deps, playwright.audit.config
5469a38 — chore(revisor): run-scripts - npm scripts for build/test/lhci/axe/all
5e4690e — test(e2e): critical flows - sanity, design-mode, generation, queue, health
6ca0d41 — test(a11y+perf): axe-core script + lighthouserc config
1bc875f — ci(revisor): github actions workflow - windows, pnpm cache, upload artifacts
4c90e1d — docs(audit): summarize script - collect reports into INDEX.md
(HEAD) — Branch created: audit/revisor-20251020-2356
```

---

## ⚠️ KNOWN LIMITATIONS

1. **No Actual Execution Yet**: Тесты написаны, но **НЕ прогнаны** (awaiting `pnpm revisor:all`)
2. **Playwright Selectors**: May need adjustment if UI structure differs (locators based on roles/placeholders)
3. **LHCI Runs**: 3 runs может занять ~5 минут на слабых машинах
4. **Axe-core Pages**: Hardcoded list (`/`, `/diagnostics`, `/builder-v0`) — добавить больше если нужно
5. **CI Windows Runner**: GitHub Actions windows-latest может быть медленнее Linux (но closer to prod environment)

---

## 🎓 REFERENCES & DOCUMENTATION

**Playwright**:
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [Test Reporters](https://playwright.dev/docs/test-reporters)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Writing Tests](https://playwright.dev/docs/writing-tests)

**Axe-core**:
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Axe-core GitHub](https://github.com/dequelabs/axe-core)

**Lighthouse CI**:
- [Getting Started](https://googlechrome.github.io/lighthouse-ci/docs/getting-started.html)
- [GitHub Repository](https://github.com/GoogleChrome/lighthouse-ci)
- [Web.dev Article](https://web.dev/articles/lighthouse-ci)

**GitHub Actions**:
- [setup-node](https://github.com/actions/setup-node)
- [pnpm CI Guide](https://pnpm.io/continuous-integration)

**Next.js**:
- [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)

---

## ✅ SUCCESS CRITERIA

**REVISOR считается успешным, если**:
1. ✅ All E2E tests written and pass locally (0 flaky tests)
2. ✅ Axe-core violations < 10 per page (critical issues < 3)
3. ✅ Lighthouse Performance score > 0.7, Accessibility > 0.9
4. ✅ CI workflow runs without errors (artifacts uploaded)
5. ✅ Audit summary report generated with Top 3 issues
6. ✅ Separate fix PRs created for all critical findings

**Current Status**: ✅ **PHASE 1 COMPLETE** (infrastructure ready, awaiting execution)

---

## 🚦 NEXT STEPS

### Immediate (Phase 2)
1. **Run Locally**: `pnpm revisor:all` на development машине
2. **Review Reports**: Check `reports/playwright/html/index.html`, `reports/axe/*.json`, `reports/lhci/`
3. **Generate Summary**: `pnpm revisor:report` → review `docs/_audit/<timestamp>/INDEX.md`

### Short-term (Phase 3)
1. **Trigger CI**: Push commit to `audit/revisor-20251020-2356` → GitHub Actions runs
2. **Download Artifacts**: Check CI workflow run → download HTML reports
3. **Create Issues**: For each critical finding → create GitHub issue with details

### Long-term (Phase 4)
1. **Fix PRs**: Separate PR for each bug (e.g., "fix(design-mode): apply patch not working")
2. **Re-run REVISOR**: After fixes → create new audit branch → verify issues resolved
3. **Integrate into CI**: Add `revisor.yml` workflow to run on every PR (gating deployment)

---

## 🏁 CONCLUSION

**REVISOR v0** — полностью готов к работе. Вся инфраструктура настроена:
- ✅ Playwright E2E suite (5 critical flows)
- ✅ Axe-core A11y audit (3 pages)
- ✅ Lighthouse CI perf/SEO checks
- ✅ GitHub Actions CI workflow
- ✅ Audit summarize script

**Следующий шаг**: Прогнать локально `pnpm revisor:all` и посмотреть результаты.

**Финальный PR**: [#3](https://github.com/offflinerpsy/orchestrator-v3/pull/3) — **НЕ МЕРДЖИТЬ**, только для артефактов.

---

**Generated by**: REVISOR v0 (automated audit system)  
**Timestamp**: 2025-10-20 23:56 UTC  
**Author**: GitHub Copilot (GPT-5)
