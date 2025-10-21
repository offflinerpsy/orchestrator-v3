# Project Memory — LATEST (Oct 21, 2025)

**Snapshot:** `main` branch @ commit `f68cb84` (unreleased)  
**Phase:** Post-Builder V0 → stabilization + CI/CD integration

---

## 1. Architecture (1-paragraph summary)

Orchestrator V3 is a Next.js 15 (App Router) admin panel for AI image generation, orchestrating **Flux Ultra** (Black Forest Labs API) and **ComfyUI** (local/remote workflows). The **Builder V0** UI integrates a chat-driven design system with real-time canvas preview (iframe), SSE-based job queue, and a command palette (cmdk). Jobs are persisted as JSON files (`jobs/*.json`), and status updates stream via `/api/jobs/stream` (Server-Sent Events). The stack: React 18 + TypeScript + Tailwind + Radix UI + v0 SDK.

---

## 2. System Nodes & Interfaces

### Frontend (`apps/admin/`)
- **Builder V0** (`/builder-v0`): Unified workspace (Chat + Canvas + Inspector + Queue + Command Palette)
  - **ChatSidebar**: User input → sends `/design`, `/generate`, `/import` commands
  - **CanvasPreview**: Renders v0 SDK iframe (`data-testid="canvas-iframe"`)
  - **Inspector**: Shows element properties + template gallery
  - **JobQueue**: SSE-fed list of generation jobs (modal overlay)
  - **CommandPalette**: Cmd+K shortcuts (navigation, design, generation)

### Backend (Next.js Route Handlers)
- **`/api/flux`** (POST): Flux Ultra dispatch → `@black-forest-labs/flux-sdk`
- **`/api/comfy`** (POST): ComfyUI workflow submission → HTTP to ComfyUI server
- **`/api/jobs/stream`** (GET): SSE endpoint polling `jobs/*.json` + heartbeat every 10s
- **`/api/jobs`** (GET): List all job metadata
- **`/api/jobs/[id]`** (GET): Single job details

### External Services
- **Flux Ultra API**: `BFL_API_KEY` (optional in dev, required in production)
- **ComfyUI**: Standalone server (URL via env)
- **v0 SDK**: `npm:v0-sdk@0.14.0` for canvas embedding

---

## 3. Changes Since Last Tag (No prior tag; major commits)

1. **Builder V0 Complete** (P0–P6 phases):
   - Chat-driven design system with v0 SDK integration
   - SSE job queue + pagination (50 items/page)
   - Template import system (Context7 registry patterns)
   - Command palette (Cmd+K) with grouped commands
   - ARIA-compliant tablist in Inspector

2. **REVISOR Audit Infrastructure**:
   - Playwright E2E suite (9 specs): sanity, design mode, generation, queue, health
   - Lighthouse CI config (`lighthouserc.json`)
   - Axe-core accessibility runner (`tests/a11y/run-axe.mjs`)
   - Audit scripts: `revisor:build/start/test/lhci/axe/all/report`
   - GitHub Actions workflow (`.github/workflows/revisor.yml`) — Windows runner

3. **Stability Fixes**:
   - `data-testid` attributes added to ChatSidebar, CanvasPreview, Inspector, JobQueue (commit `b7860c6`)
   - `BFL_API_KEY` made optional to prevent blocking (commit `f68cb84`)
   - Test selectors migrated from fragile placeholders to stable `getByTestId`

4. **Documentation**:
   - `PROJECT-MEMORY-V11.md` (30k words, A-Z guide)
   - `REVISOR-REPORT.md` (audit setup + execution plan)
   - `BUILDER-V0-COMPLETE.md` (feature delivery summary)

5. **Gaps/Pending**:
   - LHCI failing with `CHROME_INTERSTITIAL_ERROR` (port 3002 access issue on Windows)
   - SSE lacks `id:`/`retry:` fields and `Last-Event-ID` support (not idempotent)
   - Job creation API lacks `Idempotency-Key` header (duplicate submissions possible)
   - No iframe `waitFor` strategy in tests (intermittent canvas rendering failures)

---

## 4. Risks & Technical Debt (Top 5)

1. **SSE Reliability**: No event IDs, no retry hints, no Last-Event-ID reconnect logic → clients can't resume streams reliably after network glitch.

2. **Idempotency**: Job creation (`/api/flux`, `/api/comfy`) allows duplicate submissions if client retries → wasted resources, user confusion.

3. **LHCI Blocked**: Lighthouse audit fails to connect to `http://127.0.0.1:3002` (Windows loopback quirk?) → can't measure performance/accessibility baselines.

4. **Canvas Timing**: Playwright tests don't wait for iframe content load → `frameLocator()` returns empty → tests flake. Need explicit `frame.getByText(...).waitFor()` pattern.

5. **ENV Key Leakage**: `BFL_API_KEY` optional in dev (good), but no env validation at build time → prod deploys can silently fail if key missing.

---

## 5. Next Actions (Roadmap Snapshot)

- **Phase 1**: Stabilize E2E (iframe wait strategies, retries: 2, traces on failure)
- **Phase 2**: SSE hardening (event IDs, retry headers, Last-Event-ID support)
- **Phase 3**: Idempotency layer (cache job creation responses by hash of payload)
- **Phase 4**: LHCI workaround (test against real domain, not localhost)
- **Phase 5**: CI green runs (all tests pass, artifacts uploaded)
- **Phase 6**: Tag `v0.1.0` and cut changelog

---

## 6. Tech Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥18.0.0 |
| Framework | Next.js | 15.0.3 |
| UI | React | 18.3.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.1 |
| Components | Radix UI | 2.x (primitives) |
| Testing | Playwright | 1.56.1 |
| Perf Audit | Lighthouse CI | 0.15.1 |
| A11y Audit | Axe-core | 4.10.2 |
| Package Manager | pnpm | ≥8.0.0 |

---

For full context, see:
- [`PROJECT-INDEX.md`](../PROJECT-INDEX.md)
- [`PROJECT-MAP.md`](../PROJECT-MAP.md)
- [`BUILDER-V0-COMPLETE.md`](../BUILDER-V0-COMPLETE.md)
- [`REVISOR-REPORT.md`](../REVISOR-REPORT.md)
