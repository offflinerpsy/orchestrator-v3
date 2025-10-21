# Project Map — Orchestrator V3

**Purpose:** Catalog of all significant artifacts (code, config, docs, tests).

---

## Repository Structure

```
Orchestrator/
├── apps/
│   ├── admin/                      # Next.js 15 admin panel
│   │   ├── app/                    # App Router (pages, API routes)
│   │   │   ├── api/
│   │   │   │   ├── flux/           # Flux Ultra generation endpoint
│   │   │   │   ├── comfy/          # ComfyUI workflow dispatch
│   │   │   │   └── jobs/stream/    # SSE job status feed
│   │   │   ├── builder/            # Legacy Builder UI
│   │   │   ├── builder-v0/         # NEW: Unified builder (Chat+Canvas+Queue)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── builder-v0/         # CanvasPreview, ChatSidebar, Inspector, JobQueue, CommandPalette
│   │   │   └── ui/                 # Radix shadcn/ui primitives
│   │   ├── tests/
│   │   │   ├── e2e/                # Playwright specs (*.spec.ts)
│   │   │   └── a11y/               # Axe-core runner (run-axe.mjs)
│   │   ├── playwright.audit.config.ts  # Audit-optimized config (port 3002)
│   │   ├── lighthouserc.json       # LHCI assertions
│   │   └── package.json            # Scripts: revisor:*, test:*
│   └── site/                       # Public site (future)
├── packages/
│   └── connectors/                 # Flux/ComfyUI/download helpers
├── scripts/
│   ├── audit-summarize.mjs         # Aggregate Playwright/LHCI/Axe reports
│   ├── paths-check.mjs             # Validate model paths
│   └── import-models.mjs           # HuggingFace model download
├── jobs/                           # Job artifacts (JSON metadata + outputs)
├── logs/                           # Path validation logs
├── docs/
│   ├── PROJECT-INDEX.md            # → This index (entry point)
│   ├── PROJECT-MAP.md              # → This file
│   ├── PROJECT-STATUS-FULL.md      # Aggregated status dashboard
│   ├── PROJECT-MEMORY/
│   │   └── MEMORY-LATEST.md        # Current architecture snapshot
│   ├── STATUS/
│   │   └── DIFF-SUMMARY.md         # Git commit snapshot (Phase 0)
│   ├── adr/                        # Architecture Decision Records (MADR)
│   ├── REVISOR-REPORT.md           # Audit pipeline setup guide
│   ├── BUILDER-V0-COMPLETE.md      # Feature completion report
│   └── _artifacts/                 # Historical test/audit artifacts
├── .github/workflows/
│   └── revisor.yml                 # CI: Playwright + LHCI + Axe (Windows runner)
├── CHANGELOG.md                    # Version history (Keep a Changelog)
└── package.json                    # Workspace root scripts
```

---

## Key Interfaces

### API Endpoints (Next.js Route Handlers)

| Path | Method | Purpose |
|------|--------|---------|
| `/api/flux` | POST | Submit Flux Ultra generation (BFL SDK) |
| `/api/comfy` | POST | Dispatch ComfyUI workflow (via REST API) |
| `/api/jobs/stream` | GET | SSE feed of job status (queued/progress/done/error) |
| `/api/jobs` | GET | List all job metadata (JSON files) |
| `/api/jobs/[id]` | GET | Retrieve single job details |

### Frontend Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/builder-v0` | `apps/admin/app/builder-v0/page.tsx` | Unified builder (Chat + Canvas + Inspector + Queue) |
| `/builder` | (legacy) | Original builder UI (deprecated) |
| `/` | Landing | Dashboard links |

---

## Test Artifacts

- **Playwright Reports:** `apps/admin/playwright-report/index.html` (after `pnpm test:smoke`)
- **Lighthouse Reports:** `apps/admin/reports/lhci/*.html` (after `pnpm revisor:lhci`)
- **Axe Reports:** `apps/admin/reports/axe/*.json` (after `pnpm revisor:axe`)
- **Aggregated Summary:** `docs/_audit/<timestamp>/INDEX.md` (via `pnpm revisor:report`)

---

## Configuration Files

- **TypeScript:** `tsconfig.json` (apps/admin)
- **Tailwind:** `tailwind.config.ts`
- **ESLint:** `.eslintrc.json`
- **EditorConfig:** `.editorconfig`
- **Package Manager:** `pnpm-lock.yaml` (pnpm 8+)

---

## External Dependencies

- **Flux Ultra:** Black Forest Labs API (`BFL_API_KEY` required for production)
- **ComfyUI:** Local/remote instance (URL configured via env)
- **Models:** SDXL/SD3.5/SVD checkpoints (see `paths.json` + `scripts/import-models.mjs`)

---

For navigation, return to [`PROJECT-INDEX.md`](./PROJECT-INDEX.md).
