# Orchestrator V3 — Quick Start Cheatsheet

## 🎯 Что уже готово ✅

```
C:\Work\Orchestrator\
├── paths.json              ✅ Реестр путей
├── .env.local              ✅ HF_TOKEN + BFL_API_KEY
├── scripts/
│   ├── paths-check.mjs     ✅ Проверка: node scripts/paths-check.mjs
│   └── import-models.mjs   ✅ Импорт моделей: node scripts/import-models.mjs
├── packages/connectors/    ✅ Flux + ComfyUI API
├── SETUP-GUIDE.md          ✅ Полная инструкция (14KB)
└── README.md               ✅ Главная документация

F:\ComfyUI\extra_model_paths.yaml  ✅ Конфигурация
F:\Workflows\*.json                 ✅ SDXL, SD3.5, SVD workflows
```

---

## 📋 Что делать дальше

### 1️⃣ Создать Next.js админку

```powershell
cd C:\Work\Orchestrator
pnpm create next-app apps/admin --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 2️⃣ Установить shadcn/ui

```powershell
cd apps/admin
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label select textarea tabs tooltip badge alert-dialog
pnpm add react-hook-form zod @hookform/resolvers
```

### 3️⃣ Скачать ComfyUI

1. https://github.com/comfyanonymous/ComfyUI/releases
2. Скачать **ComfyUI_windows_portable_nvidia_cu121_or_cpu.7z**
3. Распаковать в `F:\ComfyUI`

### 4️⃣ Принять лицензии на HuggingFace

- **SD 3.5:** https://huggingface.co/stabilityai/stable-diffusion-3.5-medium  
  → **"Agree and access repository"**

- **SVD 1.1:** https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1  
  → **"Agree and access repository"**

### 5️⃣ Импортировать модели

```powershell
cd C:\Work\Orchestrator
node scripts/import-models.mjs
```

Скачает ~25 GB (SDXL, SD3.5, ControlNet, IP-Adapter, SVD).

### 6️⃣ Реализовать админ-панель

**Страницы:**
- `app/status/page.tsx` — сводка систем
- `app/paths/page.tsx` — редактор paths.json
- `app/upload/page.tsx` — drag & drop
- `app/generate/page.tsx` — форма генерации
- `app/queue/page.tsx` — список jobs
- `app/results/page.tsx` — грид результатов

**API Routes:**
- `app/api/selfcheck/route.ts`
- `app/api/paths/route.ts`
- `app/api/job/route.ts`
- `app/api/jobs/route.ts`
- `app/api/results/route.ts`

**Примеры кода:** см. `SETUP-GUIDE.md` (раздел "Шаг 7")

### 7️⃣ Добавить tooltips

Таблица с текстами в `SETUP-GUIDE.md` (раздел "Шаг 8").

Пример:
```tsx
<Tooltip>
  <TooltipTrigger><Info /></TooltipTrigger>
  <TooltipContent>
    <p>Где рендерим: Flux (облако), SDXL/SD3.5 (локально), SVD (видео).</p>
  </TooltipContent>
</Tooltip>
```

### 8️⃣ Запустить

```powershell
# ComfyUI
cd F:\ComfyUI
.\run_nvidia_gpu.bat

# Next.js (другой терминал)
cd C:\Work\Orchestrator
pnpm dev
```

---

## 🔑 Ключевые команды

| Команда | Описание |
|---------|----------|
| `node scripts/paths-check.mjs` | Проверка путей (C: vs F:) |
| `node scripts/import-models.mjs` | Импорт моделей из HF |
| `pnpm dev` | Запуск Next.js админки |
| `F:\ComfyUI\run_nvidia_gpu.bat` | Запуск ComfyUI сервера |

---

## 🔐 API Ключи (уже в .env.local)

```env
HF_TOKEN=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
BFL_API_KEY=e4ac44c9-c0a6-469c-a72a-8b5dcbe38dbc
COMFYUI_URL=http://127.0.0.1:8188
```

---

## 📚 Документация

- **SETUP-GUIDE.md** — пошаговая инструкция (14KB)
- **reconnaissance.md** — технический анализ (20KB)
- **implementation-report.md** — статус реализации (15KB)

---

## ⚠️ Критические правила

1. **Генерация ТОЛЬКО по кнопкам** — никакой автоматики
2. **Flux** — платный API, модалка подтверждения обязательна
3. **Модели на F:\** — валидация в /api/paths
4. **Tooltips** — строго по текстам из SETUP-GUIDE.md
5. **Логи** — HF_TOKEN и BFL_API_KEY не выводятся

---

## 🆘 Troubleshooting

### ComfyUI не видит модели

```powershell
# Вариант 1: Проверить extra_model_paths.yaml
notepad F:\ComfyUI\extra_model_paths.yaml

# Вариант 2: Создать junction (от админа)
cd F:\ComfyUI\models
mklink /J checkpoints F:\Models\checkpoints
mklink /J controlnet F:\Models\controlnet
mklink /J ipadapter F:\Models\ipadapter
mklink /J diffusion_models F:\Models\video
```

### HF скачивание 403

Принять лицензии:
- https://huggingface.co/stabilityai/stable-diffusion-3.5-medium
- https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1

### Next.js не видит .env.local

Положить в `C:\Work\Orchestrator\apps\admin\.env.local` или в корень монорепо.

---

## ✅ Checklist

- [x] paths.json создан
- [x] paths-check.mjs работает
- [x] Connectors готовы
- [x] Workflows созданы
- [x] import-models.mjs готов
- [x] .env.local настроен
- [ ] Next.js app создан ← **СДЕЛАЙТЕ**
- [ ] shadcn/ui установлен ← **СДЕЛАЙТЕ**
- [ ] ComfyUI скачан ← **СДЕЛАЙТЕ**
- [ ] Модели импортированы ← **СДЕЛАЙТЕ**
- [ ] Админка реализована ← **СДЕЛАЙТЕ**

---

**Всё готово к запуску! Следуйте SETUP-GUIDE.md.** 🚀
