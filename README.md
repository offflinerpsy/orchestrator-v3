# Orchestrator V3 — Setup Complete

## 🎉 Что готово

✅ **Базовая инфраструктура:**
- `C:\Work\Orchestrator\` — проект создан
- `paths.json` — реестр путей (C: vs F:)
- `scripts/paths-check.mjs` — проверка путей ✅ TESTED
- `.env.local` — HF_TOKEN и BFL_API_KEY настроены
- `.gitignore` — защита секретов

✅ **Connectors (API интеграция):**
- `packages/connectors/flux.ts` — BFL FLUX 1.1 Pro Ultra API
- `packages/connectors/comfy.ts` — ComfyUI HTTP API
- `packages/connectors/download.ts` — утилита скачивания

✅ **ComfyUI конфигурация:**
- `F:\ComfyUI\extra_model_paths.yaml` — указывает на F:\Models
- `F:\Workflows\sdxl-i2i.json` — SDXL Image-to-Image (IP-Adapter + ControlNet Depth)
- `F:\Workflows\sd35-i2i.json` — SD 3.5 Medium Image-to-Image
- `F:\Workflows\svd-i2v.json` — Stable Video Diffusion Image-to-Video

✅ **Скрипты:**
- `scripts/import-models.mjs` — импорт моделей из HuggingFace

✅ **Документация:**
- `SETUP-GUIDE.md` — **полная пошаговая инструкция** (14KB)
- `docs/_artifacts/orchestrator-v3/reconnaissance.md` — технический анализ

---

## 🚀 Следующие шаги (выполнить ВАМИ)

### 1. Создать Next.js админку

```powershell
cd C:\Work\Orchestrator

# Создать Next.js app
pnpm create next-app apps/admin --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Ответы:
# TypeScript: Yes
# ESLint: Yes
# Tailwind CSS: Yes
# src/ directory: No
# App Router: Yes
# Import alias (@/*): Yes
```

### 2. Установить shadcn/ui

```powershell
cd apps/admin

# Инициализация shadcn/ui
pnpm dlx shadcn@latest init
# Style: New York
# Base color: Zinc
# CSS variables: Yes

# Установить компоненты
pnpm dlx shadcn@latest add button card input label select textarea tabs tooltip badge alert-dialog

# Дополнительные зависимости
pnpm add react-hook-form zod @hookform/resolvers clsx tailwind-merge
```

### 3. Скачать ComfyUI Portable

1. Открыть https://github.com/comfyanonymous/ComfyUI/releases
2. Скачать **ComfyUI_windows_portable_nvidia_cu121_or_cpu.7z**
3. Распаковать в `F:\ComfyUI`
4. Файл `extra_model_paths.yaml` уже создан ✅

### 4. Импортировать модели из HuggingFace

**⚠️ ВАЖНО:** Перед запуском принять лицензии на HuggingFace:

- **SD 3.5 Medium:** https://huggingface.co/stabilityai/stable-diffusion-3.5-medium  
  → Нажать **"Agree and access repository"**

- **SVD 1.1:** https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1  
  → Нажать **"Agree and access repository"**

Затем запустить импорт:

```powershell
cd C:\Work\Orchestrator
node scripts/import-models.mjs
```

Скрипт скачает:
- ✅ SDXL Base 1.0 (~6.5 GB)
- ✅ SD 3.5 Medium (~5 GB)
- ✅ ControlNet Depth SDXL (~1.5 GB)
- ✅ IP-Adapter SDXL (~2 GB)
- ✅ SVD 1.1 (~10 GB)

**Всего:** ~25 GB

### 5. (Опционально) Junction ссылки

Если ComfyUI не видит модели через `extra_model_paths.yaml`:

```powershell
# ⚠️ Выполнять от имени администратора!
cd F:\ComfyUI\models

mklink /J checkpoints F:\Models\checkpoints
mklink /J controlnet F:\Models\controlnet
mklink /J ipadapter F:\Models\ipadapter
mklink /J diffusion_models F:\Models\video
```

### 6. Реализовать админ-панель

**Файлы для создания:**

```
apps/admin/app/
├── page.tsx                      # Redirect → /status
├── status/page.tsx               # Сводка систем
├── paths/page.tsx                # Редактирование paths.json
├── upload/page.tsx               # Drag & drop → F:\Drop\in
├── generate/page.tsx             # Форма генерации
├── queue/page.tsx                # Список jobs
├── results/page.tsx              # Грид результатов
└── api/
    ├── selfcheck/route.ts        # GET — проверка систем
    ├── paths/route.ts            # GET/POST — paths.json
    ├── job/route.ts              # POST — создание задачи
    ├── jobs/route.ts             # GET — список jobs
    └── results/route.ts          # GET — список результатов
```

**Примеры кода см. в `SETUP-GUIDE.md`** (раздел "Шаг 7: API Route Handlers")

### 7. UI Tooltips (точные тексты)

См. таблицу в `SETUP-GUIDE.md` (раздел "Шаг 8: UI Tooltips")

Для каждого поля формы добавить:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Info className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>{/* Текст из таблицы */}</p>
  </TooltipContent>
</Tooltip>
```

### 8. Запустить проект

```powershell
# ComfyUI
cd F:\ComfyUI
.\run_nvidia_gpu.bat
# → Откроется http://127.0.0.1:8188

# Next.js админка (в другом терминале)
cd C:\Work\Orchestrator
pnpm dev
# → Откроется http://localhost:3000
```

---

## 📚 Документация

- **SETUP-GUIDE.md** — полная пошаговая инструкция (14KB)
- **reconnaissance.md** — технический анализ зависимостей

---

## 🔐 Безопасность

✅ API ключи в `.env.local` (gitignored)  
✅ Логи без секретов  
✅ Модалка подтверждения для Flux (платный API)  
✅ Валидация paths.json (модели только на F:\)

---

## ✅ Checklist

- [x] paths.json создан
- [x] scripts/paths-check.mjs работает
- [x] Connectors (Flux + ComfyUI) созданы
- [x] extra_model_paths.yaml настроен
- [x] Workflows (SDXL, SD3.5, SVD) созданы
- [x] import-models.mjs готов
- [x] .env.local с HF_TOKEN и BFL_API_KEY
- [ ] Next.js админка инициализирована ← **СДЕЛАЙТЕ**
- [ ] shadcn/ui установлен ← **СДЕЛАЙТЕ**
- [ ] ComfyUI скачан в F:\ComfyUI ← **СДЕЛАЙТЕ**
- [ ] Модели импортированы ← **СДЕЛАЙТЕ**
- [ ] Админ-панель реализована ← **СДЕЛАЙТЕ**
- [ ] UI tooltips добавлены ← **СДЕЛАЙТЕ**

---

## 🎯 Критические напоминания

1. **Генерация ТОЛЬКО по кнопкам** — никакой автоматики
2. **Flux = платный API** — модалка подтверждения обязательна
3. **Модели/кэш ТОЛЬКО на F:\** — валидация в /api/paths
4. **Tooltips** — строго по текстам из SETUP-GUIDE.md
5. **Логи** — HF_TOKEN и BFL_API_KEY не выводятся

---

**Проект готов к реализации! Следуйте SETUP-GUIDE.md шаг за шагом.** 🚀
