# 🛡️ V1 Guardian — Мастер-план стабилизации и мониторинга

**Дата создания:** 2025-10-19  
**Статус:** В разработке  
**Ветка:** `feat/v1-guardian`  
**Цель:** Автономная система мониторинга, автозапуска и диагностики

---

## 📖 Оглавление

1. [Концепция](#концепция)
2. [Архитектура](#архитектура)
3. [Roadmap (10 спринтов)](#roadmap)
4. [Технологический стек](#технологический-стек)
5. [Интеграция с текущей системой](#интеграция)
6. [Метрики успеха](#метрики-успеха)

---

## 🎯 Концепция

### Проблема
**Текущая ситуация (коммит 9b2f1c8):**
- ✅ Sprint 1 завершён (8/8 задач): service control, error boundaries, FLUX dry-run
- ❌ Dev server крашит на старте (Exit code 1)
- ❌ Нет автозапуска служб при старте Windows
- ❌ Нет централизованного мониторинга (логи/метрики/ошибки)
- ❌ Нет смоук-тестов и визуальной регрессии
- ❌ Отсутствие автоматических баг-отчётов

### Решение: V1 Guardian
**Автономная служба Windows (Node.js/TypeScript), которая:**

1. **Мониторит** стек 24/7 (ComfyUI, AdminPanel, внешние API)
2. **Восстанавливает** упавшие службы автоматически
3. **Собирает** логи/метрики/ошибки в единую систему наблюдаемости
4. **Гоняет** смоук-тесты (Playwright) по расписанию
5. **Генерирует** структурированные баг-отчёты с контекстом
6. **Предотвращает** белый экран через визуальные снимки

---

## 🏗️ Архитектура

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                     Windows OS (Auto-start)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   ComfyUI   │  │  AdminPanel  │  │  V1 Guardian │       │
│  │   Service   │  │   Service    │  │   Service    │       │
│  │  (NSSM)     │  │   (NSSM)     │  │   (NSSM)     │       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                │                  │                │
│         │    ┌───────────▼───────────┐      │                │
│         └───►│  Next.js App Router   │◄─────┘                │
│              │   /api/health         │                       │
│              │   /api/metrics        │                       │
│              │   /api/guardian/*     │                       │
│              └───────────┬───────────┘                       │
│                          │                                   │
│         ┌────────────────┼────────────────┐                  │
│         │                │                │                  │
│    ┌────▼─────┐   ┌─────▼──────┐   ┌────▼─────┐            │
│    │  Sentry  │   │ Prometheus │   │   Loki   │            │
│    │  (Cloud) │   │  + Grafana │   │+ Promtail│            │
│    └──────────┘   └────────────┘   └──────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Служба V1 Guardian

**Расположение:** `C:\Work\Orchestrator\services\guardian\`

**Структура:**
```
services/
└── guardian/
    ├── index.ts              # Main entry point
    ├── config.ts             # Configuration (intervals, thresholds)
    ├── monitors/
    │   ├── health-check.ts   # Ping /api/health
    │   ├── service-watch.ts  # Monitor Windows services
    │   ├── disk-watch.ts     # Check F:\ space
    │   └── api-watch.ts      # Test ComfyUI/FLUX/v0
    ├── recovery/
    │   ├── restart-service.ts # Auto-restart failed services
    │   └── escalation.ts      # Create bug reports
    ├── testing/
    │   ├── smoke-runner.ts    # Run Playwright tests
    │   └── visual-diff.ts     # Compare screenshots
    ├── reporting/
    │   ├── bug-report.ts      # Generate MD reports
    │   └── metrics.ts         # Custom Prometheus metrics
    └── utils/
        ├── logger.ts          # Structured JSON logging
        └── alerts.ts          # Send notifications
```

---

## 🗓️ Roadmap (10 спринтов × 2 дня)

### Sprint 0: Подготовка (ТЕКУЩИЙ)
**Цель:** Зафиксировать план, обновить документацию

**Задачи:**
- [x] Создать `V1-GUARDIAN-MASTER-PLAN.md`
- [ ] Обновить `PROJECT-RULES.md` (добавить правила мониторинга)
- [ ] Создать `services/guardian/` структуру
- [ ] Запушить plan в Git

**Deliverables:**
- Документация согласована
- Структура папок создана
- Branch `feat/v1-guardian` готов

---

### Sprint 1: Фундамент Guardian Service
**Приоритет:** P0  
**Длительность:** 2 дня

**Задачи:**
1. **Служба Guardian как NSSM**
   - `scripts/install-guardian-service.ps1`
   - `services/guardian/index.ts` — базовый цикл мониторинга
   - Старт/стоп через `/api/guardian/control`

2. **Health Check Endpoint**
   - Рефактор `/api/status` → `/api/health`
   - Добавить: `services`, `comfy`, `models`, `diskF`, `memory`
   - JSON-формат совместимый с Kubernetes liveness/readiness

3. **Базовый мониторинг**
   - `monitors/health-check.ts` — каждые 30 секунд ping `/api/health`
   - `monitors/service-watch.ts` — проверка PID служб
   - Логирование в `F:\Logs\guardian\guardian.log` (JSON)

**Proof of Concept:**
```bash
# Установка Guardian
.\scripts\install-guardian-service.ps1

# Проверка работы
nssm status V1Guardian  # → RUNNING

# Health check
curl http://localhost:3000/api/health
# {
#   "status": "healthy",
#   "timestamp": "2025-10-19T20:00:00.000Z",
#   "services": {
#     "comfy": {"status": "running", "pid": 12345},
#     "panel": {"status": "running", "pid": 67890}
#   },
#   "comfy": {"vram": 11GB, "queue": 0},
#   "disk": {"F": {"free": 250GB, "total": 500GB}}
# }
```

**Deliverables:**
- Guardian работает как служба Windows
- `/api/health` возвращает полный статус
- Логи пишутся в JSON

---

### Sprint 2: Auto-Recovery
**Приоритет:** P0  
**Длительность:** 2 дня

**Задачи:**
1. **Автоматический перезапуск служб**
   - `recovery/restart-service.ts`
   - При падении ComfyUI → `nssm restart OrchestratorComfyUI`
   - При падении Panel → `nssm restart OrchestratorPanel`
   - Cooldown 30 секунд между попытками

2. **Escalation Logic**
   - 3 неудачных перезапуска подряд → создать баг-отчёт
   - `recovery/escalation.ts` → вызов `reporting/bug-report.ts`

3. **Баг-отчёты**
   - `reporting/bug-report.ts`
   - Формат: `F:\Logs\reports\BUG-YYYYMMDD-HHMM.md`
   - Содержимое:
     - Timestamp
     - Упавший сервис
     - Последние 50 строк логов
     - Health check snapshot
     - ComfyUI /system_stats (если доступен)
     - Sentry последние ошибки (если интегрирован)

**Proof:**
```bash
# Тест: убить ComfyUI вручную
taskkill /PID <comfy-pid> /F

# Guardian должен:
# 1. Обнаружить падение через 30 сек
# 2. Перезапустить службу
# 3. Проверить успешный старт
# 4. Залогировать событие

# Проверка логов
type F:\Logs\guardian\guardian.log | findstr "recovery"
# {"level":"warn","service":"ComfyUI","action":"restart","attempt":1}
# {"level":"info","service":"ComfyUI","status":"recovered"}
```

**Deliverables:**
- Автоматический recovery работает
- Баг-отчёты генерируются
- Escalation предотвращает бесконечные рестарты

---

### Sprint 3: Prometheus Metrics
**Приоритет:** P1  
**Длительность:** 2 дня

**Задачи:**
1. **Metrics Endpoint**
   - Установить `prom-client` в admin panel
   - `/api/metrics` — Prometheus text format
   - Метрики:
     - `orchestrator_http_requests_total{method,path,status}`
     - `orchestrator_http_request_duration_seconds{method,path}`
     - `orchestrator_comfy_queue_depth`
     - `orchestrator_disk_free_bytes{disk="F"}`
     - `orchestrator_service_up{service="comfy|panel|guardian"}`

2. **Windows Exporter**
   - Установить `windows_exporter` как служба
   - Конфиг: CPU, RAM, Disk I/O, Network
   - Порт: 9182

3. **Guardian Custom Metrics**
   - `reporting/metrics.ts`
   - `guardian_restarts_total{service}`
   - `guardian_health_check_duration_seconds`
   - `guardian_last_check_timestamp`

4. **Prometheus Server**
   - Установить Prometheus локально (или Docker)
   - `prometheus.yml`:
     ```yaml
     scrape_configs:
       - job_name: 'orchestrator'
         static_configs:
           - targets: ['localhost:3000']  # /api/metrics
       
       - job_name: 'windows'
         static_configs:
           - targets: ['localhost:9182']  # windows_exporter
       
       - job_name: 'guardian'
         static_configs:
           - targets: ['localhost:9091']  # Guardian pushgateway
     ```

**Proof:**
```bash
# Проверка метрик AdminPanel
curl http://localhost:3000/api/metrics
# # HELP orchestrator_http_requests_total Total HTTP requests
# # TYPE orchestrator_http_requests_total counter
# orchestrator_http_requests_total{method="GET",path="/api/health",status="200"} 1234

# Проверка Windows Exporter
curl http://localhost:9182/metrics | findstr "windows_cpu"

# Prometheus UI
start http://localhost:9090/targets
# All targets должны быть UP
```

**Deliverables:**
- `/api/metrics` работает
- Prometheus собирает метрики
- Windows metrics доступны

---

### Sprint 4: Grafana Dashboards
**Приоритет:** P1  
**Длительность:** 2 дня

**Задачи:**
1. **Grafana Setup**
   - Установить Grafana (MSI installer или Docker)
   - Добавить Prometheus как data source
   - Порт: 3003 (не конфликтует с Next.js 3000)

2. **Dashboard: V1 System Overview**
   - Панели:
     - Service Status (comfy/panel/guardian) — Single Stat
     - HTTP Request Rate — Graph
     - Request Duration P50/P95/P99 — Graph
     - ComfyUI Queue Depth — Graph
     - Disk Free Space (F:) — Gauge
     - CPU/RAM Usage — Graph (из windows_exporter)
   - Сохранить как `grafana/dashboards/v1-system-overview.json`

3. **Dashboard: Guardian Operations**
   - Панели:
     - Restart Events (timeline)
     - Health Check Success Rate
     - Recovery Duration
     - Bug Reports Generated (counter)

4. **Интеграция в UI**
   - Страница `/diagnostics` добавить кнопку:
     - **"Открыть Grafana"** → `http://localhost:3003/d/v1-system`

**Proof:**
```bash
# Grafana доступна
start http://localhost:3003

# Dashboard показывает live-данные
# - Service status: зелёные индикаторы
# - Request rate: реальный трафик
# - Queue depth: 0 (если нет задач)
```

**Deliverables:**
- Grafana установлена
- 2 дашборда настроены
- Кнопка в UI работает

---

### Sprint 5: Sentry Integration
**Приоритет:** P1  
**Длительность:** 2 дня

**Задачи:**
1. **Sentry Setup**
   - Создать проект на sentry.io (или self-hosted)
   - Получить DSN
   - Добавить в `.env.local`:
     ```bash
     SENTRY_DSN=https://...@o...ingest.sentry.io/...
     SENTRY_ORG=orchestrator
     SENTRY_PROJECT=v1-admin
     ```

2. **Next.js Integration**
   - Установить `@sentry/nextjs`
   - Создать `sentry.client.config.ts` и `sentry.server.config.ts`
   - Добавить `sentry.edge.config.ts` (для middleware)
   - В `next.config.js`:
     ```js
     const { withSentryConfig } = require('@sentry/nextjs')
     module.exports = withSentryConfig(config, {
       silent: true,
       org: process.env.SENTRY_ORG,
       project: process.env.SENTRY_PROJECT
     })
     ```

3. **Guardian Integration**
   - В `services/guardian/index.ts` добавить Sentry client
   - Отправлять ошибки при:
     - Неудачном recovery
     - Health check timeout
     - Service crash

4. **Bug Report Enhancement**
   - В `reporting/bug-report.ts` добавить:
     - Ссылка на Sentry issue (если есть)
     - Last 5 events из Sentry API

5. **UI Integration**
   - В `/diagnostics` добавить секцию "Последние ошибки":
     - Fetch из Sentry API (или встроить виджет)
     - Кнопка "Открыть Sentry Dashboard"

**Proof:**
```bash
# Тест: бросить ошибку в dev mode
# В любом API route:
throw new Error('Test Sentry integration')

# Sentry Dashboard должен показать:
# - Error message
# - Stack trace
# - Request context (URL, headers)
# - User info (если есть)
```

**Deliverables:**
- Sentry ловит ошибки фронта и бэка
- Guardian отправляет критические события
- Bug reports содержат Sentry ссылки

---

### Sprint 6: Grafana Loki + Promtail
**Приоритет:** P2  
**Длительность:** 2 дня

**Задачи:**
1. **Loki Setup**
   - Установить Grafana Loki (Windows binary или Docker)
   - Конфиг `loki-local-config.yaml`:
     ```yaml
     auth_enabled: false
     server:
       http_listen_port: 3100
     ingester:
       lifecycler:
         ring:
           kvstore:
             store: inmemory
     schema_config:
       configs:
         - from: 2020-01-01
           store: boltdb-shipper
           object_store: filesystem
           schema: v11
     storage_config:
       boltdb_shipper:
         active_index_directory: F:/Loki/index
         cache_location: F:/Loki/cache
       filesystem:
         directory: F:/Loki/chunks
     ```

2. **Promtail Setup (Windows)**
   - Скачать Promtail Windows binary
   - Конфиг `promtail-config.yaml`:
     ```yaml
     server:
       http_listen_port: 9080
     
     clients:
       - url: http://localhost:3100/loki/api/v1/push
     
     scrape_configs:
       - job_name: guardian
         static_configs:
           - targets:
               - localhost
             labels:
               job: guardian
               __path__: F:/Logs/guardian/*.log
       
       - job_name: comfy
         static_configs:
           - targets:
               - localhost
             labels:
               job: comfy
               __path__: F:/ComfyUI/logs/*.log
       
       - job_name: admin
         static_configs:
           - targets:
               - localhost
             labels:
               job: admin
               __path__: C:/Work/Orchestrator/apps/admin/logs/*.log
     ```

3. **Structured Logging**
   - Убедиться что все логи в JSON:
     - Guardian: уже JSON (pino)
     - AdminPanel: уже JSON (pino)
     - ComfyUI: добавить wrapper (или парсить plain text)

4. **Grafana Data Source**
   - Добавить Loki в Grafana
   - URL: `http://localhost:3100`

5. **Dashboard: Logs Explorer**
   - Создать дашборд с Loki queries:
     - `{job="guardian"} |= "error"`
     - `{job="comfy"} |= "CUDA"`
     - `{job="admin"} |= "api"`
   - Фильтры: level, service, timestamp

6. **UI Integration**
   - В `/diagnostics` добавить:
     - "Открыть логи (Grafana Loki)"
     - Инлайн-виджет: последние 10 строк логов Guardian

**Proof:**
```bash
# Loki работает
curl http://localhost:3100/ready
# ready

# Promtail отправляет логи
curl http://localhost:9080/metrics | findstr "promtail_sent_entries_total"
# promtail_sent_entries_total 1234

# Grafana Explore
# Query: {job="guardian"}
# Result: JSON логи Guardian с полями timestamp, level, message
```

**Deliverables:**
- Loki + Promtail работают
- Логи всех сервисов агрегируются
- Grafana показывает unified logs

---

### Sprint 7: Playwright Smoke Tests
**Приоритет:** P1  
**Длительность:** 2 дня

**Задачи:**
1. **Playwright Setup**
   - Установить в `apps/admin`:
     ```bash
     pnpm add -D @playwright/test
     pnpm exec playwright install chromium
     ```
   - Создать `playwright.config.ts`:
     ```ts
     export default defineConfig({
       testDir: './tests/e2e',
       webServer: {
         command: 'pnpm run start',  // Prod build
         port: 3000,
         reuseExistingServer: true
       },
       use: {
         baseURL: 'http://localhost:3000',
         screenshot: 'only-on-failure',
         trace: 'retain-on-failure'
       },
       reporter: [
         ['html', { outputFolder: 'playwright-report' }],
         ['json', { outputFile: 'playwright-results.json' }]
       ]
     })
     ```

2. **Smoke Tests**
   - `tests/e2e/homepage.spec.ts`:
     ```ts
     test('homepage loads without crash', async ({ page }) => {
       await page.goto('/')
       await expect(page.locator('h1')).toContainText('V1')
       await expect(page).toHaveScreenshot('homepage.png')
     })
     ```
   
   - `tests/e2e/diagnostics.spec.ts`:
     ```ts
     test('diagnostics shows system status', async ({ page }) => {
       await page.goto('/diagnostics')
       await expect(page.locator('text=System Status')).toBeVisible()
       await expect(page).toHaveScreenshot('diagnostics.png')
     })
     ```
   
   - `tests/e2e/ignite.spec.ts`:
     ```ts
     test('ignite button exists', async ({ page }) => {
       await page.goto('/')
       const igniteBtn = page.locator('button:has-text("Запуск системы")')
       await expect(igniteBtn).toBeVisible()
     })
     ```

3. **Guardian Integration**
   - `services/guardian/testing/smoke-runner.ts`:
     ```ts
     import { exec } from 'child_process'
     import { promisify } from 'util'
     
     export async function runSmokeTests() {
       const { stdout, stderr } = await promisify(exec)(
         'pnpm exec playwright test',
         { cwd: 'C:/Work/Orchestrator/apps/admin' }
       )
       
       return {
         passed: !stderr.includes('failed'),
         output: stdout,
         timestamp: new Date().toISOString()
       }
     }
     ```
   
   - Запуск по расписанию: каждые 6 часов
   - При провале → баг-отчёт с screenshots

4. **Visual Regression**
   - Baseline screenshots в `tests/e2e/__screenshots__/`
   - При изменении UI → обновить baseline:
     ```bash
     pnpm exec playwright test --update-snapshots
     ```

**Proof:**
```bash
# Запуск вручную
cd C:\Work\Orchestrator\apps\admin
pnpm exec playwright test

# Результат:
# Running 3 tests using 1 worker
#   ✓ homepage.spec.ts:3:1 › homepage loads without crash (1.2s)
#   ✓ diagnostics.spec.ts:3:1 › diagnostics shows system status (0.8s)
#   ✓ ignite.spec.ts:3:1 › ignite button exists (0.5s)
# 3 passed (2.5s)
```

**Deliverables:**
- Playwright настроен
- 3+ smoke тестов работают
- Guardian запускает тесты по расписанию
- Visual regression snapshots зафиксированы

---

### Sprint 8: Переименование в V1
**Приоритет:** P2  
**Длительность:** 1 день

**Задачи:**
1. **Rebrand в UI**
   - `app/layout.tsx` → title: "V1 — AI Orchestrator"
   - Главная страница → "V1" вместо "Orchestrator V6"
   - Favicon (если есть)

2. **Документация**
   - `README.md` → описание V1
   - `PROJECT-RULES.md` → упоминание V1
   - Все артефакты в `docs/`

3. **Package.json**
   - `name: "v1-orchestrator"`
   - `description: "V1 — Stable AI Generation Platform"`

4. **Службы Windows**
   - Переименовать:
     - `OrchestratorComfyUI` → `V1ComfyUI`
     - `OrchestratorPanel` → `V1AdminPanel`
     - `OrchestratorGuardian` → `V1Guardian`
   - Обновить скрипты установки

**Proof:**
- Браузер показывает "V1" в title
- Службы имеют новые имена
- README актуален

**Deliverables:**
- Полный rebrand завершён
- Документация обновлена

---

### Sprint 9: Strict TypeScript + ESLint
**Приоритет:** P2  
**Длительность:** 1 день

**Задачи:**
1. **TypeScript Strict Mode**
   - `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "strict": true,
         "noImplicitAny": true,
         "strictNullChecks": true,
         "strictFunctionTypes": true,
         "noUnusedLocals": true,
         "noUnusedParameters": true
       }
     }
     ```
   - Исправить все ошибки компиляции

2. **ESLint Rules**
   - `.eslintrc.json`:
     ```json
     {
       "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
       "rules": {
         "@typescript-eslint/no-explicit-any": "error",
         "@typescript-eslint/no-unused-vars": "error",
         "no-console": "warn"
       }
     }
     ```

3. **Pre-commit Hooks**
   - Установить `husky` + `lint-staged`
   - `.husky/pre-commit`:
     ```bash
     #!/bin/sh
     pnpm run lint
     pnpm run typecheck
     ```

**Proof:**
```bash
# Build проходит без ошибок
pnpm run build
# ✓ Compiled successfully

# Lint чистый
pnpm run lint
# ✓ No ESLint warnings or errors
```

**Deliverables:**
- Strict TypeScript включён
- ESLint настроен
- Pre-commit hooks работают

---

### Sprint 10: Финальная интеграция и документация
**Приоритет:** P0  
**Длительность:** 2 дня

**Задачи:**
1. **Unified Setup Script**
   - `scripts/setup-v1-complete.ps1`:
     - Установить все NSSM службы
     - Установить Prometheus/Grafana/Loki
     - Установить windows_exporter
     - Настроить Sentry
     - Запустить Playwright baseline
     - Проверить `/api/health`

2. **Documentation Hub**
   - `docs/README.md` — индекс всей документации
   - `docs/QUICKSTART.md` — запуск за 5 минут
   - `docs/ARCHITECTURE.md` — диаграммы компонентов
   - `docs/TROUBLESHOOTING.md` — частые проблемы

3. **UI Polish**
   - Страница `/about` — про V1 Guardian
   - Tooltips на русском (все кнопки)
   - Loading states (spinners)
   - Error states (понятные сообщения)

4. **Testing Everything**
   - Сценарий 1: Чистая установка Windows → `setup-v1-complete.ps1` → всё работает
   - Сценарий 2: Убить ComfyUI → Guardian восстанавливает за 30 сек
   - Сценарий 3: Смоук-тесты проходят
   - Сценарий 4: Grafana показывает метрики
   - Сценарий 5: Sentry ловит ошибки

5. **Final Report**
   - `docs/V1-GUARDIAN-FINAL-REPORT.md`:
     - Все 10 спринтов завершены
     - Proof для каждого компонента
     - Метрики (uptime, recovery time, test pass rate)
     - Known Issues
     - Roadmap V2

**Proof:**
- Setup script запускает всю систему одной командой
- Документация полная и актуальная
- UI без багов
- Все тесты зелёные

**Deliverables:**
- V1 Guardian полностью рабочий
- Документация release-ready
- Презентация для stakeholders готова

---

## 🛠️ Технологический стек

### Runtime & Framework
| Компонент | Технология | Версия |
|-----------|------------|--------|
| Backend | Next.js App Router | 15.0.3 |
| Frontend | React | 18.3.1 |
| Runtime | Node.js | 22.20.0 |
| Package Manager | pnpm | 8+ |

### Мониторинг & Observability
| Компонент | Технология | Цель |
|-----------|------------|------|
| Errors | Sentry | Захват исключений фронт+бэк |
| Metrics | Prometheus + prom-client | Метрики приложения |
| System Metrics | windows_exporter | CPU/RAM/Disk/Network |
| Logs | Grafana Loki + Promtail | Unified log aggregation |
| Dashboards | Grafana | Визуализация метрик/логов |
| Traces (опц.) | OpenTelemetry | Distributed tracing |

### Testing
| Компонент | Технология | Цель |
|-----------|------------|------|
| E2E Tests | Playwright | Smoke tests + visual regression |
| Unit Tests (опц.) | Vitest | Бизнес-логика |

### Infrastructure
| Компонент | Технология | Цель |
|-----------|------------|------|
| Service Management | NSSM | Windows службы с автозапуском |
| Database | Better-SQLite3 | Локальная БД (jobs, messages) |
| Logging | Pino | Structured JSON logs |

---

## 🔗 Интеграция с текущей системой

### Что уже есть (коммит 9b2f1c8)
✅ **Sprint 1 завершён:**
- `lib/service-control.ts` — управление службами через sc.exe
- `/api/system/comfy/start|stop|status` — REST API для служб
- `/api/system/ignite` — массовый запуск
- `/api/status` — health check (базовый)
- `app/error.tsx` + `app/global-error.tsx` — error boundaries
- FLUX dry-run mode (`ALLOW_GENERATION` flag)
- `scripts/install-comfy-service.ps1` — NSSM setup ComfyUI

### Что нужно добавить

#### 1. Рефакторинг существующих endpoints
**Файл:** `/api/status/route.ts` → `/api/health/route.ts`
- Переименовать для Kubernetes-стиля
- Добавить: `diskF`, `memory`, `uptime`
- Формат ответа:
  ```json
  {
    "status": "healthy|degraded|unhealthy",
    "timestamp": "ISO8601",
    "services": {...},
    "comfy": {...},
    "system": {
      "diskF": {"free": "250GB", "total": "500GB"},
      "memory": {"used": "16GB", "total": "32GB"},
      "uptime": "3d 5h 12m"
    }
  }
  ```

#### 2. Новые endpoints для Guardian
- `/api/guardian/control` — POST start/stop Guardian
- `/api/guardian/status` — GET статус Guardian
- `/api/guardian/run-smoke` — POST запуск смоук-тестов вручную
- `/api/metrics` — GET Prometheus metrics

#### 3. Интеграция с UI
**Страница:** `/diagnostics` (существует)

**Добавить секции:**
- **System Health** — зелёные/красные индикаторы (уже есть)
- **Grafana** — кнопка "Открыть дашборды" → новое окно
- **Sentry** — "Последние ошибки" → встроенный виджет
- **Logs** — "Открыть Loki" → Grafana Explore
- **Guardian** — статус сторожа + кнопка "Запустить смоук-тесты"

#### 4. Обновление NSSM скриптов
**Добавить:**
- `scripts/install-panel-service.ps1` — AdminPanel как служба
- `scripts/install-guardian-service.ps1` — V1 Guardian как служба
- `scripts/uninstall-all-services.ps1` — деинсталляция

**Обновить:**
- `scripts/install-comfy-service.ps1` → добавить restart policy

---

## 📊 Метрики успеха

### Критерии завершения (Definition of Done)

| Метрика | Цель | Текущее | После V1 |
|---------|------|---------|----------|
| Uptime (7 дней) | >99% | ~85% (ручные рестарты) | >99% (auto-recovery) |
| Recovery Time | <60 сек | ~5 мин (ручной) | <30 сек (auto) |
| White Screen Events | 0 | 2-3/неделю | 0 (visual regression) |
| Bug Reports Generated | Авто | Вручную | Авто каждый инцидент |
| Smoke Tests Pass Rate | >95% | Не запускаются | >98% |
| Build Success Rate | 100% | 100% | 100% |
| Sentry Error Rate | <10/день | N/A | <5/день |
| Prometheus Targets UP | 100% | N/A | 100% |

### KPIs (Key Performance Indicators)

**Availability:**
- 99.5% uptime за месяц
- MTTR (Mean Time To Recovery) < 1 минута
- MTTD (Mean Time To Detect) < 30 секунд

**Quality:**
- 0 белых экранов в production
- <5 critical errors в Sentry за неделю
- 100% smoke tests passed

**Efficiency:**
- Setup time новой машины < 30 минут
- Time to first bug report < 2 минуты после инцидента
- Developer onboarding < 1 час

---

## 🚀 Начало работы

### Prerequisites
- Windows 10/11 Pro (для NSSM служб)
- Node.js 22.20+
- pnpm 8+
- PowerShell 7+ (рекомендуется)
- Git
- ComfyUI установлен в `F:\ComfyUI`

### Quick Start (после Sprint 10)
```powershell
# 1. Клонировать репозиторий
git clone https://github.com/offflinerpsy/orchestrator-v3.git
cd orchestrator-v3

# 2. Установить зависимости
pnpm install

# 3. Настроить .env.local
cp apps/admin/.env.example apps/admin/.env.local
# Заполнить: BFL_API_KEY, V0_API_KEY, SENTRY_DSN

# 4. Запустить полную установку (требует Admin)
.\scripts\setup-v1-complete.ps1

# 5. Открыть панель
start http://localhost:3000

# 6. Проверить Grafana
start http://localhost:3003
```

---

## 📞 Поддержка и FAQ

### Частые вопросы

**Q: Как вручную перезапустить Guardian?**
```powershell
nssm restart V1Guardian
```

**Q: Где логи Guardian?**
```
F:\Logs\guardian\guardian.log
```

**Q: Как обновить Playwright snapshots?**
```bash
cd apps/admin
pnpm exec playwright test --update-snapshots
```

**Q: Sentry не ловит ошибки?**
- Проверить `SENTRY_DSN` в `.env.local`
- Убедиться что `@sentry/nextjs` установлен
- Проверить `sentry.*.config.ts` файлы

**Q: Prometheus не видит /api/metrics?**
- Проверить `prometheus.yml` scrape config
- Убедиться что AdminPanel запущен
- Тест: `curl http://localhost:3000/api/metrics`

---

## 🗺️ Roadmap V2 (после V1)

### Планируемые улучшения
1. **Docker Support** — контейнеризация всех сервисов
2. **Multi-machine Setup** — распределённая архитектура
3. **Advanced Alerting** — интеграция с Telegram/Discord
4. **ML-based Anomaly Detection** — предсказание падений
5. **Auto-scaling ComfyUI** — динамическое управление нагрузкой
6. **Cloud Backup** — автоматические бэкапы в S3/OneDrive
7. **Web UI для Guardian** — dashboard вместо логов
8. **API Rate Limiting** — защита от DDOS
9. **OAuth Authentication** — secure login
10. **Mobile App** — мониторинг с телефона

---

## 📝 Changelog

### v1.0.0 (Планируется)
- ✅ Sprint 0: Master Plan создан
- ⏳ Sprint 1: Guardian Service + Health Check
- ⏳ Sprint 2: Auto-Recovery
- ⏳ Sprint 3-10: ...

---

**Автор:** РЕВИЗОР++ Agent  
**Дата:** 2025-10-19  
**Версия документа:** 1.0  
**Статус:** Draft → Review Required
