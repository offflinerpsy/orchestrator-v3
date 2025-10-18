# Orchestrator V6 — Ultra Builder Implementation Status

**Date:** 2025-10-18  
**Phase:** Iterative Development (R → I → P approach)  
**Current Sprint:** Phase 1-2 Completed

---

## ✅ Completed (Phases 1-2)

### Phase 1: Core UI + Service Controls
- **v0 UX Research** (`docs/v0-ux-notes.md`)
  - Documented 8 key patterns from v0 Platform API
  - Lifecycle flow: prompt → files → demo
  - Responsive layout strategy
- **Resources Documentation** (`docs/links.md`)
  - All API references consolidated
  - v0, FLUX, ComfyUI, shadcn, Playwright links
- **Builder UI** (`/builder`)
  - 4-panel layout: Top Bar, Center (Tabs), Left/Right Drawers
  - Composer placeholder (slash commands planned)
  - Tabs: Preview (iframe), Canvas (grid), Diff (code view)
- **Home Page** (`/`)
  - Service status cards (ComfyUI, FLUX, v0)
  - Real-time API key validation
  - Start/Stop buttons for ComfyUI
- **shadcn/ui Components**
  - Button, Card, Tabs, Tooltip, AlertDialog
  - utils.ts with `cn()` helper
- **API Endpoints Created**
  - `/api/comfyui/service` (GET/POST) — Start/Stop ComfyUI
  - `/api/keys/validate` (GET) — Check BFL_API_KEY + V0_API_KEY
  - `/api/generate` (POST) — FLUX + ComfyUI generation
  - `/api/jobs` (GET) — List all jobs

### Phase 2: Queue System + Generation
- **Queue Panel** (`components/queue-panel.tsx`)
  - Real-time polling (every 3s)
  - Status indicators: created, queued, running, done, failed
  - Progress bars for running jobs
  - Run/Cancel/View Result actions
- **Generation Form** (`components/generation-form.tsx`)
  - Backend selector: FLUX, SDXL, SD 3.5, SVD
  - Prompt textarea with tooltips
  - FLUX confirmation modal (⚠️ Paid API warning)
  - Integration with /api/generate
- **Guard Script** (`scripts/guard-model-paths.mjs`)
  - Backup/restore `extra_model_paths.yaml`
  - Check F:\ permissions
  - Prevent ComfyUI updates from breaking paths
  - Added `pnpm guard:models` command
- **GitHub MCP Integration** (`.vscode/mcp.json`)
  - Configured GitHub MCP Server
  - Enables "Open PR" from chat/panel

---

## 🚧 In Progress (Phase 3)

### Planned Next Steps
1. **Canvas Tab Implementation**
   - Grid display of generated images/videos
   - Lightbox modal for full-size view
   - Filters: backend, date, status
   - Download ZIP functionality

2. **v0 Platform API Enhancement** (`/api/v0`)
   - Streaming responses (SSE format)
   - File preview generation
   - Insert to project logic
   - PR creation via MCP

3. **Presets System**
   - Hero 21:9 (FLUX raw mode)
   - Catalog 16:9 (SDXL + i2i + Depth)
   - Detail 4:3 (SD3.5 + IP-Adapter)
   - "Series of Views" batch generation

4. **Tooltips** (Section 9 spec)
   - Backend, Source image, Prompt, Negative
   - FLUX: raw, aspect_ratio, image_prompt_strength
   - SDXL/SD3.5: denoise, IP-Adapter weight, ControlNet Depth
   - v0, Screenshots

---

## 📦 Dependencies Installed

```json
{
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-tabs": "^1.1.13",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-alert-dialog": "^1.1.15",
  "@radix-ui/react-tooltip": "^1.2.8",
  "@radix-ui/react-select": "^2.2.6",
  "class-variance-authority": "^latest",
  "clsx": "^latest",
  "tailwind-merge": "^latest",
  "lucide-react": "^latest"
}
```

---

## 🗂️ File Structure (New/Modified)

```
C:\Work\Orchestrator/
├── apps/admin/
│   ├── app/
│   │   ├── page.tsx                           (✏️ Modified - Service cards)
│   │   ├── builder/page.tsx                   (✨ New - Main builder UI)
│   │   └── api/
│   │       ├── comfyui/service/route.ts       (✨ New)
│   │       ├── keys/validate/route.ts         (✨ New)
│   │       ├── generate/route.ts              (✨ New)
│   │       └── jobs/route.ts                  (✨ New)
│   ├── components/
│   │   ├── service-cards.tsx                  (✨ New)
│   │   ├── queue-panel.tsx                    (✨ New)
│   │   ├── generation-form.tsx                (✨ New)
│   │   └── ui/
│   │       ├── button.tsx                     (✨ New)
│   │       ├── card.tsx                       (✨ New)
│   │       ├── tabs.tsx                       (✨ New)
│   │       ├── tooltip.tsx                    (✨ New)
│   │       └── alert-dialog.tsx               (✨ New)
│   ├── lib/utils.ts                           (✨ New)
│   └── package.json                           (✏️ Modified)
├── scripts/
│   └── guard-model-paths.mjs                  (✨ New)
├── docs/
│   ├── v0-ux-notes.md                         (✨ New)
│   └── links.md                               (✨ New)
├── .vscode/
│   └── mcp.json                               (✨ New)
└── package.json                               (✏️ Modified)
```

---

## 🎯 Acceptance Criteria (v0 UX Patterns)

| Pattern | Status | Notes |
|---------|--------|-------|
| ✅ Composer (single input) | 🚧 Partial | Layout ready, slash commands pending |
| ✅ Live Preview (iframe) | ✅ Done | Tab ready, v0 demo URL integration pending |
| ✅ File List & Code View | 🚧 Planned | Will be in Diff tab |
| ✅ Project & Chat Management | ✅ Done | Queue = chats, Site Tree = projects |
| ⚠️ One-Click Deployment | 🚧 Partial | MCP configured, "Open PR" button pending |
| ✅ Rate Limiting & Modals | ✅ Done | FLUX modal implemented |
| ✅ Session Caching & Performance | ✅ Done | Jobs polling, optimistic UI |
| ✅ Responsive Design | ✅ Done | Collapsible drawers, mobile-first |

---

## 🧪 Testing Status

### Manual Tests (Home Page)
- ✅ ComfyUI Start/Stop buttons appear
- ⚠️ Start action (pending F:\ComfyUI presence)
- ⚠️ Stop action (pending running instance)
- ✅ FLUX key validation (dry-run check)
- ✅ v0 key validation (length check)

### Manual Tests (Builder)
- ✅ Layout renders (4 panels)
- ✅ Queue polling works (empty state)
- ✅ Generation form submits
- ✅ FLUX modal triggers on selection
- ⚠️ Actual generation (pending ComfyUI/FLUX setup)

---

## 📊 Metrics

- **Lines of Code Added:** ~3,700+
- **Components Created:** 8
- **API Routes Created:** 4
- **Commits:** 2 (Phase 1, Phase 2)
- **Documentation:** 2 new files (v0-ux-notes, links)

---

## 🚀 Next Sprint Plan

1. **Canvas Tab** (2-3 hours)
   - Read files from `F:\Drop\out`
   - Grid display with thumbnails
   - Lightbox modal

2. **v0 Integration** (3-4 hours)
   - Install `v0-sdk`
   - Implement `/api/v0` with streaming
   - Preview + Insert UI

3. **Presets & Tooltips** (1-2 hours)
   - Add preset dropdown
   - Complete tooltip texts (Section 9)

4. **Final Polish** (1 hour)
   - UI tweaks
   - Error handling
   - Loading states

**Estimated Total:** 7-10 hours remaining

---

## 🔗 Critical Resources

- **v0 UX Docs:** `docs/v0-ux-notes.md`
- **API Links:** `docs/links.md`
- **Guard Script:** `scripts/guard-model-paths.mjs`
- **GitHub MCP:** `.vscode/mcp.json`

---

## ⚠️ Known Issues / TODOs

1. ComfyUI workflow injection (TODO in `/api/generate`)
   - Currently just loads workflow JSON
   - Need to parse nodes and inject prompt/params

2. Job cancellation not implemented
   - Queue shows Cancel button but no backend support yet

3. Canvas tab empty
   - Needs file reading from `F:\Drop\out`
   - Image lazy loading

4. v0 SDK not installed
   - Add `pnpm add v0-sdk` when ready

5. Slash commands in Composer
   - Placeholder exists, logic pending

---

**Status:** ✅ Phase 1-2 Complete | 🚧 Phase 3 In Progress  
**Branch:** `feat/tilda-import` (will create separate branch for v6)  
**Last Commit:** `fdec80c` (Phase 2)
