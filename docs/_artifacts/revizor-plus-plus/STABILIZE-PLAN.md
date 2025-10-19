# РЕВИЗОР++ · STABILIZE — План стабилизации Orchestrator v3

**Дата:** 2025-10-19  
**Ветка:** `feat/tilda-import` (текущий коммит: `82f8610`)  
**Режим:** Жёсткая стабилизация БЕЗ генераций  
**Запрет:** Платные API (FLUX) только с `ALLOW_GENERATION=true`

---

## 📊 Текущее состояние (коммит 82f8610)

### ✅ Завершено (Evil Audit P0-P3):
- Recursive proxy loop устранён (lib/flux-client, lib/comfy-client)
- Database path portable (env/paths.json)
- Environment validation (Zod schema в lib/env.ts)
- Structured logging (pino)
- Toast notifications (sonner)
- Lazy path resolution (getJobsDir/getOutDir)

### ⚠️ Критические проблемы:
1. **Службы Windows:** `spawn` в `/api/system/ignite` — нет NSSM, нестабильный старт
2. **Child_process на сервере:** `/api/comfyui/service` запускает CMD напрямую
3. **FLUX без dry-run:** `/api/flux/generate` сразу вызывает платный API
4. **Нет Error UI:** Отсутствуют `app/error.tsx` и `app/global-error.tsx`
5. **Client/Server граница:** Потенциальная гидрация в компонентах
6. **ComfyUI paths:** Нет валидации `extra_model_paths.yaml`
7. **Диагностика:** Страница `/diagnostics` не показывает статусы служб
8. **Нет тестов:** Playwright отсутствует

---

## 📋 TODO-МАТРИЦА (30 пунктов)

### БЛОК A: Службы Windows (NSSM) — 5 пунктов

#### ✅ A1. Установка ComfyUI как службы NSSM
**Branch:** `fix/nssm-comfy-service`  
**Priority:** P0 (критично)  
**Description:**
- Создать PowerShell скрипт `scripts/install-comfy-service.ps1`
- Установить NSSM (`choco install nssm` или вручную)
- Настроить службу `OrchestratorComfyUI`:
  ```powershell
  nssm install OrchestratorComfyUI "F:\ComfyUI\run_nvidia_gpu.bat"
  nssm set OrchestratorComfyUI AppDirectory F:\ComfyUI
  nssm set OrchestratorComfyUI AppStdout F:\ComfyUI\logs\stdout.log
  nssm set OrchestratorComfyUI AppStderr F:\ComfyUI\logs\stderr.log
  nssm set OrchestratorComfyUI AppRotateFiles 1
  nssm set OrchestratorComfyUI AppRotateBytes 10485760
  ```
- Документировать в `docs/SETUP-GUIDE.md`

**Proof:**
- `nssm status OrchestratorComfyUI` → `SERVICE_RUNNING`
- Логи в `F:\ComfyUI\logs\stdout.log`

---

#### ✅ A2. Управление службами через sc/nssm
**Branch:** `fix/service-control-api`  
**Priority:** P0  
**Files:**
- `app/api/system/comfy/start/route.ts` — замена `spawn` на `sc start OrchestratorComfyUI`
- `app/api/system/comfy/stop/route.ts` — `sc stop`
- `app/api/system/comfy/status/route.ts` — парсинг `sc query`

**Implementation:**
```typescript
// app/api/system/comfy/start/route.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const { stdout } = await execAsync('sc start OrchestratorComfyUI')
    return Response.json({ 
      success: stdout.includes('START_PENDING') || stdout.includes('RUNNING'),
      output: stdout 
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

**Proof:**
- `curl -X POST http://localhost:3000/api/system/comfy/start` → `{"success":true}`
- Служба запускается без ошибок

---

#### ✅ A3. Удалить spawn из /api/comfyui/service
**Branch:** `fix/remove-direct-spawn`  
**Priority:** P0  
**Description:**
- **Удалить** `/api/comfyui/service/route.ts` (устаревший endpoint)
- Клиент переключить на `/api/system/comfy/start`
- Обновить фронтенд компоненты (`service-cards.tsx`)

**Proof:**
- `grep -r "spawn" apps/admin/app/api/` → 0 результатов (кроме `/system/*`)

---

#### ✅ A4. Ignite API — централизованный старт
**Branch:** `fix/ignite-unified`  
**Priority:** P1  
**Files:** `app/api/system/ignite/route.ts`

**Logic:**
1. Проверить статус служб: `sc query OrchestratorComfyUI`
2. Если `STOPPED` → `sc start OrchestratorComfyUI`
3. Ждать 10 секунд
4. Проверить доступность ComfyUI: `GET http://127.0.0.1:8188/system_stats`
5. Вернуть результат: `{ comfy: "online", panel: "dev", worker: "n/a" }`

**Proof:**
- Клик «Ignite» → через 15 сек все статусы зелёные

---

#### ✅ A5. Документация по NSSM setup
**Branch:** `docs/nssm-setup`  
**Priority:** P2  
**Files:** `docs/SETUP-GUIDE.md`, `docs/NSSM-SERVICES.md`

**Content:**
```markdown
# Установка служб Windows

## 1. ComfyUI
nssm install OrchestratorComfyUI F:\ComfyUI\run_nvidia_gpu.bat
nssm set OrchestratorComfyUI AppDirectory F:\ComfyUI
nssm start OrchestratorComfyUI

## 2. Panel (production)
cd apps/admin && pnpm run build
nssm install OrchestratorPanel "node" "C:\Work\Orchestrator\apps\admin\.next\standalone\server.js"
```

---

### БЛОК B: Прокси API (CORS, токены) — 6 пунктов

#### ✅ B1. Универсальный ComfyUI прокси
**Branch:** `fix/comfy-proxy-catch-all`  
**Priority:** P0  
**New file:** `app/api/comfy/[...path]/route.ts`

**Implementation:**
```typescript
import { NextRequest } from 'next/server'

const COMFY_BASE = 'http://127.0.0.1:8188'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join('/') || ''
  const url = new URL(req.url)
  const target = `${COMFY_BASE}/${path}${url.search}`
  
  const res = await fetch(target, {
    headers: { 'accept': req.headers.get('accept') || '*/*' },
    signal: AbortSignal.timeout(10000)
  })
  
  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
  })
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join('/') || ''
  const target = `${COMFY_BASE}/${path}`
  
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') || 'application/json' },
    body: await req.arrayBuffer(),
    signal: AbortSignal.timeout(30000)
  })
  
  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
  })
}
```

**Migration:**
- Удалить `/api/comfy/prompt`, `/api/comfy/queue`, `/api/comfy/models` и т.д.
- Клиент использует `/api/comfy/prompt`, `/api/comfy/object_info` через catch-all

**Proof:**
- `fetch('/api/comfy/system_stats')` → ответ без CORS
- DevTools не показывает preflight OPTIONS

---

#### ✅ B2. FLUX dry-run режим
**Branch:** `fix/flux-dry-run`  
**Priority:** P0  
**Files:** `app/api/flux/generate/route.ts`

**Changes:**
1. Добавить параметр `dryRun: boolean` в body
2. Если `!dryRun` → вернуть валидацию payload без вызова BFL:
   ```json
   {
     "dryRun": true,
     "valid": true,
     "payload": { "prompt": "...", "width": 1024, ... },
     "estimatedCost": "$0.04",
     "message": "Payload valid. Set dryRun=false to execute."
   }
   ```
3. Если `dryRun === false` → проверить env `ALLOW_GENERATION=true`
4. Если `ALLOW_GENERATION !== 'true'` → вернуть 403

**Proof:**
- POST без `dryRun=false` → `{"dryRun":true,"valid":true}`
- POST с `dryRun=false` и `ALLOW_GENERATION=false` → 403
- Нет вызовов к `api.bfl.ai` без явного подтверждения

---

#### ✅ B3. v0 Platform API прокси
**Branch:** `fix/v0-proxy`  
**Priority:** P1  
**New file:** `app/api/v0/[...path]/route.ts`

**Similar logic:**
```typescript
const V0_BASE = 'https://api.v0.dev'
const V0_API_KEY = env.V0_API_KEY

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join('/') || ''
  const target = `${V0_BASE}/${path}`
  
  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${V0_API_KEY}`,
      'content-type': 'application/json'
    },
    body: await req.text(),
    signal: AbortSignal.timeout(60000)
  })
  
  return new Response(res.body, { status: res.status })
}
```

**Proof:**
- Клиент вызывает `/api/v0/chat` → нет утечки ключа

---

#### ✅ B4. Удалить старые специализированные прокси
**Branch:** `refactor/remove-duplicate-proxies`  
**Priority:** P2  
**Action:**
- Удалить `/api/comfy/prompt`, `/api/comfy/history/[id]`, `/api/comfy/queue`, `/api/comfy/models`, `/api/comfy/interrupt`
- Клиент переключить на `/api/comfy/[...path]`

---

#### ✅ B5. Добавить rate limiting
**Branch:** `feat/rate-limiting`  
**Priority:** P3  
**Library:** `@upstash/ratelimit` или simple in-memory cache

**Implementation:**
```typescript
// lib/rate-limit.ts
const limits = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(ip: string, maxRequests = 10, window = 60000) {
  const now = Date.now()
  const key = ip
  const record = limits.get(key)
  
  if (!record || now > record.reset) {
    limits.set(key, { count: 1, reset: now + window })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.reset - now) / 1000) }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}
```

**Apply to:** `/api/flux/*`, `/api/v0/*`

---

#### ✅ B6. Логирование прокси запросов
**Branch:** `feat/proxy-logging`  
**Priority:** P3  
**Implementation:**
- Добавить `logger.info()` в catch-all прокси:
  ```typescript
  logger.info({
    message: 'Proxy request',
    method: req.method,
    path: `/${params.path.join('/')}`,
    ip: req.headers.get('x-forwarded-for') || req.ip,
    status: res.status,
    duration: Date.now() - start
  })
  ```

---

### БЛОК C: Client/Server граница и гидрация — 5 пунктов

#### ✅ C1. Аудит 'use client' директив
**Branch:** `audit/use-client-directives`  
**Priority:** P1  
**Action:**
- Проверить все компоненты с DOM API (window, canvas, WebSocket)
- Добавить `'use client'` где нужно
- Файлы для проверки:
  - `components/generation-form.tsx`
  - `components/comfyui-monitor.tsx`
  - `components/ignite-button.tsx`
  - `components/queue-panel.tsx`

**Proof:**
- Нет hydration warnings в консоли браузера

---

#### ✅ C2. Dynamic import для WebGL/Canvas
**Branch:** `fix/dynamic-canvas-import`  
**Priority:** P2  
**Implementation:**
```typescript
// components/canvas-viewer.tsx
'use client'
import dynamic from 'next/dynamic'

const CanvasViewerCore = dynamic(
  () => import('./canvas-viewer-core'),
  { ssr: false, loading: () => <div>Loading canvas...</div> }
)

export function CanvasViewer(props) {
  return <CanvasViewerCore {...props} />
}
```

---

#### ✅ C3. Error UI (error.tsx + global-error.tsx)
**Branch:** `feat/error-boundaries`  
**Priority:** P0  
**New files:**
- `app/error.tsx`
- `app/global-error.tsx`

**Implementation:**
```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
```

**Proof:**
- Искусственная ошибка → показывается Error UI вместо белого экрана

---

#### ✅ C4. TypeScript strict mode
**Branch:** `refactor/typescript-strict`  
**Priority:** P2  
**Changes:** `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Fix errors incrementally**

---

#### ✅ C5. Удалить fs/child_process из клиентских компонентов
**Branch:** `fix/remove-node-apis-client`  
**Priority:** P1  
**Action:**
- Найти все импорты `fs`, `child_process`, `path` в файлах БЕЗ `'use server'` или `/api/`
- Перенести логику на сервер

**Proof:**
- `grep -r "import.*from 'fs'" apps/admin/components/` → 0 результатов

---

### БЛОК D: ComfyUI — пути, API-формат — 4 пункта

#### ✅ D1. Валидация extra_model_paths.yaml
**Branch:** `feat/validate-model-paths`  
**Priority:** P1  
**New file:** `app/api/comfy/validate-paths/route.ts`

**Logic:**
```typescript
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import yaml from 'yaml'

export async function GET() {
  const configPath = 'F:\\ComfyUI\\extra_model_paths.yaml'
  
  if (!existsSync(configPath)) {
    return Response.json({
      valid: false,
      exists: false,
      message: 'extra_model_paths.yaml not found'
    })
  }
  
  try {
    const content = await readFile(configPath, 'utf-8')
    const parsed = yaml.parse(content)
    
    const paths = {
      base_path: parsed?.base_path,
      checkpoints: parsed?.checkpoints,
      loras: parsed?.loras,
      controlnet: parsed?.controlnet
    }
    
    return Response.json({
      valid: true,
      exists: true,
      paths,
      message: 'Config valid'
    })
  } catch (err) {
    return Response.json({
      valid: false,
      exists: true,
      error: err.message,
      message: 'Config parse error'
    }, { status: 500 })
  }
}
```

---

#### ✅ D2. Создание default extra_model_paths.yaml
**Branch:** `feat/create-default-model-paths`  
**Priority:** P1  
**Endpoint:** `POST /api/comfy/create-default-paths`

**Template:**
```yaml
base_path: F:\Models
checkpoints: F:\Models\checkpoints
loras: F:\Models\loras
vae: F:\Models\vae
controlnet: F:\Models\controlnet
clip: F:\Models\clip
clip_vision: F:\Models\clip_vision
```

**Action:**
1. Создать backup: `extra_model_paths.yaml.bak.TIMESTAMP`
2. Записать default template
3. Вернуть `{ created: true, backupPath: "..." }`

---

#### ✅ D3. Workflow API-формат шаблоны
**Branch:** `feat/workflow-api-templates`  
**Priority:** P1  
**New folder:** `workflows/api/`

**Files:**
- `workflows/api/sdxl-t2i.json` — text-to-image SDXL
- `workflows/api/sd35-t2i.json` — SD3.5 Large
- `workflows/api/sdxl-i2i.json` — image-to-image
- `workflows/api/svd-v2v.json` — Stable Video Diffusion

**Save format:** ComfyUI → Workflow → "Save (API Format)"

**Proof:**
- `ls workflows/api/*.json` → 4 файла
- POST `/api/comfy/prompt` с загруженным workflow → успешная генерация

---

#### ✅ D4. Endpoint для списка моделей
**Branch:** `feat/models-list`  
**Priority:** P2  
**Endpoint:** `GET /api/models`

**Logic:**
```typescript
export async function GET() {
  // Прокси на ComfyUI
  const objectInfo = await fetch('http://127.0.0.1:8188/object_info')
  const data = await objectInfo.json()
  
  return Response.json({
    checkpoints: data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [],
    loras: data.LoraLoader?.input?.required?.lora_name?.[0] || [],
    controlnet: data.ControlNetLoader?.input?.required?.control_net_name?.[0] || [],
    vae: data.VAELoader?.input?.required?.vae_name?.[0] || []
  })
}
```

---

### БЛОК E: Диагностика и Ignite — 5 пунктов

#### ✅ E1. Страница /diagnostics с статусами
**Branch:** `feat/diagnostics-page`  
**Priority:** P0  
**File:** `app/diagnostics/page.tsx`

**UI sections:**
1. **Службы Windows:**
   - OrchestratorComfyUI: 🟢/🔴
   - OrchestratorPanel: 🟢/🟡 (dev mode)
   - OrchestratorWorker: 🟡 (optional)

2. **ComfyUI:**
   - Доступность: `GET /api/comfy/system_stats`
   - Модели: количество checkpoints/loras
   - extra_model_paths.yaml: ✅/❌

3. **External APIs:**
   - FLUX (ping): `HEAD https://api.bfl.ai/` (без токена)
   - v0 Platform: validate token (GET /api/v0/validate)

4. **Database:**
   - SQLite path: `data/orchestrator.db`
   - Tables: jobs (count), messages (count)

**Buttons:**
- «Запуск системы» → `/api/system/ignite`
- «Пересканировать модели» → `/api/comfy/object_info` (clear cache)
- «Создать default paths» → `/api/comfy/create-default-paths`

---

#### ✅ E2. Status API endpoints
**Branch:** `feat/status-endpoints`  
**Priority:** P1  
**Endpoints:**
- `GET /api/status` — общий статус системы
- `GET /api/status/services` — службы Windows
- `GET /api/status/comfy` — ComfyUI health check
- `GET /api/status/models` — количество моделей

**Response format:**
```json
{
  "overall": "healthy|degraded|down",
  "services": {
    "comfy": { "status": "running", "pid": 1234 },
    "panel": { "status": "dev", "port": 3000 }
  },
  "comfy": {
    "online": true,
    "version": "...",
    "models": { "checkpoints": 10, "loras": 25 }
  },
  "database": {
    "path": "C:\\Work\\Orchestrator\\data\\orchestrator.db",
    "size": "2.4 MB",
    "jobs": 15,
    "messages": 42
  }
}
```

---

#### ✅ E3. Service health check interval
**Branch:** `feat/health-check-polling`  
**Priority:** P2  
**Implementation:**
- Клиентский polling каждые 10 секунд
- `useEffect` + `setInterval` в `/diagnostics`
- Обновление статусов без полной перезагрузки страницы

---

#### ✅ E4. Ignite button с прогрессом
**Branch:** `feat/ignite-progress`  
**Priority:** P2  
**Component:** `components/ignite-button.tsx`

**States:**
1. Idle: «Запуск системы»
2. Starting: «Запуск ComfyUI...» (3s)
3. Waiting: «Ожидание ответа...» (7s)
4. Success: «✅ Система запущена»
5. Error: «❌ Ошибка запуска»

**Progress bar:** 0% → 30% → 70% → 100%

---

#### ✅ E5. Логи служб в UI
**Branch:** `feat/service-logs-viewer`  
**Priority:** P3  
**Endpoint:** `GET /api/logs/comfy?lines=100`

**Implementation:**
```typescript
import { readFile } from 'fs/promises'

export async function GET(req: NextRequest) {
  const lines = parseInt(req.nextUrl.searchParams.get('lines') || '100')
  const logPath = 'F:\\ComfyUI\\logs\\stdout.log'
  
  const content = await readFile(logPath, 'utf-8')
  const last = content.split('\n').slice(-lines).join('\n')
  
  return new Response(last, { headers: { 'content-type': 'text/plain' } })
}
```

**UI:** Expandable textarea в `/diagnostics`

---

### БЛОК F: Тесты (Playwright) — 3 пункта

#### ✅ F1. Установка Playwright
**Branch:** `test/playwright-setup`  
**Priority:** P1  
**Commands:**
```bash
cd apps/admin
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

**Config:** `playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'pnpm run dev',
    port: 3000,
    reuseExistingServer: true
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure'
  }
})
```

---

#### ✅ F2. Smoke test — homepage
**Branch:** `test/smoke-homepage`  
**Priority:** P1  
**File:** `tests/e2e/homepage.spec.ts`

**Test:**
```typescript
import { test, expect } from '@playwright/test'

test('homepage loads without errors', async ({ page }) => {
  await page.goto('/')
  
  // Проверка заголовка
  await expect(page.locator('h1')).toBeVisible()
  
  // Проверка кнопки Ignite
  await expect(page.locator('button:has-text("Запуск системы")')).toBeVisible()
  
  // Нет console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  
  await page.waitForTimeout(2000)
  expect(errors).toHaveLength(0)
})
```

**Run:** `pnpm exec playwright test`

---

#### ✅ F3. Visual regression — screenshots
**Branch:** `test/visual-regression`  
**Priority:** P2  
**Tests:**
- `/` — homepage
- `/diagnostics` — диагностика
- `/builder` — builder page
- `/settings` — настройки

**Implementation:**
```typescript
test('diagnostics visual snapshot', async ({ page }) => {
  await page.goto('/diagnostics')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('diagnostics.png')
})
```

**Snapshots:** `tests/e2e/__screenshots__/*.png`

---

### БЛОК G: FLUX защита — 2 пункта

#### ✅ G1. Confirmation modal для FLUX
**Branch:** `feat/flux-confirmation-modal`  
**Priority:** P0  
**Component:** `components/flux-confirm-modal.tsx`

**Flow:**
1. User заполняет форму → клик "Generate"
2. Открывается модалка:
   ```
   ⚠️ Платный запрос FLUX 1.1 Pro Ultra
   
   Параметры:
   - Prompt: "..."
   - Size: 1024x1024
   - Raw mode: Yes
   
   Стоимость: ~$0.04
   
   [Отмена] [Подтвердить и запустить]
   ```
3. Если "Подтвердить" → `POST /api/flux/generate` с `dryRun=false`

---

#### ✅ G2. Environment flag ALLOW_GENERATION
**Branch:** `feat/allow-generation-flag`  
**Priority:** P0  
**Changes:**
- `.env.example`: `ALLOW_GENERATION=false`
- `lib/env.ts`: добавить в Zod schema
  ```typescript
  ALLOW_GENERATION: z.enum(['true', 'false']).default('false')
  ```
- `/api/flux/generate`:
  ```typescript
  if (body.dryRun === false && env.ALLOW_GENERATION !== 'true') {
    return Response.json(
      { error: 'Generation disabled. Set ALLOW_GENERATION=true in .env' },
      { status: 403 }
    )
  }
  ```

**Proof:**
- `ALLOW_GENERATION=false` → 403 Forbidden
- `ALLOW_GENERATION=true` → генерация выполняется

---

### БЛОК H: MCP и SQLite (следом) — 2 пункта

#### ⏳ H1. SQLite orchestrator.db schema
**Branch:** `feat/sqlite-schema`  
**Priority:** P2 (после основной стабилизации)  
**File:** `lib/db.ts`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  backend TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt TEXT,
  params TEXT,
  result TEXT,
  created_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  progress INTEGER,
  logs TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  job_id TEXT,
  timestamp TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

---

#### ⏳ H2. MCP Server setup
**Branch:** `feat/mcp-server`  
**Priority:** P3  
**Folder:** `apps/mcp/`

**Implementation:** Следующая фаза после стабилизации

---

## 🎯 Execution Plan (порядок PR)

### Sprint 1: Критичная стабилизация (1-2 дня)
1. **A1** → NSSM ComfyUI service setup
2. **A2** → Service control API (sc start/stop/status)
3. **A3** → Remove direct spawn
4. **B1** → ComfyUI catch-all proxy
5. **B2** → FLUX dry-run mode
6. **C3** → Error boundaries (error.tsx)
7. **E1** → /diagnostics page
8. **G2** → ALLOW_GENERATION flag

**Checkpoint:** Dev-сервер стабилен, службы управляются через UI

---

### Sprint 2: Прокси и валидация (1 день)
9. **B3** → v0 Platform proxy
10. **B4** → Remove duplicate proxies
11. **D1** → Validate extra_model_paths.yaml
12. **D2** → Create default paths
13. **A4** → Ignite unified API
14. **E2** → Status endpoints

**Checkpoint:** Все API прокси работают, диагностика показывает статусы

---

### Sprint 3: UI и тесты (1 день)
15. **C1** → Audit 'use client'
16. **C5** → Remove Node APIs from client
17. **F1** → Playwright setup
18. **F2** → Smoke tests
19. **E3** → Health check polling
20. **G1** → FLUX confirmation modal

**Checkpoint:** Нет hydration errors, тесты зелёные

---

### Sprint 4: Polishing (1 день)
21. **D3** → Workflow API templates
22. **D4** → Models list endpoint
23. **E4** → Ignite progress
24. **B5** → Rate limiting
25. **C2** → Dynamic canvas import
26. **B6** → Proxy logging
27. **C4** → TypeScript strict mode
28. **E5** → Service logs viewer
29. **F3** → Visual regression
30. **A5** → NSSM documentation

---

## ✅ Definition of Done (каждый PR)

1. **Build:** `pnpm run build` → SUCCESS
2. **TypeScript:** 0 compile errors
3. **Dev server:** Запускается без crashes
4. **Tests:** Если есть тесты — зелёные
5. **Documentation:** Обновлён соответствующий `.md` файл
6. **Proof:** Скриншоты/логи/curl примеры в PR description
7. **Review:** Self-review с чек-листом

---

## 📊 Progress Tracking

| ID | Task | Branch | Status | PR | Notes |
|----|------|--------|--------|-----|-------|
| A1 | NSSM service | fix/nssm-comfy-service | ⏳ | - | Next |
| A2 | Service API | fix/service-control-api | ⏳ | - | - |
| ... | ... | ... | ... | ... | ... |

**Legend:**
- ⏳ Pending
- 🔄 In Progress
- ✅ Done
- ❌ Blocked

---

## 🚫 ЗАПРЕТЫ (РЕВИЗОР++)

1. ❌ **НЕ вызывать FLUX API** без `ALLOW_GENERATION=true`
2. ❌ **НЕ использовать `spawn`** на клиенте
3. ❌ **НЕ пушить** коммиты без прохождения `pnpm run build`
4. ❌ **НЕ менять** сетку v0 компонентов
5. ❌ **НЕ хардкодить** пути (только через `lib/paths.ts`)
6. ❌ **НЕ пропускать** Error UI (белый экран = провал)
7. ❌ **НЕ игнорировать** hydration warnings

---

## 📚 References

- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Error Handling: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- NSSM: https://nssm.cc/usage
- ComfyUI API: https://github.com/comfyanonymous/ComfyUI/wiki/API
- FLUX 1.1 Pro: https://docs.bfl.ai/
- Playwright: https://playwright.dev/docs/test-snapshots

---

**Автор:** РЕВИЗОР++  
**Дата:** 2025-10-19  
**Версия:** 1.0
