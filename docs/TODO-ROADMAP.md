# TODO — Orchestrator V3 Roadmap

## 🔥 P0 — MVP Features (Must Have)

### 1. Generation Form UI ⏳ NOT STARTED
**Описание:** Форма для запуска генерации изображений через UI

**Tasks:**
- [ ] Создать `components/builder-v0/GenerationForm.tsx`
- [ ] Modal/Drawer с shadcn/ui Dialog
- [ ] Form fields:
  - [ ] Model select (dropdown с иконками)
  - [ ] Prompt textarea (с счётчиком символов)
  - [ ] Negative prompt textarea
  - [ ] Advanced collapse:
    - [ ] Seed input (number, random button)
    - [ ] Steps slider (20-100)
    - [ ] CFG scale slider (1-20)
    - [ ] Sampler select
    - [ ] Scheduler select
- [ ] Submit button "Generate" → POST /api/jobs
- [ ] Validation: prompt required, model required
- [ ] Error handling с toast notifications

**Files:**
- `apps/admin/components/builder-v0/GenerationForm.tsx` (new)
- `apps/admin/components/builder-v0/ChatSidebar.tsx` (add button)

**Acceptance:**
- User clicks "New Generation" → form opens
- User fills prompt + selects model → clicks Generate
- Form closes, job created, toast shows "Generation started"

---

### 2. Job Queue API ⏳ NOT STARTED
**Описание:** Backend для управления задачами генерации

**Tasks:**
- [ ] `POST /api/jobs` — создать задачу
  - Body: `{ type: 'image' | 'video', model, prompt, params }`
  - Response: `{ jobId, status: 'queued' }`
  - Save to `jobs/[jobId].json`
- [ ] `GET /api/jobs` — листинг задач
  - Query: `?status=queued|running|complete|failed`
  - Response: `{ jobs: [...], total }`
- [ ] `GET /api/jobs/:id` — статус задачи
  - Response: `{ jobId, status, progress, output }`
- [ ] `DELETE /api/jobs/:id` — отменить задачу
- [ ] `GET /api/jobs/stream` — SSE endpoint
  - Format: `event: progress\ndata: {...}\n\n`
  - Events: progress, complete, error

**Files:**
- `apps/admin/app/api/jobs/route.ts` (new)
- `apps/admin/app/api/jobs/[id]/route.ts` (new)
- `apps/admin/app/api/jobs/stream/route.ts` (new)

**Acceptance:**
- POST /api/jobs → creates job file in `jobs/` dir
- GET /api/jobs → returns all jobs with filters
- SSE /api/jobs/stream → sends updates when job changes

---

### 3. Worker Service ⏳ NOT STARTED
**Описание:** Запуск worker для выполнения задач

**Tasks:**
- [ ] Решить где запускать:
  - Option A: PowerShell Start-Job на хосте
  - Option B: Добавить в docker-compose как отдельный сервис
  - **Рекомендация:** Option A (проще, GPU на хосте)
- [ ] Создать `scripts/start-worker.ps1`:
  - cd services/worker
  - pnpm install
  - node dist/index.js
- [ ] Worker logic:
  - Poll `GET /api/jobs?status=queued` каждые 5s
  - Взять первую задачу
  - Выполнить через ComfyUI/FLUX
  - Update job status → `PATCH /api/jobs/:id`
  - Emit SSE event
- [ ] Error handling:
  - Retry 3 times on failure
  - Mark job as failed if all retries exhausted
  - Log errors to `logs/worker.log`

**Files:**
- `scripts/start-worker.ps1` (new)
- `services/worker/src/index.ts` (update polling logic)

**Acceptance:**
- Worker запускается через `pwsh scripts/start-worker.ps1`
- Подхватывает задачи из queue
- Выполняет генерацию
- Обновляет статус в real-time

---

### 4. Canvas Filters ⏳ NOT STARTED
**Описание:** Фильтрация контента в Canvas Preview

**Tasks:**
- [ ] Toolbar в CanvasPreview:
  - [ ] Buttons: All | Images | Videos | Sites
  - [ ] Active state styling
- [ ] State: `const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'site'>('all')`
- [ ] Filter logic:
  - Images: `.png, .jpg, .jpeg, .webp, .gif`
  - Videos: `.mp4, .webm, .mov`
  - Sites: check if item has `type: 'site'` metadata
- [ ] Update `GET /api/canvas/list`:
  - Add `type` field to response
  - Detect type by extension or metadata

**Files:**
- `apps/admin/components/builder-v0/CanvasPreview.tsx` (update)
- `apps/admin/app/api/canvas/list/route.ts` (update)

**Acceptance:**
- User clicks "Images" → only images shown
- User clicks "Videos" → only videos shown (if any)
- User clicks "All" → everything shown

---

## ⚡ P1 — Important Features

### 5. Models API ⏳ NOT STARTED
**Описание:** Листинг доступных моделей из `/models`

**Tasks:**
- [ ] `GET /api/models/list` endpoint:
  - Read `/models/checkpoints` directory
  - Parse checkpoint metadata (if available)
  - Return: `[{ name, path, type, size, thumbnail? }]`
- [ ] Cache results (revalidate every 5min)
- [ ] Group by type: SDXL, SD3.5, SD1.5, LoRA, etc.

**Files:**
- `apps/admin/app/api/models/list/route.ts` (new)

**Acceptance:**
- GET /api/models/list → returns all checkpoints
- Response includes: name, size, path

---

### 6. Video Support ⏳ NOT STARTED
**Описание:** Поддержка генерации и просмотра видео

**Tasks:**
- [ ] SVD Generation Form:
  - [ ] Image upload (input image для SVD)
  - [ ] motion_bucket_id slider
  - [ ] fps slider (6-24)
  - [ ] num_frames slider (14-25)
- [ ] Video Player в Canvas:
  - [ ] `<video>` tag с controls
  - [ ] Thumbnail preview в grid
  - [ ] Fullscreen mode
- [ ] Update `/api/canvas/list` для видео

**Files:**
- `apps/admin/components/builder-v0/VideoPlayer.tsx` (new)
- `apps/admin/components/builder-v0/CanvasPreview.tsx` (update)

**Acceptance:**
- User uploads image → generates SVD video
- Video appears in Canvas gallery
- Click → plays video in fullscreen

---

### 7. v0 Chats Integration 🔍 RESEARCH NEEDED
**Описание:** Импорт и показ чатов с v0.dev

**Research Tasks:**
- [ ] Изучить v0 API docs: https://docs.v0.dev/api-reference
- [ ] Проверить endpoints:
  - `GET /api/chats` — существует?
  - `GET /api/chats/:id/messages` — существует?
  - `GET /api/chats/:id/preview` — embedded iframe?
- [ ] Проверить authentication: v0 API key scope
- [ ] Prototype: fetch user chats и показать в sidebar

**Possible Implementation (если API позволяет):**
- [ ] `GET /api/v0/chats` → листинг чатов пользователя
- [ ] Sidebar: вкладка "My v0 Chats"
- [ ] Click на чат → Canvas показывает preview
- [ ] Button "Import to Orchestrator" → сохранить как job

**Альтернатива (если API не даёт чаты):**
- [ ] Создавать новые чаты через `/api/v0` POST
- [ ] Сохранять в локальную БД (`jobs/v0-chats/`)
- [ ] Показывать только созданные в Orchestrator

**Acceptance (если возможно):**
- User видит свои v0 чаты в sidebar
- Click → preview в Canvas
- "Import" → создаёт job для re-generation

---

## 🎯 P2 — Nice to Have

### 8. Progress Indicator ⏳ NOT STARTED
**Описание:** Real-time обновления прогресса генерации

**Tasks:**
- [ ] EventSource на фронте:
  ```tsx
  const eventSource = new EventSource('/api/jobs/stream')
  eventSource.addEventListener('progress', (e) => {
    const { jobId, percent, eta } = JSON.parse(e.data)
    // Update UI
  })
  ```
- [ ] Progress bar в Sidebar/Canvas
- [ ] ETA display: "~30 seconds remaining"
- [ ] Toast notification on complete

**Files:**
- `apps/admin/hooks/useJobProgress.ts` (new)
- `apps/admin/components/builder-v0/ChatSidebar.tsx` (update)

**Acceptance:**
- User starts generation → progress bar appears
- Progress updates in real-time (0% → 100%)
- On complete → toast + gallery refreshes

---

### 9. Metadata Display ⏳ NOT STARTED
**Описание:** Показ параметров генерации

**Tasks:**
- [ ] Update job files: save `{ prompt, model, seed, cfg, steps }`
- [ ] Inspector panel:
  - [ ] Show metadata when image selected
  - [ ] Copy buttons для prompt, seed
  - [ ] "Regenerate with same params" button
- [ ] Canvas thumbnails:
  - [ ] Hover tooltip с кратким metadata
  - [ ] Badge: model name (e.g. "SDXL")

**Files:**
- `apps/admin/components/builder-v0/Inspector.tsx` (update)
- `apps/admin/components/builder-v0/CanvasPreview.tsx` (update)

**Acceptance:**
- User hovers image → tooltip shows model + prompt
- User selects image → Inspector shows full metadata
- "Copy prompt" → copies to clipboard

---

### 10. Search & Sort ⏳ NOT STARTED
**Описание:** Поиск и сортировка в Canvas

**Tasks:**
- [ ] Toolbar:
  - [ ] Search input (debounced 300ms)
  - [ ] Sort dropdown: Date, Name, Size
  - [ ] Order toggle: Asc/Desc
- [ ] Search logic:
  - Search by filename
  - Search by prompt (if metadata available)
- [ ] Sort implementation:
  - Date: sort by `created` field
  - Name: alphabetical
  - Size: file size bytes

**Files:**
- `apps/admin/components/builder-v0/CanvasPreview.tsx` (update)

**Acceptance:**
- User types "flux" → only flux_*.jpg shown
- User sorts by Date Desc → newest first
- User sorts by Size Asc → smallest first

---

## 🧪 P3 — Future Ideas

### 11. Batch Operations
- [ ] Select multiple images (checkbox)
- [ ] Batch delete
- [ ] Batch download as ZIP
- [ ] Batch move to folder

### 12. Folders/Collections
- [ ] Create folders in `/output`
- [ ] Move images to folders
- [ ] Breadcrumb navigation

### 13. Upscaling
- [ ] Integration with Real-ESRGAN / ESRGAN
- [ ] Upscale button в Inspector
- [ ] Upscale job queue

### 14. ControlNet Support
- [ ] Upload reference image
- [ ] Select ControlNet model (Canny, Depth, Pose)
- [ ] Preview overlay

### 15. LoRA Support
- [ ] LoRA selector в Generation Form
- [ ] Multiple LoRA (with weights)
- [ ] LoRA search/filter

---

## 📊 Status Overview

| Priority | Category | Status | Tasks |
|----------|----------|--------|-------|
| P0 | Generation Form | ⏳ Not Started | 1 |
| P0 | Job Queue API | ⏳ Not Started | 1 |
| P0 | Worker Service | ⏳ Not Started | 1 |
| P0 | Canvas Filters | ⏳ Not Started | 1 |
| P1 | Models API | ⏳ Not Started | 1 |
| P1 | Video Support | ⏳ Not Started | 1 |
| P1 | v0 Chats | 🔍 Research | 1 |
| P2 | Progress Indicator | ⏳ Not Started | 1 |
| P2 | Metadata Display | ⏳ Not Started | 1 |
| P2 | Search & Sort | ⏳ Not Started | 1 |
| P3 | Future Ideas | 💡 Ideas | 5 |

**Total Tasks:** 15 (10 actionable + 5 ideas)

---

## 🚀 Suggested Sprint Plan

### Week 1 — MVP (P0)
- Day 1-2: Generation Form UI + Job Queue API
- Day 3: Worker Service setup
- Day 4: Canvas Filters
- Day 5: Testing + Bug fixes

### Week 2 — Core Features (P1)
- Day 1-2: Models API + Integration
- Day 3-4: Video Support (SVD form + player)
- Day 5: v0 Chats Research + Prototype

### Week 3 — Polish (P2)
- Day 1: Progress Indicator (SSE)
- Day 2: Metadata Display
- Day 3: Search & Sort
- Day 4-5: UI/UX improvements

---

**Created:** 2025-10-21 13:35 UTC  
**Priority:** Start with P0 tasks  
**Blocked By:** None (all tasks can start now)
