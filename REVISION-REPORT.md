# REVISION REPORT — Orchestrator V6 (2025-10-19)

**Ревизор:** Злой агент-аудитор  
**Дата:** 2025-10-19 18:45 UTC+3  
**Ветка:** feat/tilda-import  
**Коммиты:** ab91619..3270e47

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ (P0 — исправить немедленно)

### 1.1. ❌ ComfyUI не запускается

**Симптомы:**
- `curl http://127.0.0.1:8188/` возвращает код 000 (connection refused).
- `Start-Process F:\ComfyUI\run_nvidia_gpu.bat` не поднимает сервис.
- Опрос через Node (`poll-comfy.mjs`) показывает 28 попыток offline.

**Причина:**
- Батник запускается, но процесс либо падает, либо зависает.
- Возможно: отсутствие зависимостей ComfyUI, битые модели, ошибка в конфиге.

**Последствия:**
- Генерация SDXL/SD3.5/SVD **полностью не работает**.
- API `/api/generate` возвращает success:true, но job падает с `Cannot find module` или ComfyUI offline.

**План исправления:**
1. Проверить логи ComfyUI (F:\ComfyUI\comfyui.log или окно процесса).
2. Убедиться что Python venv активирован и зависимости установлены.
3. Проверить наличие sd3.5_medium.safetensors в F:\Models\checkpoints (уже подтверждено).
4. Ручной запуск: `cd F:\ComfyUI; python main.py` с выводом ошибок.
5. Если падает — переустановить через `pip install -r requirements.txt`.

---

### 1.2. ❌ /api/generate/route.ts — dynamic import warning

**Симптомы:**
```
⚠ ./app/api/generate/route.ts
Critical dependency: the request of a dependency is an expression
```

**Причина:**
- Ранее использовался `require(workflowPath)` с динамическим путём.
- Заменён на `readFile()`, но warning остался (возможно кеш Webpack).

**Последствия:**
- Сборка нестабильна, может сломаться в production.
- Next.js не может оптимизировать зависимости.

**План исправления:**
1. Удалить `.next` и `node_modules/.cache`.
2. Пересобрать: `pnpm install && pnpm --filter admin build`.
3. Убедиться что warning исчез.

---

### 1.3. ❌ Workflow JSON — неполная инъекция prompt

**Проблема:**
Код в `/api/generate/route.ts` инъектирует prompt в узел `75` (CLIP Text Encode), но:
- Seed инъектируется в узел `3` (KSampler).
- Остальные параметры (cfg, steps, размер) **жёстко зашиты** в JSON.

**Последствия:**
- Пользователь не может менять steps/cfg/размер через UI.
- Workflow неполностью программируемый.

**План исправления:**
1. Добавить поддержку инъекции: `params.steps`, `params.cfg`, `params.width`, `params.height`.
2. Обновить все 3 workflow JSON (sd35, sdxl, svd) для консистентности.
3. Валидировать params в POST /api/generate (min/max ranges).

---

## 2. ВЫСОКИЙ ПРИОРИТЕТ (P1 — исправить до продакшена)

### 2.1. ⚠️ API маршруты без runtime/revalidate

**Найдено:**
Следующие маршруты **не имеют** `export const runtime = 'nodejs'`:
- `/api/models/route.ts`
- `/api/selfcheck/route.ts`
- `/api/jobs/route.ts`
- `/api/keys/validate/route.ts`
- `/api/flux/validate/route.ts`
- `/api/v0/route.ts`
- `/api/v0/validate/route.ts`
- `/api/v0/apply/route.ts`
- `/api/v0/artifact/route.ts`
- `/api/tilda/import/route.ts`

**Последствия:**
- Next.js может запустить их в Edge runtime (без доступа к fs, spawn, etc.).
- Возможны 500 ошибки в продакшене.

**План исправления:**
1. Добавить `export const runtime = 'nodejs'` и `export const revalidate = 0` во все маршруты.
2. Проверить что используют Node.js API (fs, spawn, child_process).

---

### 2.2. ⚠️ /api/jobs/route.ts — отсутствует код

**Проблема:**
В логах Next.js видно:
```
✓ Compiled /api/jobs in 289ms (878 modules)
GET /api/jobs 200 in 321ms
```

Но semantic search и file_search не нашли реализацию.

**План исправления:**
1. Найти и прочитать `/api/jobs/route.ts`.
2. Проверить что есть:
   - GET — возвращает список jobs из `C:\Work\Orchestrator\jobs`.
   - Безопасные гарды, runtime='nodejs'.
   - Логика чтения JSON файлов.

---

### 2.3. ⚠️ GenerationForm — отсутствует индикатор прогресса

**Проблема:**
UI показывает "Generating...", но нет:
- Индикатора прогресса (0-100%).
- Отображения логов job в реальном времени.
- Кнопки Cancel.

**Последствия:**
- Плохой UX: пользователь не понимает что происходит.
- Нельзя прервать долгую генерацию (10 минут для ComfyUI).

**План исправления:**
1. Добавить polling GET /api/jobs/:id каждые 2 секунды.
2. Отображать `job.progress`, `job.status`, `job.logs`.
3. Добавить DELETE /api/jobs/:id для отмены (если реализуемо).

---

### 2.4. ⚠️ Canvas — отсутствует pagination info

**Проблема:**
UI показывает "Items: 2", но не показывает:
- Текущий диапазон (showing 1-30 of 2).
- Быструю навигацию (jump to page).

**План исправления:**
1. Добавить текст "Showing {start}-{end} of {total}".
2. Добавить input для jump to page (с валидацией 1..maxPage).

---

## 3. СРЕДНИЙ ПРИОРИТЕТ (P2 — улучшить после запуска)

### 3.1. 🔶 Отсутствует валидация .env.local

**Проблема:**
Ключи `BFL_API_KEY`, `V0_API_KEY` валидируются только в `/api/keys/validate`, но:
- Не проверяются при старте приложения.
- Ошибки видны только после первого запроса.

**План исправления:**
1. Создать `middleware.ts` для проверки ключей при старте.
2. Показывать warning-баннер в UI если ключи не заданы.

---

### 3.2. 🔶 Diagnostics — нет индикатора "last checked"

**Проблема:**
PathValidator и ComfyUIMonitor показывают статус, но не показывают:
- Время последней проверки (timestamp).
- Стало ли хуже/лучше с прошлого раза.

**План исправления:**
1. Добавить `lastChecked: Date` в state.
2. Отображать "Last checked: 2 minutes ago".

---

### 3.3. 🔶 Отсутствует роутинг ошибок

**Проблема:**
При 404/500 Next.js показывает дефолтную страницу.

**План исправления:**
1. Создать `app/error.tsx` и `app/not-found.tsx`.
2. Стилизовать в соответствии с v0 темой.

---

## 4. НИЗКИЙ ПРИОРИТЕТ (P3 — технический долг)

### 4.1. 🟡 Дублирование findConfig()

**Проблема:**
Функция `findConfig()` дублируется в 3 файлах:
- `/api/paths/validate/route.ts`
- `/api/canvas/list/route.ts`
- `/api/canvas/file/route.ts`

**План исправления:**
1. Вынести в `apps/admin/lib/config-utils.ts`.
2. Экспортировать как `export function findConfig(...)`.
3. Импортировать везде.

---

### 4.2. 🟡 Hardcoded пути

**Проблема:**
Следующие пути захардкожены вместо чтения из `paths.json`:
- `JOBS_DIR = 'C:\\Work\\Orchestrator\\jobs'` в `/api/generate/route.ts`.
- `OUT_DIR = 'F:\\Drop\\out'` в `/api/generate/route.ts`.
- `F:\\Workflows\\` в executeComfyUI.

**План исправления:**
1. Читать все пути из `paths.json` в начале функции.
2. Использовать fallback если ключ отсутствует.

---

### 4.3. 🟡 Отсутствует TypeScript strict mode в маршрутах

**Проблема:**
Некоторые маршруты используют `any`:
```ts
const data: any = await response.json()
const outputs = historyData[prompt_id].outputs as any
```

**План исправления:**
1. Определить типы для ComfyUI API (PromptResponse, HistoryResponse).
2. Заменить все `any` на строгие типы.
3. Включить `strict: true` в tsconfig (если ещё не включён).

---

### 4.4. 🟡 Workflow JSON — отсутствует валидация

**Проблема:**
Workflow читается через `JSON.parse()`, но не валидируется:
- Нет проверки что узлы 75, 67, 3 существуют.
- Нет проверки что inputs корректны.

**План исправления:**
1. Использовать Zod schema для валидации workflow.
2. Установить: `pnpm add zod`.
3. Определить схему ComfyUI workflow nodes.

---

## 5. ТЕХНИЧЕСКИЕ НАХОДКИ (хорошее)

### 5.1. ✅ Безопасные гарды

Все новые маршруты (`/api/paths/validate`, `/api/canvas/*`, `/api/comfyui/*`) используют **guard-based architecture** без try/catch. Отлично!

### 5.2. ✅ Анти-кэширование

Все маршруты с динамическими данными имеют `revalidate: 0` и `cache: 'no-store'`. Правильно!

### 5.3. ✅ Path traversal защита

`/api/canvas/file` корректно валидирует `..`, `/`, `\` в параметре `p`. Хорошо!

### 5.4. ✅ Conventional Commits

История коммитов чистая, все сообщения соответствуют формату. Молодцы!

---

## 6. ДЕЙСТВИЯ ПОСЛЕ РЕВИЗИИ

### 6.1. Немедленно (P0):
1. **Починить ComfyUI startup** (ручной запуск, проверка логов, переустановка зависимостей).
2. **Удалить warning в /api/generate** (очистка кеша, пересборка).
3. **Инъекция всех параметров в workflow** (steps, cfg, width, height).

### 6.2. До продакшена (P1):
1. **Добавить runtime='nodejs' во все маршруты** (11 файлов).
2. **Реализовать /api/jobs/:id GET** (если отсутствует).
3. **Добавить прогресс-бар в GenerationForm** (polling + логи).

### 6.3. После запуска (P2):
1. Валидация .env.local при старте.
2. Индикатор "last checked" в Diagnostics.
3. Кастомные error/not-found страницы.

### 6.4. Технический долг (P3):
1. Вынести findConfig в утилиты.
2. Убрать hardcoded пути.
3. Добавить TypeScript strict mode.
4. Валидация workflow через Zod.

---

## 7. ИТОГОВАЯ ОЦЕНКА

**Готовность к продакшену:** ⚠️ **60% (с критическими багами)**

**Блокирующие проблемы:**
- ❌ ComfyUI не запускается → генерация не работает.
- ❌ Dynamic import warning → нестабильная сборка.
- ⚠️ 11 маршрутов без runtime → возможны ошибки в продакшене.

**После исправления P0+P1:** ✅ **85% (готов к запуску)**

---

## 8. РЕКОМЕНДАЦИИ

1. **ComfyUI:** Переключиться на Docker-образ для стабильного запуска.
2. **Workflow:** Использовать ComfyUI API `/object_info` для динамической генерации workflow вместо статических JSON.
3. **Мониторинг:** Добавить Sentry/OpenTelemetry для отслеживания ошибок в продакшене.
4. **Тесты:** Написать e2e-тесты для критических флоу (генерация SD35, листинг Canvas).

---

**Ревизор:** Агент завершил сканирование. Переходим к исправлениям.
