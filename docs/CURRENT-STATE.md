# Orchestrator V3 — Текущее Состояние (21.10.2025)

## 📊 Что РАБОТАЕТ Сейчас

### ✅ Инфраструктура

**Docker Hybrid Mode** — Production Ready
- **Админка Next.js 15** в Docker контейнере (порт 3002)
- **ComfyUI** на хосте Windows (Windows Service, порт 8188)
- **Volume mounts**: `F:\Models` (read-only), `F:\Drop\out` (read-write)
- **host.docker.internal** — доступ из контейнера к ComfyUI на хосте
- **Health check** — автоматическая проверка `/api/health` каждые 30s

**Запуск:**
```bash
docker compose up -d        # Старт
docker compose logs -f      # Логи
docker compose down         # Стоп
```

**Образ:** `orchestrator-admin:prod` (1.67GB, Node 20, pnpm workspace)

---

### ✅ UI — Интерфейс (http://localhost:3002/builder-v0)

**Архитектура:** Three-panel layout с `react-resizable-panels`

#### Левая Панель — Chat Sidebar
**Компонент:** `components/builder-v0/ChatSidebar.tsx`

**Функции:**
- Список доступных команд:
  - `/agent-list ws` — показать доступные агенты и управление
  - `/agent-on <name>` — включить агента
  - `/agent-off <name>` — выключить агента
  - `/apex-flux <prompt>` — генерация через Flux
  - `/apex-comfy <model> <prompt>` — генерация через ComfyUI (SDXL, SD3.5, SVD)
- Placeholder для чата (UI готов, логика не подключена)

**Что НЕ работает:**
- ❌ Реальный чат с сохранением истории
- ❌ Выполнение команд через input
- ❌ WebSocket/SSE для real-time обновлений

#### Центральная Панель — Canvas Preview
**Компонент:** `components/builder-v0/CanvasPreview.tsx`

**Что показывает:**
- **Gallery Mode (по умолчанию):**
  - Сетка 2 колонки с превью изображений из `/output` (F:\Drop\out)
  - Metadata: filename, дата создания
  - Клик → полноэкранный просмотр

**API:**
- `GET /api/canvas/list` — листинг всех изображений (PNG, JPG, WEBP, GIF)
- `GET /api/canvas/image/[filename]` — отдача файла с кэшем

**Что НЕ работает:**
- ❌ Показ сгенерированных сайтов (v0 previews)
- ❌ Фильтры по типу контента (image/video/site)
- ❌ Пагинация (все файлы грузятся сразу)
- ❌ Design Mode для редактирования элементов (iframe overlay готов, но не используется)

#### Правая Панель — Inspector
**Компонент:** `components/builder-v0/Inspector.tsx`

**Функции:**
- Placeholder "Выберите элемент для редактирования"
- Готов к интеграции с Design Mode

**Что НЕ работает:**
- ❌ Отображение свойств выбранного элемента
- ❌ Редактирование текста/изображений
- ❌ Применение изменений

---

### ✅ Backend API — Что Работает

#### ComfyUI Integration
**Endpoints:**
- `GET /api/comfyui/status` → `{"online": true/false, "stats": {...}}`
- `GET /api/comfy/[...path]` → Прокси к ComfyUI (system_stats, prompt, history)
- `POST /api/comfy/prompt` → Отправка workflow в ComfyUI

**Статус:** ✅ Работает через `host.docker.internal:8188`

#### FLUX API (bfl.ai)
**Connector:** `packages/connectors/flux.ts`

**Функции:**
- Генерация через FLUX 1.1 Pro Ultra
- Поддержка image-to-image, aspect ratio, raw mode
- Polling результата

**ENV:** `BFL_API_KEY=e4ac44c9-c0a6-469c-a72a-8b5dcbe38dbc`

**Статус:** ✅ Код готов, не подключен к UI

#### v0 API (Vercel v0)
**Endpoints:**
- `POST /api/v0` → Создание чата и генерация кода
- `POST /api/v0/apply` → Применение изменений к существующему коду
- `GET /api/v0/artifact` → Получение артефакта по ID

**ENV:** `V0_API_KEY` (есть в `.env.local`)

**Статус:** ✅ API готов, не подключен к UI

#### Canvas API
**Endpoints:**
- `GET /api/canvas/list` → Листинг изображений
- `GET /api/canvas/image/[filename]` → Отдача файла

**Статус:** ✅ Работает, показывает 2 файла (flux_*.jpg, sdxl_*.png)

#### Health & Diagnostics
**Endpoints:**
- `GET /api/health` → Статус всех сервисов (ComfyUI, FLUX, HF, models)
- `GET /api/selfcheck` → Проверка доступности сервисов
- `GET /api/models` → Информация о доступных моделях

**Статус:** ✅ Работает

---

### ✅ File System Access

**Volume Mounts в Docker:**
- `F:\Models → /models` (read-only) — checkpoints, controlnet, ipadapter, video
- `F:\Drop\out → /output` (read-write) — результаты генерации
- `./jobs → /app/jobs` — job queue storage

**Проверено:**
```bash
docker exec orchestrator-prod ls -la /models
# checkpoints, controlnet, ipadapter, video ✅

docker exec orchestrator-prod ls -la /output
# flux_d888cd70...jpg, sdxl_00001_.png ✅
```

---

## ❌ Что НЕ РАБОТАЕТ / НЕ ПОДКЛЮЧЕНО

### 1. Генерация через UI

**Проблема:**
- Chat input есть, но команды не обрабатываются
- Нет формы для выбора модели (SDXL, SD3.5, FLUX, SVD)
- Нет выбора параметров (prompt, seed, steps, cfg)

**Нужно:**
- Форма генерации с dropdown для модели
- Input для промпта
- Advanced settings (seed, steps, cfg_scale, sampler)
- Кнопка "Generate" → отправка в job queue

### 2. Выбор Модели

**Проблема:**
- Нет UI для выбора checkpoint (в `F:\Models\checkpoints` много моделей)
- Hardcoded модель в коннекторах

**Нужно:**
- `GET /api/models/list` — листинг всех checkpoints из `/models`
- Dropdown в UI: "SDXL Base 1.0", "SD 3.5 Medium", "SD 1.5", etc.
- Сохранение выбранной модели в job

### 3. Генерация Видео

**Статус:** SVD (Stable Video Diffusion) есть в коде, но:
- ❌ Нет UI для загрузки input image
- ❌ Нет параметров (motion_bucket_id, fps, num_frames)
- ❌ Результаты видео не показываются в Canvas (только изображения)

**Нужно:**
- Image upload для SVD input
- Video player в Canvas Preview
- Фильтр "Images | Videos | Sites" в Canvas

### 4. v0 Чаты

**Проблема:**
- API `/api/v0` работает, но:
- ❌ Нет UI для создания нового чата
- ❌ Нет листинга существующих чатов из v0
- ❌ Нет импорта чатов с v0.dev

**Возможно:**
- v0 API предоставляет чаты через `/api/v0/chats`? (нужно проверить)
- Если да → можем импортировать и показывать в Canvas
- Если нет → создаём свои чаты и синхронизируем

**Нужно исследовать:**
- Документация v0 API: https://docs.v0.dev/api-reference
- Можно ли получить список чатов пользователя?
- Можно ли embedded preview для v0 чата?

### 5. Real-time Updates

**Проблема:**
- Генерация запускается, но UI не обновляется автоматически
- Нет progress bar / status indicator

**Нужно:**
- SSE endpoint: `GET /api/jobs/stream` → Server-Sent Events
- EventSource на фронте для подписки на события
- Progress events: `{type: 'progress', jobId, percent, eta}`
- Complete events: `{type: 'complete', jobId, outputPath}`

### 6. Job Queue & Worker

**Статус:**
- Worker код есть: `services/worker/src/index.ts`
- ❌ Worker не запущен (нет в Docker, нет на хосте)
- ❌ Job queue пустая

**Нужно:**
- Запустить Worker на хосте (PowerShell Job или systemd)
- Или добавить Worker в docker-compose.yml
- API для job management:
  - `POST /api/jobs` — создать новую задачу
  - `GET /api/jobs` — листинг задач
  - `GET /api/jobs/:id` — статус конкретной задачи
  - `DELETE /api/jobs/:id` — отменить задачу

### 7. Canvas Improvements

**Проблемы:**
- ❌ Нет фильтров (все/изображения/видео/сайты)
- ❌ Нет сортировки (по дате/имени/размеру)
- ❌ Нет search по filename
- ❌ Нет metadata (размер изображения, модель, промпт)
- ❌ Нет batch delete
- ❌ Нет полноэкранного слайдшоу

**Нужно:**
- Toolbar: Filters + Search + Sort
- Metadata panel: размер, разрешение, модель, seed, prompt
- Context menu: Delete, Download, Copy prompt, Regenerate

### 8. Design Mode

**Статус:**
- Код готов (`design-mode-script.js`, overlay)
- ❌ Не работает т.к. нет сайтов для редактирования

**Нужно:**
- Сначала реализовать v0 preview
- Потом включить Design Mode для редактирования элементов

---

## 🛠️ Что Нужно Сделать (Приоритеты)

### 🔥 P0 — Критично (MVP)

1. **Форма Генерации**
   - UI: Modal/Drawer с формой
   - Поля: Model dropdown, Prompt textarea, Advanced (seed, steps, cfg)
   - Кнопка "Generate" → POST /api/jobs
   
2. **Job Queue API**
   - `POST /api/jobs` — создание задачи
   - `GET /api/jobs` — листинг
   - `GET /api/jobs/stream` — SSE для real-time updates
   
3. **Worker Запуск**
   - Запустить `services/worker` на хосте
   - Polling `/api/jobs` каждые 5s
   - Выполнение через ComfyUI/FLUX
   
4. **Canvas Filters**
   - Toolbar: "All | Images | Videos | Sites"
   - Фильтрация по типу файла

### ⚡ P1 — Важно

5. **Models API**
   - `GET /api/models/list` — листинг checkpoints
   - `GET /api/models/info/:name` — metadata модели
   
6. **Video Support**
   - Video player в Canvas (<video> tag)
   - SVD generation form (image upload)
   
7. **v0 Chats Research**
   - Изучить v0 API docs
   - Проверить, можно ли получить чаты
   - Реализовать импорт/preview если возможно

### 🎯 P2 — Желательно

8. **Progress Indicator**
   - EventSource для SSE
   - Progress bar в Canvas/Sidebar
   
9. **Metadata Display**
   - Inspector показывает: model, prompt, seed, cfg, steps
   - Copy buttons для параметров
   
10. **Search & Sort**
    - Search input в Canvas toolbar
    - Sort dropdown: Date, Name, Size

---

## 📁 Структура Проекта

```
C:\Work\Orchestrator/
├── apps/
│   └── admin/                    # Next.js 15 App Router
│       ├── app/
│       │   ├── builder-v0/       # ✅ Main UI page
│       │   ├── api/
│       │   │   ├── canvas/       # ✅ Image serving
│       │   │   ├── comfyui/      # ✅ ComfyUI proxy
│       │   │   ├── v0/           # ✅ v0 API (not connected)
│       │   │   ├── jobs/         # ❌ NOT IMPLEMENTED
│       │   │   └── models/       # ⚠️ Partial (needs /list)
│       │   └── layout.tsx
│       └── components/
│           └── builder-v0/
│               ├── ChatSidebar.tsx        # ✅ Commands list
│               ├── CanvasPreview.tsx      # ✅ Image gallery
│               ├── Inspector.tsx          # ✅ Placeholder
│               └── DesignOverlay.tsx      # ⚠️ Ready, not used
│
├── packages/
│   └── connectors/
│       ├── flux.ts               # ✅ FLUX connector (ready)
│       ├── comfy.ts              # ✅ ComfyUI connector (ready)
│       └── download.ts           # ✅ File downloader
│
├── services/
│   └── worker/                   # ❌ NOT RUNNING
│       ├── src/index.ts          # Job executor
│       └── monitor-loop.mjs      # Autonomous polling
│
├── Dockerfile                    # ✅ Production build
├── docker-compose.yml            # ✅ With volume mounts
├── .env.local                    # ✅ API keys
└── docs/
    ├── DOCKER.md                 # ✅ Setup guide
    └── CURRENT-STATE.md          # ✅ This file
```

---

## 🔐 Environment Variables

```bash
# .env.local (gitignored)
HF_TOKEN=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
BFL_API_KEY=e4ac44c9-c0a6-469c-a72a-8b5dcbe38dbc
V0_API_KEY=<ваш ключ v0.dev>
COMFYUI_URL=http://host.docker.internal:8188

# Container ENV (docker-compose.yml)
NODE_ENV=production
PORT=3002
MODELS_PATH=/models
OUTPUT_PATH=/output
```

---

## 🚀 Quick Start

### Запуск Production

```bash
# 1. Убедиться что ComfyUI Windows Service запущен
Get-Service OrchestratorComfyUI
# Status: Running ✅

# 2. Запустить Docker контейнер
docker compose up -d

# 3. Открыть в браузере
http://localhost:3002/builder-v0

# 4. Проверить health
curl http://localhost:3002/api/health
```

### Проверка Volume Mounts

```bash
# Модели доступны
docker exec orchestrator-prod ls /models/checkpoints

# Изображения доступны
docker exec orchestrator-prod ls /output
```

### Логи

```bash
# Real-time logs
docker compose logs -f

# Last 50 lines
docker compose logs --tail 50
```

---

## 📊 Metrics

- **Docker Image Size:** 1.67 GB
- **Startup Time:** 458ms (Next.js Ready)
- **Memory Usage:** ~512MB (container)
- **API Response Time:** 
  - `/api/health` → ~50ms
  - `/api/comfyui/status` → ~200ms (proxy to host)
  - `/api/canvas/list` → ~100ms (file listing)

---

## ⚠️ Known Issues

1. **Dev server crash** (21.10.2025 14:07)
   - Symptom: `pnpm dev` falls after "Ready in Xs"
   - Cause: `instrumentation.ts` issue
   - Workaround: Use production mode in Docker

2. **Volume mounts on Windows**
   - WSL2 required for good performance
   - F:\ paths work but slower than WSL filesystem

3. **ComfyUI service start fail in container**
   - Error: `/bin/sh: 1: sc: not found`
   - Cause: Windows `sc` command не работает в Linux
   - Solution: ComfyUI на хосте (hybrid mode)

---

## 📚 References

- **Next.js 15:** https://nextjs.org/docs/app
- **Docker Compose:** https://docs.docker.com/compose/
- **v0 API:** https://docs.v0.dev/api-reference
- **BFL FLUX:** https://docs.bfl.ai/endpoints/flux-pro-1.1-ultra
- **ComfyUI:** https://github.com/comfyanonymous/ComfyUI

---

**Last Updated:** 2025-10-21 13:30 UTC  
**Status:** ✅ Production Ready (basic features)  
**Next Milestone:** P0 tasks (Generation Form + Job Queue)
