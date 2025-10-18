# Orchestrator V3 — Setup Guide

## 🎯 Архитектура

```
C:\Work\Orchestrator\           # Проект (исходники, конфиги)
  ├── apps/
  │   └── admin/                # Next.js админ-панель
  ├── packages/
  │   ├── connectors/           # Flux + ComfyUI API
  │   └── ui/                   # Переиспользуемые UI компоненты
  ├── scripts/
  │   ├── paths-check.mjs       # ✅ Валидация путей
  │   └── import-models.mjs     # Загрузка моделей из HF
  ├── paths.json                # ✅ Реестр путей (C: vs F:)
  ├── .env.local                # ✅ Секреты (HF_TOKEN, BFL_API_KEY)
  └── package.json              # ✅ Монорепо (pnpm workspaces)

F:\ComfyUI\                     # ComfyUI Portable (Windows)
  ├── extra_model_paths.yaml    # Указывает на F:\Models
  └── run_nvidia_gpu.bat        # Запуск сервера

F:\Models\                      # Модели (от HF)
  ├── checkpoints/              # SDXL Base, SD3.5 Medium
  ├── controlnet/               # ControlNet Depth
  ├── ipadapter/                # IP-Adapter SDXL
  └── video/                    # SVD 1.1

F:\Cache\HF\                    # HuggingFace cache

F:\Drop\                        # Input/output файлов
  ├── in/                       # Загрузка изображений
  └── out/                      # Результаты генерации

F:\Workflows\                   # ComfyUI workflows (API format)
  ├── sdxl-i2i.json
  ├── sd35-i2i.json
  └── svd-i2v.json
```

---

## 📋 Шаг 1: Проверка путей

```powershell
cd C:\Work\Orchestrator
node scripts/paths-check.mjs
```

**Ожидаемый результат:**
```
✅ Все проверки пройдены успешно!
🎨 Orchestrator V3 готов к работе
```

Скрипт создаст все недостающие директории на F:\ автоматически.

---

## 📦 Шаг 2: Установка зависимостей (monorepo)

### 2.1. Установить pnpm (если нет)

```powershell
npm install -g pnpm
```

### 2.2. Создать Next.js админку

```powershell
cd C:\Work\Orchestrator
pnpm create next-app apps/admin --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Ответы на вопросы:**
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No**
- App Router: **Yes**
- Import alias (@/*): **Yes**

### 2.3. Настроить workspace

Обновить `C:\Work\Orchestrator\package.json`:

```json
{
  "name": "orchestrator-v3",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "paths:check": "node scripts/paths-check.mjs",
    "models:import": "node scripts/import-models.mjs",
    "dev": "pnpm --filter admin dev",
    "build": "pnpm --filter admin build",
    "start": "pnpm --filter admin start"
  },
  "devDependencies": {
    "@types/node": "^20.11.0"
  },
  "dependencies": {
    "dotenv": "^16.4.5"
  }
}
```

### 2.4. Установить shadcn/ui

```powershell
cd apps/admin
pnpm dlx shadcn@latest init
```

**Ответы:**
- Style: **New York**
- Base color: **Zinc**
- CSS variables: **Yes**

Установить компоненты:

```powershell
pnpm dlx shadcn@latest add button card input label select textarea tabs tooltip badge alert-dialog
```

### 2.5. Установить дополнительные зависимости

```powershell
cd C:\Work\Orchestrator\apps\admin
pnpm add react-hook-form zod @hookform/resolvers clsx tailwind-merge
pnpm add -D @types/node
```

---

## 🧩 Шаг 3: Создать connectors (Flux + ComfyUI)

Файлы уже созданы в `packages/connectors/`:
- `flux.ts` — BFL FLUX Ultra API с polling
- `comfy.ts` — ComfyUI HTTP API (:8188/prompt)

### Package.json для connectors

Создать `packages/connectors/package.json`:

```json
{
  "name": "@orchestrator/connectors",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "dependencies": {
    "dotenv": "^16.4.5"
  }
}
```

---

## 🖥️ Шаг 4: ComfyUI Setup

### 4.1. Скачать ComfyUI Portable (Windows)

1. Открыть https://github.com/comfyanonymous/ComfyUI/releases
2. Скачать **ComfyUI_windows_portable_nvidia_cu121_or_cpu.7z** (последняя версия)
3. Распаковать в `F:\ComfyUI`

### 4.2. Создать `extra_model_paths.yaml`

Создать файл `F:\ComfyUI\extra_model_paths.yaml`:

```yaml
comfyui:
  base_path: F:\Models\
  checkpoints: checkpoints\
  controlnet: controlnet\
  ipadapter: ipadapter\
  clip_vision: ipadapter\
  loras: loras\
  vae: vae\
  diffusion_models: video\
```

**Документация:** https://github.com/comfyanonymous/ComfyUI/wiki/Custom-Model-Paths

### 4.3. (Опционально) Junction ссылки

Если ComfyUI не видит модели через `extra_model_paths.yaml`, создайте junction:

```powershell
# ⚠️ Выполнять от имени администратора!
cd F:\ComfyUI\models

# Checkpoints
mklink /J checkpoints F:\Models\checkpoints

# ControlNet
mklink /J controlnet F:\Models\controlnet

# IP-Adapter
mklink /J ipadapter F:\Models\ipadapter

# Video (SVD)
mklink /J diffusion_models F:\Models\video
```

**Документация:** https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mklink

### 4.4. Запустить ComfyUI

```powershell
cd F:\ComfyUI
.\run_nvidia_gpu.bat
```

Открыть http://127.0.0.1:8188 — должен открыться UI.

---

## 📥 Шаг 5: Импорт моделей из HuggingFace

Скрипт `scripts/import-models.mjs` скачивает:

1. **SDXL Base 1.0** → `F:\Models\checkpoints\sdxl_base_1.0.safetensors`
2. **SD 3.5 Medium** → `F:\Models\checkpoints\sd3.5_medium.safetensors` (требует Agree)
3. **ControlNet Depth SDXL** → `F:\Models\controlnet\...`
4. **IP-Adapter SDXL** → `F:\Models\ipadapter\...`
5. **SVD 1.1** → `F:\Models\video/svd_1.1.safetensors` (требует Agree)

### Запуск:

```powershell
cd C:\Work\Orchestrator
node scripts/import-models.mjs
```

**HF_TOKEN** берётся из `.env.local` (уже прописан).

### Agree на лицензии (SD3.5, SVD)

Перед скачиванием SD3.5 и SVD нужно принять условия:

- **SD3.5 Medium:** https://huggingface.co/stabilityai/stable-diffusion-3.5-medium
- **SVD 1.1:** https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1

Откройте страницы, нажмите **"Agree and access repository"**.

---

## 🎨 Шаг 6: Админ-панель — Структура страниц

### 6.1. Страницы (App Router)

Создать файлы:

```
apps/admin/app/
  ├── page.tsx              # → / (редирект на /status)
  ├── status/
  │   └── page.tsx          # Сводка систем (ComfyUI, Flux, HF, models)
  ├── paths/
  │   └── page.tsx          # Редактирование paths.json
  ├── upload/
  │   └── page.tsx          # Drag & drop → F:\Drop\in
  ├── generate/
  │   └── page.tsx          # Форма создания задачи (Flux/SDXL/SD3.5/SVD)
  ├── queue/
  │   └── page.tsx          # Список jobs/*.json
  ├── results/
  │   └── page.tsx          # Грид результатов с лайтбоксом
  └── api/
      ├── selfcheck/
      │   └── route.ts      # GET — проверка ComfyUI, Flux, HF
      ├── paths/
      │   └── route.ts      # GET/POST — чтение/запись paths.json
      ├── job/
      │   └── route.ts      # POST — создание задачи
      ├── jobs/
      │   └── route.ts      # GET — список задач
      └── results/
          └── route.ts      # GET — список результатов
```

### 6.2. Layout с тёмной темой

Обновить `apps/admin/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orchestrator V3 — Admin",
  description: "AI Generation Orchestrator: Flux Ultra + ComfyUI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
```

Обновить `apps/admin/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... остальные токены из shadcn/ui ... */
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... тёмные токены ... */
  }
}
```

---

## 🔌 Шаг 7: API Route Handlers

### 7.1. Selfcheck endpoint

`apps/admin/app/api/selfcheck/route.ts`:

```ts
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    comfyui: false,
    flux: false,
    hf: false,
    models: false
  };

  // 1. ComfyUI
  try {
    const res = await fetch('http://127.0.0.1:8188/system_stats', { signal: AbortSignal.timeout(2000) });
    checks.comfyui = res.ok;
  } catch {}

  // 2. Flux API key
  checks.flux = !!process.env.BFL_API_KEY;

  // 3. HF Token
  checks.hf = !!process.env.HF_TOKEN;

  // 4. Models (проверка paths.json)
  try {
    const { readFile } = await import('fs/promises');
    const paths = JSON.parse(await readFile('../../paths.json', 'utf-8'));
    checks.models = !!paths.modelsRoot;
  } catch {}

  return NextResponse.json(checks);
}
```

### 7.2. Paths endpoint

`apps/admin/app/api/paths/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PATHS_FILE = join(process.cwd(), '../../paths.json');

export async function GET() {
  try {
    const content = await readFile(PATHS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read paths.json' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Валидация: модели/кэш только на F:
    if (!body.modelsRoot?.startsWith('F:\\')) {
      return NextResponse.json({ error: 'modelsRoot must be on F:\\' }, { status: 400 });
    }
    if (!body.hfCache?.startsWith('F:\\')) {
      return NextResponse.json({ error: 'hfCache must be on F:\\' }, { status: 400 });
    }
    
    await writeFile(PATHS_FILE, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write paths.json' }, { status: 500 });
  }
}
```

---

## 📝 Шаг 8: UI Tooltips (точные тексты)

В каждой форме используйте `<Tooltip>` из shadcn/ui:

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Где рендерим: Flux (облако, списывает кредиты), SDXL/SD3.5 (локально, бесплатно), SVD (локальное видео).</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Тексты подсказок (строго по промпту):

| Поле | Текст |
|------|-------|
| **Backend** | Где рендерим: Flux (облако, списывает кредиты), SDXL/SD3.5 (локально, бесплатно), SVD (локальное видео). |
| **Source image** | Локальный путь или URL. Это база для image→image/видео. |
| **Prompt** | Коротко и по существу: сцена, свет, объектив, настроение. |
| **Flux → raw** | Фотореализм, меньше стилизации. [docs.bfl.ai](https://docs.bfl.ai/) |
| **Flux → aspect_ratio** | 21:9 — герой, 16:9 — карточка, 4:3 — детали. |
| **Flux → image_prompt_strength** | 0–1: влияние исходного кадра (0.3–0.5 обычно естественно). |
| **SDXL/SD3.5 → denoise** | 0–1: насколько меняем исходник (0.3–0.45 для лёгких правок). |
| **SDXL/SD3.5 → IP-Adapter weight** | Сходство со стилем референса (если задан ref). [GitHub](https://github.com/cubiq/ComfyUI_IPAdapter_plus) |
| **SDXL/SD3.5 → ControlNet Depth** | Сохраняем геометрию сцены по карте глубины. [comfyui-wiki.com](https://comfyui-wiki.com/controlnet) |
| **SVD → frames/fps/motion** | Длина, частота и интенсивность движения в видео из кадра. |
| **Paths → Models root** | Хранилище весов на F:. ComfyUI видит их через extra_model_paths.yaml [что это](https://github.com/comfyanonymous/ComfyUI/wiki/Custom-Model-Paths) |
| **HF Token** | Токен read. Храним только в .env.local. [Hugging Face](https://huggingface.co/settings/tokens) |

---

## 🚀 Шаг 9: Запуск

### 9.1. Dev mode

```powershell
cd C:\Work\Orchestrator
pnpm dev
```

Открыть http://localhost:3000

### 9.2. Production build

```powershell
pnpm build
pnpm start
```

---

## ✅ Checklist

- [x] `paths.json` создан и проверен (`paths:check`)
- [x] `.env.local` с HF_TOKEN и BFL_API_KEY
- [ ] Next.js админка инициализирована (`pnpm create next-app`)
- [ ] shadcn/ui установлен и настроен
- [ ] Connectors (Flux + ComfyUI) созданы
- [ ] ComfyUI скачан и распакован в F:\ComfyUI
- [ ] `extra_model_paths.yaml` настроен
- [ ] Модели импортированы (`pnpm models:import`)
- [ ] Workflows (sdxl-i2i, sd35-i2i, svd-i2v) экспортированы
- [ ] API routes реализованы
- [ ] UI страницы (/status, /paths, /generate, /queue, /results, /upload)
- [ ] Tooltips с точными текстами добавлены
- [ ] Модалка подтверждения для Flux реализована
- [ ] V0 SDK добавлен (опционально)
- [ ] Playwright добавлен для скриншотов (опционально)

---

## 📚 Документация

- **ComfyUI Custom Model Paths:** https://github.com/comfyanonymous/ComfyUI/wiki/Custom-Model-Paths
- **BFL FLUX API:** https://docs.bfl.ai/
- **Hugging Face Tokens:** https://huggingface.co/settings/tokens
- **shadcn/ui:** https://ui.shadcn.com/
- **Next.js App Router:** https://nextjs.org/docs/app
- **Vercel v0:** https://v0.dev/docs/quickstart
- **Playwright:** https://playwright.dev/docs/screenshots

---

## 🛠️ Troubleshooting

### ComfyUI не видит модели

1. Проверить `F:\ComfyUI\extra_model_paths.yaml` — правильные пути?
2. Создать junction ссылки (`mklink /J`)
3. Перезапустить `run_nvidia_gpu.bat`

### HF скачивание падает с 403

Принять лицензии на Hugging Face:
- https://huggingface.co/stabilityai/stable-diffusion-3.5-medium
- https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1

### Next.js не видит .env.local

Убедиться что `.env.local` находится в `C:\Work\Orchestrator\apps\admin\.env.local` ИЛИ в корне монорепо.

---

## 🎉 Готово!

После выполнения всех шагов у вас будет:

✅ Полнофункциональная админ-панель на Next.js  
✅ Flux Ultra API интеграция  
✅ ComfyUI + SDXL/SD3.5/SVD  
✅ Импорт моделей из HuggingFace  
✅ Подсказки в UI с точными текстами  
✅ Разделение C: (проект) и F: (модели)  

**Генерация происходит только по кнопкам в админке — никакой автоматики!**
