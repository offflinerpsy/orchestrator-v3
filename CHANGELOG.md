# Changelog

All notable changes to Orchestrator V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

---

## [Unreleased]

### Added
- **Documentation Trunk**: `PROJECT-INDEX.md`, `PROJECT-MAP.md`, `PROJECT-MEMORY/MEMORY-LATEST.md` for centralized navigation and context
- **SSE Hardening**: Event IDs (`id:` field), retry hints (`retry: 3000`), and `Last-Event-ID` support for reliable reconnection
- **Inspector Visibility**: Gallery always visible in Actions tab (no longer conditional on element selection)
- **ARIA Compliance**: Tablist/tab/tabpanel roles added to Inspector component for accessibility
- **REVISOR Artifacts**: Round 3 test results documented (`docs/_artifacts/revisor-round3/`)

### Changed
- **E2E Selectors**: Updated `generation-comfy.spec.ts` to use `data-testid='actions-tab'` instead of role-based selector
- **PROJECT-STATUS-FULL.md**: Refreshed with current stabilization status (8/9 E2E passing, LHCI blocked)

### Fixed
- **Inspector Gallery**: Now always present in Actions tab (fixes E2E assertion failures)
- **SSE Reconnection**: Clients can now resume streams using `Last-Event-ID` header

### Known Issues
- **LHCI Blocked**: Lighthouse CI fails with `CHROME_INTERSTITIAL_ERROR` on `http://127.0.0.1:3002` (Windows localhost binding issue)
- **Idempotency**: Job creation APIs (`/api/flux`, `/api/comfy`) lack `Idempotency-Key` support (duplicate submissions possible)
- **Canvas Timing**: Playwright tests may flake if iframe content loads slowly (need explicit `frameLocator().getByText().waitFor()`)

---

## [0.0.0] - 2025-10-21 (Initial Commit Range)

### Added
- **Builder V0 Complete** (P0–P6 phases):
  - Resizable layout (react-resizable-panels + react-hotkeys-hook)
  - Design mode with element inspector
  - FLUX Ultra + ComfyUI image generation
  - SSE-based job queue with real-time updates
  - Template import system (shadcn/ui registry)
  - Command palette (cmdk with Cmd+K shortcut)

- **REVISOR Audit Pipeline**:
  - Playwright E2E suite (9 specs covering critical flows)
  - Lighthouse CI config (`lighthouserc.json`)
  - Axe-core accessibility runner (`tests/a11y/run-axe.mjs`)
  - GitHub Actions workflow (`.github/workflows/revisor.yml`)

- **Context7 Integration**: 19 queries for modern patterns (94.7% success rate)

### Changed
- **API Endpoints**: Flux/ComfyUI generation through unified `/api/generate` worker-based system

### Fixed
- **BFL_API_KEY**: Made optional to prevent render blocking in development

---

[Unreleased]: https://github.com/offflinerpsy/orchestrator-v3/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/offflinerpsy/orchestrator-v3/commits/main
