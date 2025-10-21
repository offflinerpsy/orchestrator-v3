# Orchestrator V3 — Project Index

**AI Generation Orchestrator**: Unified dashboard for Flux Ultra + ComfyUI workflows (SDXL/SD3.5/SVD).

---

## Quick Navigation

- **[Project Map](./PROJECT-MAP.md)** — Repository structure and artifact locations
- **[Status (Full)](./PROJECT-STATUS-FULL.md)** — Aggregated system health + test reports
- **[Memory (Latest)](./PROJECT-MEMORY/MEMORY-LATEST.md)** — Current architecture snapshot + recent changes
- **[Architecture Decisions](./adr/)** — Design records (MADR format)
- **[Changelog](../CHANGELOG.md)** — Version history (Keep a Changelog)

---

## Current Branch: `main`

**Last Tag:** None (unreleased)  
**Phase:** Post-Builder V0 completion → stabilization + CI/CD

---

## Key Artifacts

### Documentation
- [`docs/REVISOR-REPORT.md`](./REVISOR-REPORT.md) — Audit pipeline (Playwright + Lighthouse + Axe)
- [`docs/BUILDER-V0-COMPLETE.md`](./BUILDER-V0-COMPLETE.md) — Builder feature delivery summary
- [`docs/_context/`](./_context/) — AI agent operational context

### Testing
- [`apps/admin/tests/e2e/`](../apps/admin/tests/e2e/) — Playwright E2E specs
- [`apps/admin/playwright.audit.config.ts`](../apps/admin/playwright.audit.config.ts) — Audit-specific config
- [`apps/admin/reports/`](../apps/admin/reports/) — Test artifacts (HTML/JSON/videos)

### CI/CD
- [`.github/workflows/revisor.yml`](../.github/workflows/revisor.yml) — GitHub Actions audit pipeline

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server (admin panel)
cd apps/admin
pnpm dev                 # → http://localhost:3000

# Run E2E tests
pnpm test:smoke          # Quick smoke tests
pnpm revisor:all         # Full audit (E2E + Lighthouse + Axe)
```

---

## Support & Context

- **Stack:** Next.js 15 + React 18 + TypeScript + Tailwind + Radix UI
- **Managers:** pnpm (workspace root) + turbo (optional)
- **Conventions:** Conventional Commits + EditorConfig + ESLint

For detailed memory/history, see [`PROJECT-MEMORY/MEMORY-LATEST.md`](./PROJECT-MEMORY/MEMORY-LATEST.md).
