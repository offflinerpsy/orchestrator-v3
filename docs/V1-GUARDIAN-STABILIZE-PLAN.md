# V1 Guardian · HARDEN & STABILIZE (Next 15 + Windows)

**Режим:** STABILIZE & OBSERVE  
**Цель:** Устранить "белый экран" и silent crashes AdminPanel  
**Запреты:** Никаких вызовов FLUX/v0 без `ALLOW_GENERATION=true`  
**Источники правды:** 
- Next.js App Router: https://nextjs.org/docs/app
- ComfyUI API: https://docs.comfy.org/
- NSSM: https://nssm.cc/
- Prometheus: https://github.com/siimon/prom-client
- Grafana Loki: https://grafana.com/docs/loki/
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

## 🎯 Проблемы, которые это устраняет

### 1. Port 3000 не слушается / "немой" краш
**Причина:** 
- Next.js 15 + module-level side effects в `lib/env.ts`, `lib/logger.ts`
- Unhandled rejections не видны
- Нет Global Error boundary

**Решение:**
- Node 20 LTS (стабильная версия)
- `--trace-uncaught --unhandled-rejections=strict`
- App Router Error UI (`error.tsx`, `global-error.tsx`)
- Ленивая инициализация env/logger

**Ссылки:**
- https://nextjs.org/docs/app/building-your-application/routing/error-handling
- https://nodejs.org/docs/latest-v20.x/api/cli.html#--unhandled-rejectionsmode

---

### 2. CORS/секреты/нестабильный фронт
**Причина:**
- Прямые fetch из браузера к ComfyUI, FLUX API, v0
- API keys в клиентском коде

**Решение:**
- Все внешние запросы через Route Handlers (`app/api/**/route.ts`)
- Клиент ходит только в `/api/**`

**Ссылки:**
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

### 3. ComfyUI "то вижу, то не вижу"
**Причина:**
- Неправильные эндпоинты
- Неправильный формат workflow

**Решение:**
- Использовать официальные маршруты:
  - `GET /system_stats` — статус
  - `GET /object_info` — модели
  - `POST /prompt` — запуск workflow
  - `GET /history` — прогресс
- API-формат workflow (Save API format в ComfyUI)

**Ссылки:**
- https://docs.comfy.org/essentials/comfyui_api

---

### 4. Guardian не "держит" систему
**Причина:**
- Guardian падает вместе с AdminPanel
- Нет автоматического перезапуска

**Решение:**
- Guardian как отдельная NSSM служба Windows
- Независимый процесс с auto-restart
- Пингует `/api/health` каждые 15s
- Перезапускает упавшие службы

**Ссылки:**
- https://nssm.cc/usage

---

### 5. Отсутствие картины мира
**Причина:**
- Нет логов (только console)
- Нет метрик
- Нет трейсинга ошибок

**Решение:**
- Sentry — error tracking + performance
- Prometheus — метрики (`/api/metrics`)
- Loki + Promtail — централизованные логи
- Grafana — визуализация

**Ссылки:**
- https://docs.sentry.io/platforms/javascript/guides/nextjs/
- https://github.com/siimon/prom-client
- https://grafana.com/docs/loki/latest/setup/install/local/

---

## 📋 План работы (короткие PR)

### Phase 0: Предполётная подготовка
**Branch:** `fix/runtime-baseline`  
**Время:** 30 минут  
**Цель:** Фиксация Node.js LTS, жёсткие флаги рантайма

#### Задачи:
1. ✅ Создать `.nvmrc` и `.node-version` → `20.17.0`
2. ✅ Обновить `package.json` scripts:
   ```json
   {
     "scripts": {
       "dev": "NODE_OPTIONS='--trace-uncaught --unhandled-rejections=strict' next dev",
       "start": "NODE_OPTIONS='--trace-uncaught --unhandled-rejections=strict' next start"
     }
   }
   ```
3. ✅ Добавить pre-start хук проверки порта 3000
   - Если занят → auto-increment 3001/3002
   - Вывод ссылки в консоль и Guardian
4. ✅ Проверить `pnpm run build && pnpm run start`

#### Приёмка:
- [ ] Build успешен
- [ ] Start не падает "тихо"
- [ ] Любые ошибки видны в логе/консоли

#### Коммит:
```
fix(runtime): enforce Node 20 LTS and strict error handling

- Add .nvmrc and .node-version (20.17.0)
- Enable --trace-uncaught and --unhandled-rejections=strict
- Add port check hook (3000 → 3001/3002 auto-increment)

Min Node for Next 15: 18.18.0, using LTS 20.x for stability
Ref: https://nodejs.org/docs/latest-v20.x/api/cli.html
```

---

### Phase A: Error UI и граница client/server
**Branch:** `fix/error-boundary-hydration`  
**Время:** 45 минут  
**Цель:** Корректные error boundaries, разделение client/server

#### Задачи:
1. ✅ Создать `app/error.tsx` (client error boundary)
   ```tsx
   'use client'
   
   export default function Error({
     error,
     reset,
   }: {
     error: Error & { digest?: string }
     reset: () => void
   }) {
     return (
       <div>
         <h2>❌ Что-то пошло не так!</h2>
         <p>{error.message}</p>
         <button onClick={reset}>Перезагрузить</button>
       </div>
     )
   }
   ```

2. ✅ Создать `app/global-error.tsx` (root error boundary)
   ```tsx
   'use client'
   
   export default function GlobalError({
     error,
     reset,
   }: {
     error: Error & { digest?: string }
     reset: () => void
   }) {
     return (
       <html>
         <body>
           <h2>🔥 Критическая ошибка</h2>
           <p>{error.message}</p>
           <button onClick={reset}>Перезагрузить страницу</button>
         </body>
       </html>
     )
   }
   ```

3. ✅ Аудит всех компонентов:
   - `window`, `document`, `localStorage` → `'use client'` + optional `dynamic(..., { ssr: false })`
   - `fs`, `child_process`, `sc.exe`, `.bat` → только в `app/api/**/route.ts`

4. ✅ Проверить гидрацию (dev + prod)

#### Приёмка:
- [ ] Вместо "белого экрана" — понятное Error UI
- [ ] Гидрация не падает
- [ ] Server-only код не попадает в клиентский бандл

#### Коммит:
```
fix(ui): add error boundaries and client/server separation

- Add app/error.tsx (client error boundary, RU text)
- Add app/global-error.tsx (root error boundary)
- Move window/document code to 'use client' components
- Ensure server-only code (fs, child_process) stays in Route Handlers

Fixes white screen crashes, improves hydration stability
Ref: https://nextjs.org/docs/app/building-your-application/routing/error-handling
```

---

### Phase B: Прокси-слой
**Branch:** `fix/api-proxy`  
**Время:** 60 минут  
**Цель:** Все внешние запросы через серверные Route Handlers

#### Задачи:
1. ✅ Создать `app/api/comfy/[...path]/route.ts`
   ```typescript
   import { NextRequest } from 'next/server'
   
   export async function GET(
     request: NextRequest,
     { params }: { params: { path: string[] } }
   ) {
     const path = params.path.join('/')
     const url = `http://127.0.0.1:8188/${path}`
     
     const response = await fetch(url, {
       method: request.method,
       headers: { 'Content-Type': 'application/json' },
     })
     
     return new Response(response.body, {
       status: response.status,
       headers: { 'Content-Type': 'application/json' },
     })
   }
   
   export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
     // Same proxy logic for POST
   }
   ```
   **Ref:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

2. ✅ Создать `app/api/flux/generate/route.ts`
   ```typescript
   import { env } from '@/lib/env'
   
   const fluxSchema = z.object({
     prompt: z.string().min(1),
     raw: z.boolean().optional(),
     aspect_ratio: z.string().optional(),
     seed: z.number().optional(),
     image_prompt: z.string().url().optional(),
     image_prompt_strength: z.number().min(0).max(1).optional(),
     output_format: z.enum(['jpeg', 'png']).default('jpeg'),
   })
   
   export async function POST(request: Request) {
     // Check ALLOW_GENERATION flag
     if (env.ALLOW_GENERATION !== 'true') {
       return Response.json({ error: 'Generation disabled (ALLOW_GENERATION=false)' }, { status: 403 })
     }
     
     // Validate payload
     const body = await request.json()
     const validated = fluxSchema.parse(body)
     
     // Call FLUX API
     const response = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'X-Key': env.BFL_API_KEY,
       },
       body: JSON.stringify(validated),
     })
     
     return Response.json(await response.json())
   }
   ```
   **Ref:** https://docs.bfl.ml/ (FLUX 1.1 Pro/Ultra docs)

3. ✅ Создать `app/api/v0/[...path]/route.ts` (прокси на v0)

4. ✅ Обновить клиентский код:
   - Заменить `fetch('http://127.0.0.1:8188/...')` → `fetch('/api/comfy/...')`
   - Заменить `fetch('https://api.bfl.ml/...')` → `fetch('/api/flux/generate')`

#### Приёмка:
- [ ] В DevTools нет CORS/preflight ошибок
- [ ] API keys не видны в Network tab
- [ ] Все запросы идут через `/api/**`

#### Коммит:
```
feat(api): add server-side proxy layer for external services

- Add /api/comfy/[...path] proxy to ComfyUI (localhost:8188)
- Add /api/flux/generate with ALLOW_GENERATION guard and Zod validation
- Add /api/v0/[...path] proxy to v0.dev API
- Update client code to use /api/** endpoints

Eliminates CORS, hides API keys from browser
Ref: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
```

---

### Phase C: ComfyUI как "правильный" сервис
**Branch:** `fix/comfy-api`  
**Время:** 45 минут  
**Цель:** Официальные ComfyUI endpoints, API-формат workflow

#### Задачи:
1. ✅ Добавить проверку статуса:
   ```typescript
   // app/api/comfy/status/route.ts
   export async function GET() {
     const statsResponse = await fetch('http://127.0.0.1:8188/system_stats')
     const stats = await statsResponse.json()
     
     const objectInfoResponse = await fetch('http://127.0.0.1:8188/object_info')
     const objectInfo = await objectInfoResponse.json()
     
     const models = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || []
     
     return Response.json({
       online: statsResponse.ok,
       stats,
       models: models.length,
       modelList: models,
     })
   }
   ```

2. ✅ Использовать API-формат workflow:
   - В ComfyUI UI: Settings → Enable Dev mode Options
   - Save workflow → "Save (API Format)"
   - Отправка в `POST /api/comfy/prompt`

3. ✅ Проверка прогресса:
   - `GET /api/comfy/history/{prompt_id}` или WebSocket `/ws`

4. ✅ Обновить UI панели:
   - Показать статус ComfyUI (online/offline)
   - Показать количество моделей
   - Dry-run кнопка (валидация workflow без генерации)

#### Приёмка:
- [ ] Статус "online" и модели видны в UI
- [ ] Dry-run workflow не падает
- [ ] API-формат workflow корректно отправляется

#### Коммит:
```
feat(comfy): use official ComfyUI API endpoints

- Add /api/comfy/status (system_stats + object_info)
- Use API-format workflows (Save API Format)
- Add workflow validation (dry-run mode)
- Display ComfyUI status and model count in UI

Ref: https://docs.comfy.org/essentials/comfyui_api
```

---

### Phase D: Guardian как отдельная служба
**Branch:** `guardian/service-nssm`  
**Время:** 90 минут  
**Цель:** Guardian как NSSM служба Windows, мониторинг /api/health

#### Задачи:
1. ✅ Обновить `services/guardian/src/index.ts`:
   ```typescript
   import pino from 'pino'
   import { checkHealth } from './monitors/health-check'
   import { restartService } from './recovery/restart-service'
   
   const logger = pino({
     level: 'info',
     transport: { target: 'pino-pretty' },
   })
   
   async function healthCheckLoop() {
     setInterval(async () => {
       const health = await checkHealth('http://localhost:3000/api/health')
       
       if (!health.ok) {
         logger.warn({ service: 'AdminPanel', status: health.status }, 'Health check failed')
         
         // Auto-restart
         if (health.status === 'unhealthy') {
           await restartService('OrchestratorAdminPanel')
         }
       } else {
         logger.info({ service: 'AdminPanel', status: 'healthy' }, 'Health check OK')
       }
     }, 15000) // 15s
   }
   
   healthCheckLoop()
   ```

2. ✅ JSON логи с ротацией:
   ```typescript
   import { pino } from 'pino'
   import { createWriteStream } from 'pino-roll'
   
   const stream = createWriteStream({
     file: 'F:/Logs/guardian.log',
     size: '10M',
     interval: '1d',
   })
   
   const logger = pino(stream)
   ```

3. ✅ NSSM установка:
   - Скачать NSSM: https://nssm.cc/download
   - Скрипт `scripts/install-nssm-services.ps1`:
     ```powershell
     # Install ComfyUI service
     nssm install OrchestratorComfyUI "python.exe" "F:\ComfyUI\main.py"
     nssm set OrchestratorComfyUI AppDirectory "F:\ComfyUI"
     nssm set OrchestratorComfyUI AppStdout "F:\Logs\comfyui-stdout.log"
     nssm set OrchestratorComfyUI AppStderr "F:\Logs\comfyui-stderr.log"
     nssm set OrchestratorComfyUI AppStdoutCreationDisposition 4
     nssm set OrchestratorComfyUI AppStderrCreationDisposition 4
     nssm set OrchestratorComfyUI AppRotateFiles 1
     nssm set OrchestratorComfyUI AppRotateOnline 1
     nssm set OrchestratorComfyUI AppRotateSeconds 86400
     nssm set OrchestratorComfyUI AppRotateBytes 10485760
     
     # Install AdminPanel service
     nssm install OrchestratorAdminPanel "node.exe" "C:\Work\Orchestrator\apps\admin\.next\standalone\server.js"
     nssm set OrchestratorAdminPanel AppDirectory "C:\Work\Orchestrator\apps\admin"
     nssm set OrchestratorAdminPanel AppStdout "F:\Logs\adminpanel-stdout.log"
     nssm set OrchestratorAdminPanel AppStderr "F:\Logs\adminpanel-stderr.log"
     
     # Install Guardian service
     nssm install OrchestratorGuardian "node.exe" "C:\Work\Orchestrator\services\guardian\dist\index.js"
     nssm set OrchestratorGuardian AppDirectory "C:\Work\Orchestrator\services\guardian"
     nssm set OrchestratorGuardian AppStdout "F:\Logs\guardian-stdout.log"
     nssm set OrchestratorGuardian AppStderr "F:\Logs\guardian-stderr.log"
     
     # Start all
     nssm start OrchestratorComfyUI
     nssm start OrchestratorAdminPanel
     nssm start OrchestratorGuardian
     ```

4. ✅ Страница "Диагностика" в AdminPanel:
   - Статусы всех служб (цветные индикаторы)
   - Кнопки Start/Stop/Restart (через `/api/system/*`)

#### Приёмка:
- [ ] Guardian работает как служба Windows
- [ ] Перезапуск упавшей службы срабатывает автоматически
- [ ] Падения пишутся в F:\Logs\*.log
- [ ] Кнопка "Ignite" поднимает всё "красное"

#### Коммит:
```
feat(guardian): implement as NSSM Windows service

- Add health check loop (15s interval)
- Add auto-restart logic for failed services
- Add JSON logging with rotation (F:\Logs\*.log)
- Add NSSM installation scripts for ComfyUI/AdminPanel/Guardian
- Add Diagnostics page with service status and controls

Ref: https://nssm.cc/usage
```

---

### Phase E: Управление службами через API
**Branch:** `fix/system-handlers`  
**Время:** 45 минут  
**Цель:** Серверные хендлеры для управления Windows службами

#### Задачи:
1. ✅ Создать `app/api/system/comfy/start/route.ts`:
   ```typescript
   import { exec } from 'child_process'
   import { promisify } from 'util'
   
   const execAsync = promisify(exec)
   
   export async function POST() {
     try {
       await execAsync('nssm start OrchestratorComfyUI')
       return Response.json({ success: true, service: 'ComfyUI', action: 'start' })
     } catch (error) {
       return Response.json({ success: false, error: String(error) }, { status: 500 })
     }
   }
   ```

2. ✅ Аналогично для:
   - `/api/system/comfy/stop/route.ts`
   - `/api/system/comfy/status/route.ts`
   - `/api/system/panel/start|stop|status/route.ts`

3. ✅ Создать `/api/system/ignite/route.ts`:
   ```typescript
   export async function POST() {
     const services = ['OrchestratorComfyUI', 'OrchestratorAdminPanel', 'OrchestratorGuardian']
     const results = []
     
     for (const service of services) {
       try {
         const { stdout } = await execAsync(`nssm status ${service}`)
         
         if (!stdout.includes('SERVICE_RUNNING')) {
           await execAsync(`nssm start ${service}`)
           results.push({ service, action: 'started' })
         } else {
           results.push({ service, action: 'already_running' })
         }
       } catch (error) {
         results.push({ service, error: String(error) })
       }
     }
     
     return Response.json({ results })
   }
   ```

#### Приёмка:
- [ ] `/api/system/comfy/start` запускает ComfyUI
- [ ] `/api/system/ignite` поднимает все "лежащие" службы
- [ ] Кнопки в UI работают корректно

#### Коммит:
```
feat(api): add system service control endpoints

- Add /api/system/comfy/start|stop|status
- Add /api/system/panel/start|stop|status
- Add /api/system/ignite (start all stopped services)

Server-side only (NSSM commands via child_process)
Ref: https://nssm.cc/commands
```

---

### Phase F: Наблюдаемость "из коробки"
**Branch:** `obs/sentry-prom-loki`  
**Время:** 120 минут  
**Цель:** Sentry, Prometheus, Loki/Promtail, Grafana

#### Задачи F1: Sentry (30 мин)
1. ✅ Установить Sentry SDK:
   ```bash
   pnpm add @sentry/nextjs
   pnpx @sentry/wizard@latest -i nextjs
   ```

2. ✅ Создать `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs'
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     debug: false,
     replaysOnErrorSampleRate: 1.0,
     replaysSessionSampleRate: 0.1,
   })
   ```

3. ✅ Создать `sentry.server.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs'
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 0.1,
   })
   ```

4. ✅ Добавить в `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

**Ref:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

#### Задачи F2: Prometheus метрики (30 мин)
1. ✅ Установить `prom-client`:
   ```bash
   pnpm add prom-client
   ```

2. ✅ Создать `app/api/metrics/route.ts`:
   ```typescript
   import { Registry, Counter, Histogram } from 'prom-client'
   
   const register = new Registry()
   
   const httpRequestsTotal = new Counter({
     name: 'http_requests_total',
     help: 'Total HTTP requests',
     labelNames: ['method', 'route', 'status'],
     registers: [register],
   })
   
   const httpRequestDuration = new Histogram({
     name: 'http_request_duration_seconds',
     help: 'HTTP request latency',
     labelNames: ['method', 'route'],
     registers: [register],
   })
   
   export async function GET() {
     const metrics = await register.metrics()
     return new Response(metrics, {
       headers: { 'Content-Type': register.contentType },
     })
   }
   ```

**Ref:** https://github.com/siimon/prom-client

#### Задачи F3: Windows Exporter (20 мин)
1. ✅ Скачать windows_exporter: https://github.com/prometheus-community/windows_exporter/releases
2. ✅ Установить как служба:
   ```powershell
   windows_exporter-amd64.exe --collectors.enabled cpu,memory,logical_disk,net
   ```
3. ✅ Метрики доступны на `http://localhost:9182/metrics`

**Ref:** https://prometheus.io/docs/guides/node-exporter/

#### Задачи F4: Loki + Promtail (40 мин)
1. ✅ Скачать Loki и Promtail для Windows: https://grafana.com/docs/loki/latest/setup/install/local/
2. ✅ Создать `loki-config.yaml`:
   ```yaml
   auth_enabled: false
   
   server:
     http_listen_port: 3100
   
   ingester:
     lifecycler:
       ring:
         kvstore:
           store: inmemory
         replication_factor: 1
   
   schema_config:
     configs:
       - from: 2020-10-24
         store: boltdb-shipper
         object_store: filesystem
         schema: v11
         index:
           prefix: index_
           period: 24h
   
   storage_config:
     boltdb_shipper:
       active_index_directory: F:/Loki/index
       cache_location: F:/Loki/cache
     filesystem:
       directory: F:/Loki/chunks
   ```

3. ✅ Создать `promtail-config.yaml`:
   ```yaml
   server:
     http_listen_port: 9080
   
   positions:
     filename: F:/Promtail/positions.yaml
   
   clients:
     - url: http://localhost:3100/loki/api/v1/push
   
   scrape_configs:
     - job_name: orchestrator
       static_configs:
         - targets:
             - localhost
           labels:
             job: orchestrator
             __path__: F:/Logs/*.log
   ```

4. ✅ Запустить как службы NSSM:
   ```powershell
   nssm install Loki "loki-windows-amd64.exe" "-config.file=loki-config.yaml"
   nssm install Promtail "promtail-windows-amd64.exe" "-config.file=promtail-config.yaml"
   ```

**Ref:** https://grafana.com/docs/loki/latest/setup/install/local/

#### Приёмка:
- [ ] `/api/metrics` отдаёт текст формата Prometheus
- [ ] Sentry ловит тестовую ошибку (throw в route handler)
- [ ] Grafana подключена к Loki (видны логи из F:\Logs\*.log)
- [ ] Grafana подключена к Prometheus (метрики windows_exporter)

#### Коммит:
```
feat(obs): add Sentry, Prometheus, Loki/Promtail observability stack

- Add Sentry SDK (client + server, DSN from .env.local)
- Add /api/metrics endpoint (prom-client)
- Add windows_exporter for OS metrics
- Add Loki + Promtail for centralized logs
- Add links to Grafana/Sentry in AdminPanel UI

Ref: https://docs.sentry.io/platforms/javascript/guides/nextjs/
Ref: https://github.com/siimon/prom-client
Ref: https://grafana.com/docs/loki/latest/setup/install/local/
```

---

### Phase G: Тест "белый экран не вернётся"
**Branch:** `tests/smoke-playwright`  
**Время:** 45 минут  
**Цель:** Playwright smoke-тесты с визуальным регрессом

#### Задачи:
1. ✅ Установить Playwright:
   ```bash
   pnpm add -D @playwright/test
   pnpx playwright install
   ```

2. ✅ Создать `tests/smoke.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test'
   
   test('home page loads', async ({ page }) => {
     await page.goto('http://localhost:3000')
     await expect(page).toHaveTitle(/Orchestrator/)
     await expect(page).toHaveScreenshot('home.png')
   })
   
   test('builder page loads', async ({ page }) => {
     await page.goto('http://localhost:3000/builder')
     await expect(page.locator('h1')).toContainText('Builder')
     await expect(page).toHaveScreenshot('builder.png')
   })
   
   test('diagnostics page shows services', async ({ page }) => {
     await page.goto('http://localhost:3000/diagnostics')
     
     // Click "Ignite" button
     await page.click('button:has-text("Запуск системы")')
     
     // Wait for services to start
     await page.waitForTimeout(10000)
     
     // Check for green indicators
     const comfyStatus = page.locator('[data-testid="comfy-status"]')
     await expect(comfyStatus).toHaveClass(/text-green/)
     
     await expect(page).toHaveScreenshot('diagnostics-green.png')
   })
   ```

3. ✅ Обновить `package.json`:
   ```json
   {
     "scripts": {
       "test:smoke": "playwright test tests/smoke.spec.ts"
     }
   }
   ```

#### Приёмка:
- [ ] `pnpm run test:smoke` проходит успешно
- [ ] Скриншоты сохранены в `tests/__screenshots__/`
- [ ] Визуальный регресс-тест ловит изменения UI

#### Коммит:
```
test(smoke): add Playwright visual regression tests

- Add smoke tests for /, /builder, /diagnostics
- Add screenshot comparison (prevent white screen regression)
- Add "Ignite" button test (services start correctly)

Ref: https://playwright.dev/docs/test-snapshots
```

---

### Phase H: Конфиг и env-хардeнинг
**Branch:** `fix/env-config-hardening`  
**Время:** 60 минут  
**Цель:** Безопасная обработка env, ленивая инициализация logger

#### Задачи:
1. ✅ Обновить `lib/env.ts`:
   ```typescript
   import { z } from 'zod'
   import * as Sentry from '@sentry/nextjs'
   
   const envSchema = z.object({
     BFL_API_KEY: z.string().min(1),
     COMFY_URL: z.string().url(),
     V0_API_KEY: z.string().optional(),
     DATA_DIR: z.string().optional(),
     ALLOW_GENERATION: z.enum(['true', 'false']).default('false'),
     LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   })
   
   function parseEnv() {
     const result = envSchema.safeParse(process.env)
     
     if (!result.success) {
       const errors = result.error.flatten().fieldErrors
       
       // Log to Sentry
       Sentry.captureException(new Error('Environment validation failed'), {
         extra: { errors },
       })
       
       // Log to console
       console.error('❌ Проверка переменных окружения не прошла:')
       console.error(JSON.stringify(errors, null, 2))
       
       // Return safe defaults + error state
       return {
         ...envSchema.parse({
           BFL_API_KEY: 'missing',
           COMFY_URL: 'http://127.0.0.1:8188',
         }),
         _validationError: errors,
       }
     }
     
     return result.data
   }
   
   export const env = parseEnv()
   ```

2. ✅ Обновить `lib/logger.ts`:
   ```typescript
   import pino from 'pino'
   
   let _logger: pino.Logger | null = null
   
   export function getLogger() {
     if (!_logger) {
       // Lazy initialization
       const env = process.env.NODE_ENV || 'development'
       const level = process.env.LOG_LEVEL || 'info'
       
       _logger = pino({
         level,
         transport: env === 'development' ? {
           target: 'pino-pretty',
           options: { colorize: true },
         } : undefined,
       })
     }
     
     return _logger
   }
   
   // Backward compatibility
   export const logger = new Proxy({} as pino.Logger, {
     get(target, prop) {
       return getLogger()[prop as keyof pino.Logger]
     },
   })
   ```

3. ✅ Показать ошибки env в UI:
   ```typescript
   // app/layout.tsx
   import { env } from '@/lib/env'
   
   export default function RootLayout({ children }) {
     if (env._validationError) {
       return (
         <html>
           <body>
             <div style={{ padding: '20px', background: 'red', color: 'white' }}>
               <h1>⚠️ Ошибка конфигурации</h1>
               <p>Проверьте файл .env.local:</p>
               <pre>{JSON.stringify(env._validationError, null, 2)}</pre>
             </div>
           </body>
         </html>
       )
     }
     
     return <html><body>{children}</body></html>
   }
   ```

#### Приёмка:
- [ ] При битых env — чёткое сообщение в UI и Sentry
- [ ] Не "тихое" падение с exit code 1
- [ ] Logger инициализируется лениво (не падает при импорте)

#### Коммит:
```
fix(env): add safe environment validation with fallbacks

- Replace hard throw in parseEnv() with safeParse (Zod)
- Send validation errors to Sentry
- Show RU-text error UI for missing/invalid env vars
- Make logger initialization lazy (avoid module-level crash)

Eliminates silent crashes from env validation
Ref: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
```

---

### Phase I: Финальный проход ревизора
**Branch:** `fix/final-audit`  
**Время:** 90 минут  
**Цель:** Проверка всех фич, финальный отчёт

#### Задачи:
1. ✅ Прогон сборки:
   ```bash
   pnpm run build
   pnpm run start
   ```

2. ✅ Проверка эндпоинтов:
   - `http://localhost:3000/` — главная
   - `http://localhost:3000/builder` — без белого экрана
   - `http://localhost:3000/diagnostics` — зелёные индикаторы
   - `http://localhost:3000/api/health` — JSON ответ
   - `http://localhost:3000/api/metrics` — Prometheus метрики

3. ✅ Проверка Guardian:
   - `nssm status OrchestratorGuardian` → RUNNING
   - Логи в `F:\Logs\guardian-stdout.log` (JSON)
   - Health checks каждые 15s

4. ✅ Проверка падений:
   - Остановить ComfyUI: `nssm stop OrchestratorComfyUI`
   - Через 30s Guardian должен перезапустить
   - Логи Guardian показывают "Service restarted"

5. ✅ Проверка Sentry:
   - Бросить тестовую ошибку в route handler
   - Проверить в Sentry dashboard

6. ✅ Проверка Grafana:
   - Открыть Grafana (localhost:3000)
   - Добавить Loki data source (localhost:3100)
   - Добавить Prometheus data source (localhost:9090)
   - Видны логи из F:\Logs\*.log
   - Видны метрики windows_exporter

7. ✅ Создать `FINAL-AUDIT-REPORT.md`:
   ```markdown
   # Final Audit Report — V1 Guardian STABILIZE

   ## Executive Summary
   - All crashes fixed
   - Guardian running as NSSM service
   - Observability stack operational
   - No white screens

   ## Issues Fixed
   1. Silent crashes → Error boundaries + strict flags
   2. CORS issues → Route Handlers proxy
   3. ComfyUI instability → Official API endpoints
   4. No monitoring → Sentry + Prometheus + Loki

   ## PR Summary
   - fix/runtime-baseline (Node 20 LTS, strict flags)
   - fix/error-boundary-hydration (Error UI)
   - fix/api-proxy (Route Handlers)
   - fix/comfy-api (Official endpoints)
   - guardian/service-nssm (NSSM service)
   - fix/system-handlers (Service control API)
   - obs/sentry-prom-loki (Observability)
   - tests/smoke-playwright (Visual regression)
   - fix/env-config-hardening (Safe env)
   - fix/final-audit (This report)

   ## Screenshots
   [Attach: Grafana dashboard, Sentry errors, Diagnostics page green]

   ## Next Steps
   - Monitor production for 1 week
   - Tune Prometheus alert rules
   - Add more Playwright tests
   ```

#### Приёмка:
- [ ] Все системы работают
- [ ] Guardian перезапускает упавшие службы
- [ ] Sentry ловит ошибки
- [ ] Grafana показывает метрики/логи
- [ ] Финальный отчёт создан

#### Коммит:
```
docs(audit): add final stabilization audit report

- Verified all phases (0-H) working
- Tested Guardian auto-restart (30s cooldown)
- Confirmed Sentry error tracking
- Confirmed Grafana metrics + logs
- Screenshots attached

All silent crashes eliminated, observability operational
Related: V1-GUARDIAN-STABILIZE-PLAN.md
```

---

## 📊 Общая статистика

### Время выполнения
```
Phase 0: 30 min  (Runtime baseline)
Phase A: 45 min  (Error boundaries)
Phase B: 60 min  (API proxy)
Phase C: 45 min  (ComfyUI API)
Phase D: 90 min  (Guardian NSSM)
Phase E: 45 min  (System handlers)
Phase F: 120 min (Observability)
Phase G: 45 min  (Smoke tests)
Phase H: 60 min  (Env hardening)
Phase I: 90 min  (Final audit)
─────────────────
TOTAL: 630 min (~10.5 hours)
```

### PR разбивка
```
10 отдельных PR (ветки)
Каждый PR — 1 фича, 1 коммит
Все ссылки на доки в коммитах
```

### Запреты соблюдены
```
✅ Никаких FLUX/v0 вызовов без ALLOW_GENERATION=true
✅ Все внешние запросы через Route Handlers
✅ API keys не в браузере
✅ Все доки в комментариях кода
```

---

## 🚀 Как начать

### 1. Checkout baseline branch
```bash
git checkout -b fix/runtime-baseline
```

### 2. Выполнить Phase 0
- Создать `.nvmrc` и `.node-version`
- Обновить `package.json` scripts
- Добавить port check hook
- Коммит + push

### 3. Повторить для Phase A-I
- Создать ветку
- Выполнить задачи
- Приёмка
- Коммит + push
- Merge в main

### 4. Финальная проверка
- Все службы работают
- Guardian мониторит
- Sentry/Grafana подключены

---

**План утверждён.** Готов к выполнению по фазам.
