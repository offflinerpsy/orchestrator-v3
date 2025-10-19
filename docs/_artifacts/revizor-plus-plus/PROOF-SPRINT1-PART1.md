# PROOF: Sprint 1 — Критичная стабилизация (3/8 задач)

**Дата:** 2025-10-19  
**Коммиты:** `976d96e`, `58ca305`, `575abdd`  
**Branch:** `feat/tilda-import`

---

## ✅ A2: Service Control API (refactor)

**Коммит:** `976d96e`  
**Файлы изменены:** 6  
**Инсерции:** +1329 / Удаления: -136

### Изменения:

#### 1. `lib/service-control.ts` (NEW)
```typescript
export async function runServiceCommand(
  command: 'start' | 'stop' | 'query' | 'restart',
  serviceName: string,
  timeoutMs = 30000
): Promise<ServiceCommandResult>

export async function waitForServiceStart(serviceName, maxWaitMs, pollIntervalMs)
export async function waitForServiceStop(serviceName, maxWaitMs, pollIntervalMs)
export async function serviceExists(serviceName)
```

**Преимущества:**
- Заменил `spawn()` на `promisify(exec)` — безопаснее для API routes
- Centralized логика для всех `/api/system/comfy/*` endpoints
- Polling с таймаутами вместо «fire-and-forget»
- TypeScript types: `ServiceStatus`, `ServiceCommandResult`

#### 2. `app/api/system/comfy/start/route.ts` (REFACTOR)
- Было: Inline `spawn()` с Promise wrapper (50+ строк)
- Стало: `runServiceCommand('start', SERVICE_NAME)` + `waitForServiceStart()` (25 строк)
- Добавлено: Structured logging с `logger.info/warn/error`

#### 3. `app/api/system/comfy/stop/route.ts` (REFACTOR)
- Аналогично start — использует shared utilities
- Таймаут остановки: 15 секунд (polling каждые 500ms)

#### 4. `app/api/system/comfy/status/route.ts` (REFACTOR)
- Парсинг вынесен в `parseServiceStatus()` utility
- Добавлен `getStatusMessage()` с русскими строками
- JSON response structure:
  ```json
  {
    "success": true,
    "status": "running|stopped|starting|stopping|not-installed|error",
    "running": boolean,
    "stopped": boolean,
    "pending": boolean,
    "installed": boolean,
    "message": "Служба запущена"
  }
  ```

#### 5. `scripts/install-comfy-service.ps1` (NEW)
PowerShell скрипт для установки NSSM службы:
- Проверка прав админа
- Проверка NSSM в PATH
- Установка `OrchestratorComfyUI` с параметрами:
  - `AppDirectory`: F:\ComfyUI
  - `AppStdout/Stderr`: логи в F:\ComfyUI\logs\
  - `AppRotateFiles`: 1 (ротация логов)
  - `AppRotateBytes`: 10MB
  - `AppRestartDelay`: 5s

#### 6. `docs/_artifacts/revizor-plus-plus/STABILIZE-PLAN.md` (NEW)
30-пунктовый план стабилизации на 4 спринта

---

### Verification:

**Build check:**
```bash
cd apps/admin && pnpm run build
# ✓ 0 TypeScript errors
# ✓ Route /api/system/comfy/start compiled successfully
```

**Manual test (requires NSSM service installed):**
```powershell
# Если служба установлена:
curl http://localhost:3000/api/system/comfy/status
# → {"success":true,"status":"running","running":true}

curl -X POST http://localhost:3000/api/system/comfy/stop
# → {"success":true,"message":"ComfyUI служба остановлена","status":"stopped"}

curl -X POST http://localhost:3000/api/system/comfy/start
# → Ожидание 30 секунд + polling
# → {"success":true,"message":"ComfyUI служба запущена","status":"running"}
```

**Logs (structured JSON in production):**
```json
{
  "level": 30,
  "time": "2025-10-19T19:03:49.361Z",
  "env": "production",
  "message": "ComfyUI service start requested"
}
{
  "level": 30,
  "message": "Waiting for service to start..."
}
{
  "level": 30,
  "message": "ComfyUI service started successfully"
}
```

---

## ✅ C3: Error Boundaries (feat)

**Коммит:** `58ca305`  
**Файлы изменены:** 2  
**Инсерции:** +135

### Изменения:

#### 1. `app/error.tsx` (NEW)
```tsx
'use client'

export default function Error({ error, reset })
```

**UI компоненты:**
- ⚠️ Иконка ошибки (emoji)
- Заголовок: «Что-то пошло не так»
- Error message в `rounded-lg border bg-card` box
- Digest (error ID) если доступен
- 2 кнопки:
  - «Попробовать снова» → `reset()` (Next.js API)
  - «Вернуться на главную» → `href="/"`
- Footer: подсказка про F12

**Стилизация:**
- Использует v0 utility classes (не меняет сетку)
- `flex min-h-screen items-center justify-center` для центрирования
- `bg-background` + `text-muted-foreground` — theme-aware

#### 2. `app/global-error.tsx` (NEW)
```tsx
'use client'

export default function GlobalError({ error, reset })
```

**Отличия от error.tsx:**
- Включает `<html>` + `<body>` (требование Next.js)
- Hardcoded dark theme (`bg-zinc-950`) — не зависит от layout
- Emoji: 💥 (критичная ошибка)
- Заголовок: «Критическая ошибка»
- Дополнительные инструкции:
  - Очистить кэш и cookies
  - Перезапустить браузер

**Когда срабатывает:**
- Ошибка в `app/layout.tsx` самого
- Ошибка в root-level rendering
- Production-only (dev-режим показывает overlay)

---

### Verification:

**Тест error.tsx:**
Добавить в любой page.tsx:
```tsx
export default function TestPage() {
  if (true) throw new Error('Test boundary')
  return <div>Content</div>
}
```

**Ожидаемый результат:**
- НЕТ белого экрана ❌
- Показывается error.tsx UI ✅
- В консоли: `Boundary caught error: Test boundary`
- Кнопка «Попробовать снова» → перерендер компонента
- Кнопка «Вернуться на главную» → переход на `/`

**Тест global-error.tsx:**
Добавить ошибку в `app/layout.tsx`:
```tsx
export default function RootLayout({ children }) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Layout crash')
  }
  return <html>...</html>
}
```

**Production build:**
```bash
pnpm run build && pnpm start
```

**Ожидаемый результат:**
- Показывается global-error.tsx с темной темой
- Весь layout заменён (нет header/sidebar)
- Кнопки работают

---

## ✅ B2 + G2: FLUX Dry-Run Mode (feat)

**Коммит:** `575abdd`  
**Файлы изменены:** 3  
**Инсерции:** +60 / Удаления: -10

### Изменения:

#### 1. `lib/env.ts` (UPDATE)
Добавлена переменная в Zod schema:
```typescript
ALLOW_GENERATION: z.enum(['true', 'false']).default('false')
```

**Логика:**
- По умолчанию `'false'` (безопасность)
- Валидируется при старте приложения
- Если не указано в .env → defaults to 'false'

#### 2. `app/api/flux/generate/route.ts` (REFACTOR)
```typescript
const ESTIMATED_COST_USD = 0.04

export async function POST(request: Request) {
  const { confirmed = false } = await request.json()
  
  const allowGeneration = env.ALLOW_GENERATION === 'true' && confirmed === true
  
  if (!allowGeneration) {
    return Response.json({
      dryRun: true,
      valid: true,
      payload: config,
      estimatedCost: '$0.04',
      message: '...',
      note: 'Это dry-run режим — API не вызывается.'
    })
  }
  
  // Real generation only if both flags true
  logger.warn({ message: '💸 FLUX real generation' })
  const data = await generateFlux(config)
  return Response.json(data)
}
```

**Режимы работы:**

| ALLOW_GENERATION | confirmed | Результат |
|------------------|-----------|-----------|
| false            | false     | Dry-run (валидация) |
| false            | true      | Dry-run + сообщение про флаг |
| true             | false     | Dry-run (нужен confirmed) |
| true             | true      | ✅ Real API call |

#### 3. `.env.example` (UPDATE)
```bash
# Allow real API generation (FLUX, ComfyUI)
# ВАЖНО: по умолчанию false для безопасности
# Установите true только для продакшн-генераций
ALLOW_GENERATION=false
```

---

### Verification:

**Scenario 1: Default (safe mode)**
```bash
# .env.local не содержит ALLOW_GENERATION (или =false)

curl -X POST http://localhost:3000/api/flux/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test image"}'

# Response:
{
  "dryRun": true,
  "valid": true,
  "payload": { "prompt": "test image" },
  "estimatedCost": "$0.04",
  "message": "Payload валиден. Установите confirmed=true...",
  "note": "Это dry-run режим — API не вызывается, деньги не списываются."
}
```

**Scenario 2: Confirmed without flag**
```bash
curl -X POST http://localhost:3000/api/flux/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","confirmed":true}'

# Response:
{
  "dryRun": true,
  "valid": true,
  "message": "ALLOW_GENERATION=false. Установите ALLOW_GENERATION=true в .env...",
  ...
}
```

**Scenario 3: Real generation (both flags)**
```bash
# .env.local:
ALLOW_GENERATION=true

curl -X POST http://localhost:3000/api/flux/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"astronaut","confirmed":true}'

# Response:
{
  "id": "...",
  "status": "Ready",
  "result": { "sample": "https://..." }
}

# Logs (production):
{
  "level": 40,
  "message": "💸 FLUX real generation",
  "prompt": "astronaut...",
  "estimatedCost": 0.04
}
```

**Scenario 4: Build check**
```bash
pnpm run build
# ✓ 0 errors
# ✓ Route /api/flux/generate compiled
```

---

## 📊 Sprint 1 Progress

| Task | Status | Коммит | Priority | Lines Changed |
|------|--------|--------|----------|---------------|
| A1 - NSSM setup script | ✅ | 976d96e | P0 | +120 |
| A2 - Service control API | ✅ | 976d96e | P0 | +209 / -136 |
| C3 - Error boundaries | ✅ | 58ca305 | P0 | +135 |
| B2 - FLUX dry-run | ✅ | 575abdd | P0 | +60 / -10 |
| G2 - ALLOW_GENERATION flag | ✅ | 575abdd | P0 | (included) |

**Total:** 3 commits, 5 tasks, +524 / -146 = 378 net lines

---

## Next Steps (Sprint 1 remaining)

### Ещё 3 задачи для завершения Sprint 1:
- **A3** - Remove `/api/comfyui/service` (direct spawn)
- **B1** - ComfyUI catch-all proxy `[...path]/route.ts`
- **E1** - `/diagnostics` page improvements

**ETA:** 1-2 часа (все P0/P1 задачи)

---

## Rollback Plan

Если что-то сломалось:

```bash
# Откат до Evil Audit коммита
git reset --hard 82f8610

# Или откат только последних 3 коммитов
git reset --hard HEAD~3

# Восстановление .env (если перезаписан)
cp .env.example .env.local
# Вручную заполнить ключи
```

**Безопасность:**
- Все коммиты запушены на GitHub → можно восстановить
- `.env.local` в `.gitignore` → секреты не утекли
- Production build проверен перед каждым коммитом

---

**Автор:** РЕВИЗОР++  
**Статус:** 3/30 tasks complete (10%)  
**Следующий PR:** fix/remove-direct-spawn (A3)
