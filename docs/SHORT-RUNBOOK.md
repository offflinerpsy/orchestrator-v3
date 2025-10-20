# Builder v0 — Quick Testing Runbook

> **Created:** 2025-10-20  
> **Modern patterns:** Context7-based React code (useCallback, typed events, Radix UI)  
> **Test duration:** ~5 minutes for full smoke test

## Prerequisites

```powershell
# 1. Panel running
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":...}

# 2. ComfyUI running
curl http://127.0.0.1:8188/system_stats
# Expected: {"system":{"os":"...","python_version":"..."}}
```

---

## Scenario 1: Replace Text Element

**Goal:** Select a heading, edit text, apply changes to source file.

### Steps

1. **Navigate to Builder**
   ```
   http://localhost:3000/builder-v0
   ```
   - **Expected:** Three-column layout loads (Chat | Preview | Inspector)

2. **Enable Design Mode**
   - Click **"Дизайн"** button in center toolbar
   - **Expected:** 
     - Button turns blue (active state)
     - Preview cursor changes to crosshair
     - Status text: "Наведите курсор на элемент для выбора"

3. **Select Heading Element**
   - Hover over any `<h1>` or `<h2>` in preview
   - **Expected:** Blue overlay highlights element
   - Click element
   - **Expected:** 
     - Right panel shows element details
     - "Содержимое" tab active
     - Textarea displays current text

4. **Edit Content**
   - Change text in textarea (e.g., "New Heading Text")
   - Click **"Применить изменения"** button
   - **Expected:**
     - Alert: "✅ Изменения применены успешно"
     - Preview updates with new text (currently stub — won't actually change)

5. **Verify Tooltip**
   - Hover over Info icon (ⓘ) next to "Применить изменения"
   - **Expected:** Tooltip shows: "Что произойдёт: Изменения записываются в исходный файл через AST парсинг..."

### Curl Equivalent

```bash
# Apply changes API
curl -X POST http://localhost:3000/api/builder-v0/apply-changes \
  -H "Content-Type: application/json" \
  -d '{
    "locator": "#hero > h1:nth-of-type(1)",
    "changes": {
      "content": "New Heading Text"
    }
  }'

# Expected response:
# {"success":true,"message":"Changes applied"}
```

---

## Scenario 2: Replace Image with SDXL Generation

**Goal:** Select an image, generate new image via ComfyUI, auto-replace in preview.

### Steps

1. **Enable Design Mode**
   - Same as Scenario 1 step 2

2. **Select Image Element**
   - Click on any `<img>` element in preview
   - **Expected:**
     - Right panel shows "Текущее изображение: /path/to/image.jpg"
     - "Действия" tab highlighted

3. **Switch to Actions Tab**
   - Click **"Действия"** tab in Inspector
   - **Expected:**
     - Tab becomes active (blue border-bottom)
     - Generation form appears

4. **Generate Image**
   - Enter prompt: `"sunset over mountains, photorealistic, 4k"`
   - Click **"Сгенерировать (локально, SDXL)"**
   - **Expected:**
     - Button shows loading state
     - Console logs: `[Inspector] Generating image...`
     - Wait ~20-30 seconds (ComfyUI SDXL workflow)

5. **Verify Image Replacement**
   - **Expected:**
     - Alert: "✅ Изображение сгенерировано и заменено: /outputs/..."
     - Image in preview updates automatically (via postMessage)
     - Console: `[DesignMode] Updated image src: ...`

6. **Verify Tooltip**
   - Hover over Zap icon in "Действия" tab button
   - **Expected:** Tooltip: "AI генерация изображений через ComfyUI"

### Curl Equivalent

```bash
# Generate image API
curl -X POST http://localhost:3000/api/builder-v0/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "sunset over mountains, photorealistic, 4k",
    "locator": "#hero > img:nth-of-type(1)",
    "width": 1024,
    "height": 1024
  }'

# Expected response (after ~30s):
# {
#   "success": true,
#   "imagePath": "/outputs/ComfyUI_12345.png",
#   "workflow": "sdxl"
# }
```

---

## Scenario 3: Slash Commands in Chat

**Goal:** Use slash commands to control Design Mode programmatically.

### Steps

1. **Open Chat Panel**
   - Left sidebar should be visible by default

2. **Enable Design Mode via Command**
   - Type in chat input: `/design on`
   - Press Enter
   - **Expected:**
     - Assistant message: "Design Mode включен"
     - Center panel switches to Design Mode (same as clicking button)

3. **Select Element via Command**
   - Type: `/select #hero > h1:nth-of-type(1)`
   - Press Enter
   - **Expected:**
     - Assistant: "Элемент выбран: #hero > h1:nth-of-type(1)"
     - Right panel shows element details (same as clicking)

4. **Disable Design Mode**
   - Type: `/design off`
   - Press Enter
   - **Expected:**
     - Assistant: "Design Mode выключен"
     - Preview cursor returns to normal
     - Blue button in toolbar becomes inactive

---

## Scenario 4: Mode Toggle Tooltips

**Goal:** Verify all tooltips display correctly.

### Tooltips to Test

| Element | Location | Expected Tooltip |
|---------|----------|------------------|
| **"Просмотр"** button | Center toolbar | "Режим просмотра: навигация по сайту без изменений" |
| **"Дизайн"** button | Center toolbar | "Режим дизайна: Кликните на элемент (текст/изображение) для редактирования..." |
| **"Содержимое"** tab | Inspector | "Редактировать текст или атрибуты элемента" |
| **"Стиль"** tab | Inspector | "CSS классы и inline стили (скоро)" |
| **"Действия"** tab | Inspector | "AI генерация изображений через ComfyUI" |
| **Info icon** (Apply) | Inspector content tab | "Что произойдёт: Изменения записываются в исходный файл..." |

---

## Build & Deployment

### Build Check

```powershell
cd C:\Work\Orchestrator\apps\admin
pnpm run build

# Expected output:
# ✓ Finalizing page optimization
# Route (app)                        Size     First Load JS
# ├ ○ /builder-v0                    5.88 kB  252 kB
# ├ ƒ /api/builder-v0/apply-changes  429 B    221 kB
# ├ ƒ /api/builder-v0/generate-image 432 B    221 kB
# 
# Exit Code: 0
```

### Service Restart

```powershell
# Restart Panel service (requires admin PowerShell)
nssm restart OrchestratorPanel

# Wait for startup
Start-Sleep -Seconds 10

# Verify routes
curl http://localhost:3000/builder-v0 -Method HEAD
# Expected: HTTP 200

curl http://localhost:3000/api/comfy/system_stats
# Expected: {"system":{...}}
```

---

## Known Issues & Limitations

### Current Stub Implementations

1. **Apply Changes API** (`/api/builder-v0/apply-changes`)
   - Returns success without file writes
   - **TODO:** Implement AST parsing + file I/O

2. **Design Mode Overlay**
   - Injected via script tag in `<body>`
   - **TODO:** Move to Next.js public folder (`/design-mode-script.js`)

3. **Image Replacement**
   - postMessage sent but iframe may not have listener
   - **TODO:** Ensure overlay script loaded before postMessage

### Performance Notes

- SDXL generation: ~20-30s (depends on GPU)
- Build time: ~45s (Next.js 15 optimizations)
- First load JS: 252 kB (within budget for admin panel)

---

## Success Criteria

✅ **PASS** if all scenarios complete without errors  
✅ **PASS** if tooltips display on hover  
✅ **PASS** if Design Mode toggles visually  
✅ **PASS** if slash commands trigger mode changes  
✅ **PASS** if build completes with Exit Code 0  

⚠️ **WARN** if image replacement takes >60s (ComfyUI overloaded)  
❌ **FAIL** if white screen on `/builder-v0` (React error)  
❌ **FAIL** if TypeScript compilation errors  

---

## Rollback Plan

```powershell
# If deployment breaks production:
git log --oneline -5
# Find previous commit SHA

git reset --hard <PREVIOUS_SHA>

nssm restart OrchestratorPanel
```

---

## Contacts

**Maintainer:** Orchestrator v3 Team  
**Inspired by:** [Dyad Project](https://github.com/dyad-sh/dyad) (Apache-2.0)  
**Context7 Queries Used:** 
- `react+iframe+postMessage+modern+typescript`
- `radix+ui+tooltip+react+19+best+practices`
- `apache+license+header+typescript+2025`

**Last Updated:** 2025-10-20 (Modern React patterns applied)
