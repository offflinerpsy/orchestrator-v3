# Environment & Setup Report — Orchestrator V3

**Generated:** 2025-10-20  
**Purpose:** Complete system snapshot for AdminPanel crash audit  
**Context:** V1 Guardian Sprint 1 implementation (commit 941cf17)  
**Status:** AdminPanel crashes on startup (exit code 1)

---

## System Information

### Hardware
- **Computer:** DESKTOP-P0V2V04
- **User:** Alex
- **CPU:** Intel(R) Core(TM) i7-10700K @ 3.80GHz
- **Cores/Threads:** 8 cores, 16 logical processors
- **RAM:** 64 GB
- **Architecture:** 64-bit

### Operating System
- **OS:** Microsoft Windows 11 Pro
- **Version:** 10.0.26200
- **Build:** 26200
- **Architecture:** 64-bit

---

## Software Stack

### Runtime Environments
```yaml
Node.js: v22.20.0
pnpm: 10.18.3
Git: 2.51.0.windows.2
PowerShell: 7.5.3
```

### Next.js Environment (AdminPanel)
```yaml
Framework: Next.js 15.0.3
React: 18.3.1
TypeScript: ^5
Build Tool: pnpm (workspace monorepo)
Node Runtime: v22.20.0
```

---

## Project Structure

### Monorepo Layout
```
C:\Work\Orchestrator/
├── apps/
│   ├── admin/          # AdminPanel (Next.js 15.0.3) — CRASHES
│   └── site/           # Public site (Next.js)
├── services/
│   └── guardian/       # V1 Guardian (Node.js) — WORKING
├── packages/
│   └── connectors/     # Shared connectors (ComfyUI, FLUX)
├── scripts/            # PowerShell automation
└── docs/
    └── _artifacts/     # Documentation & reports
```

### AdminPanel Dependencies
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@types/better-sqlite3": "^7.6.13",
    "better-sqlite3": "^12.4.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "next": "15.0.3",
    "node-html-parser": "^7.0.1",
    "pino": "^10.1.0",
    "pino-pretty": "^13.1.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.65.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "v0-sdk": "^0.14.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "15.0.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

### Guardian Dependencies (V1)
```json
{
  "dependencies": {
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

---

## Git Repository State

### Branch Information
```yaml
Branch: feat/tilda-import
Remote: https://github.com/offflinerpsy/orchestrator-v3.git
Current Commit: 941cf17f87ccb340062c2c48db3bd594aeba484e
Commit (short): 941cf17
```

### Recent Commits (Last 10)
```
941cf17 feat(guardian): implement V1 Guardian Sprint 1 - autonomous monitoring service
e89caf1 docs: add V1 Guardian master plan and action plan
9b2f1c8 fix(runtime): prevent Next.js crash on startup
8a2fb2b docs: add Sprint 1 final report
b5efb23 refactor(ignite): use service-control utilities
7669e5a feat(diagnostics): enhance diagnostics page with system status
0d62dbc feat(proxy): add ComfyUI catch-all proxy
e2942fb refactor(comfyui): remove direct spawn endpoint
575abdd feat(flux): add dry-run mode with ALLOW_GENERATION flag
58ca305 feat(error-handling): add error boundaries
```

### Working Directory Status
```
Modified:
  - apps/admin/next.config.js (added logging config for debugging)

Deleted:
  - apps/admin/app/api/health/route.ts (deleted during crash investigation)

Untracked:
  - docs/_artifacts/guardian-sprint1/ADMINPANEL-CRASH-AUDIT.md
  - docs/_artifacts/guardian-sprint1/*.txt (system snapshots)
```

---

## Environment Variables

### AdminPanel (.env.local)
```bash
# API Keys (redacted for security)
HF_TOKEN=***REDACTED***
BFL_API_KEY=***REDACTED***
V0_API_KEY=***REDACTED***

# Service URLs
COMFYUI_URL=http://127.0.0.1:8188  # OLD variable (deprecated)
COMFY_URL=http://127.0.0.1:8188    # NEW variable

# Paths
DATA_DIR=C:\Work\Orchestrator\data

# Runtime (auto-detected by Next.js)
NODE_ENV=production (for next start)
NODE_ENV=development (for next dev)
LOG_LEVEL=info (default from lib/env.ts)
ALLOW_GENERATION=false (default from lib/env.ts)
```

**Note:** Duplicate `COMFYUI_URL` and `COMFY_URL` detected. Both point to same value. Legacy `COMFYUI_URL` should be removed.

---

## Running Services

### Windows Services
```yaml
Status: No Orchestrator services installed
NSSM: Not installed (needed for Guardian service installation)
```

**Planned Services:**
- `OrchestratorGuardian` — V1 Guardian monitoring service (not yet installed)
- `OrchestratorComfyUI` — ComfyUI backend (not yet configured)
- `OrchestratorAdminPanel` — AdminPanel (not yet configured)

### Active Processes
```yaml
Node.js Processes: 0 (no node processes running at snapshot time)
Guardian: Not running (needs manual start or NSSM service)
AdminPanel: Not running (crashes on startup)
ComfyUI: Running on port 8188 (PID 8812)
```

### Listening Ports
```yaml
Port 3000: ❌ NOT listening (AdminPanel target port - never binds)
Port 3001: ❌ NOT listening
Port 8188: ✅ LISTENING (ComfyUI - working)
```

---

## Build & Deployment Status

### AdminPanel Build Status
```yaml
Build Command: pnpm build
Build Status: ✅ SUCCESS (0 errors)
Build Output: .next/ directory created
Routes Compiled: 29 routes (static + dynamic)
Bundle Size: 99.9 kB shared JS
TypeScript: Valid (no type errors)
ESLint: Valid (no lint errors)
```

### AdminPanel Runtime Status
```yaml
Start Command: pnpm start (production) / pnpm dev (development)
Runtime Status: ❌ CRASHES immediately
Exit Code: 1
Error Output: None (silent failure)
Port Binding: Never occurs
HTTP Server: Never starts

Crash Pattern:
  1. "✓ Starting..."
  2. "✓ Ready in XXXms"
  3. [IMMEDIATE EXIT - NO ERROR MESSAGE]
  4. Exit code 1
```

### Guardian Build & Runtime Status
```yaml
Build Command: pnpm build (TSC compilation)
Build Status: ✅ SUCCESS
Output: dist/index.js + modules

Start Command: node dist/index.js
Runtime Status: ✅ WORKING (tested with PID 15888)
Monitoring: Active (health checks every 30s, service checks every 60s)
Logging: JSON format via Pino
```

---

## Network Configuration

### Firewall & Antivirus
```yaml
Windows Defender: Enabled (assumed - not checked)
Third-party AV: Unknown
Firewall: Windows Firewall (assumed enabled)
Port 3000 Blocked: Unknown (needs verification)
```

### Proxy Configuration
```yaml
HTTP_PROXY: Not set
HTTPS_PROXY: Not set
NO_PROXY: Not set
System Proxy: Not configured
```

---

## File System Paths

### Project Paths
```yaml
Project Root: C:\Work\Orchestrator
AdminPanel: C:\Work\Orchestrator\apps\admin
Guardian: C:\Work\Orchestrator\services\guardian
Data Directory: C:\Work\Orchestrator\data
Logs: C:\Work\Orchestrator\logs
```

### AdminPanel Build Artifacts
```yaml
Build Output: C:\Work\Orchestrator\apps\admin\.next
Server JS: .next/server.js (Next.js 15 server entry)
Standalone: .next/standalone/ (NOT BUILT - requires output:'standalone' in config)
Static Assets: .next/static/
Cache: .next/cache/
```

### Node Modules
```yaml
AdminPanel: C:\Work\Orchestrator\apps\admin\node_modules
Guardian: C:\Work\Orchestrator\services\guardian\node_modules
Root: C:\Work\Orchestrator\node_modules (pnpm workspace shared)
```

---

## Known Issues & Anomalies

### Critical Issues (P0)
1. **AdminPanel Crash on Startup**
   - **Symptom:** Exits with code 1 after "✓ Ready"
   - **Affects:** Both `next dev` and `next start`
   - **Impact:** Blocks Guardian integration testing
   - **Root Cause:** Unknown (under investigation)
   - **See:** `ADMINPANEL-CRASH-AUDIT.md` for full investigation report

### Configuration Issues (P2)
2. **Duplicate Environment Variables**
   - **Issue:** `.env.local` has both `COMFYUI_URL` and `COMFY_URL`
   - **Impact:** None (both have same value)
   - **Fix:** Remove deprecated `COMFYUI_URL`

3. **NSSM Not Installed**
   - **Issue:** NSSM (Non-Sucking Service Manager) not in PATH
   - **Impact:** Cannot install Guardian as Windows service
   - **Fix:** Download NSSM, add to PATH, run `install-guardian-service.ps1`

### Code Quality Issues (P3)
4. **Module-Level Side Effects (Suspected)**
   - **Files:** `lib/env.ts`, `lib/logger.ts`
   - **Issue:** `parseEnv()` and `pino()` run at module import time
   - **Impact:** May cause silent crashes if validation fails
   - **Status:** Fixed in 9b2f1c8 but regression suspected

5. **PowerShell Commands in /api/health (Deleted)**
   - **Issue:** `Get-Volume`, `Get-CimInstance` subprocess calls
   - **Impact:** Suspected to cause crash (but deletion didn't fix)
   - **Status:** Endpoint deleted during investigation

---

## Testing Evidence

### Build Test (AdminPanel)
```powershell
PS> cd C:\Work\Orchestrator\apps\admin
PS> pnpm build

Result: ✅ SUCCESS
Output:
   ▲ Next.js 15.0.3
   - Environments: .env.local
   Creating an optimized production build ...
✓ Compiled successfully
   Linting and checking validity of types ...
✓ Collecting page data
✓ Generating static pages (8/8)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    12.6 kB         131 kB
├ ○ /_not-found                          898 B           101 kB
...
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Start Test (AdminPanel Production)
```powershell
PS> pnpm start

Result: ❌ CRASH
Output:
   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
 ✓ Starting...
 ✓ Ready in 1177ms

[EXIT CODE 1]
```

### Start Test (AdminPanel Development)
```powershell
PS> pnpm dev

Result: ❌ CRASH (same as production)
Output:
   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
   - Environments: .env.local
 ✓ Starting...
 ✓ Ready in 7.8s

[EXIT CODE 1]
```

### Port Test
```powershell
PS> Start-Sleep 3; Get-NetTCPConnection -LocalPort 3000

Result: ❌ NO CONNECTIONS (port never binds)
```

### HTTP Test
```powershell
PS> Start-Sleep 3; Invoke-WebRequest http://localhost:3000/

Result: ❌ TIMEOUT
Error: The request was canceled due to the configured HttpClient.Timeout
```

### Guardian Test
```powershell
PS> cd C:\Work\Orchestrator\services\guardian
PS> pnpm build
PS> node dist/index.js

Result: ✅ SUCCESS
Output (JSON logs):
{"level":"info","msg":"🚀 V1 Guardian starting..."}
{"level":"info","msg":"✅ V1 Guardian started successfully"}
{"level":"info","msg":"📡 Health monitoring: http://localhost:3000/api/health (interval: 30s)"}
{"level":"info","msg":"🔍 Service monitoring: OrchestratorComfyUI, OrchestratorAdminPanel (interval: 60s)"}
{"level":"warn","msg":"⚠️ AdminPanel health check failed","error":"fetch failed"}
```

---

## Debugging Attempts Summary

### Attempted Solutions (13 total, 0 successful)
1. ❌ Replace PowerShell with Node.js `os` module
2. ❌ Remove logger imports from `/api/health`
3. ❌ Simplify `/api/health` to stub response
4. ❌ Comment out `import { env }` from `/api/health`
5. ❌ Delete `/api/health` entirely
6. ❌ Kill all node processes (check for zombies)
7. ❌ Enable `--trace-warnings` flag
8. ❌ Enable `--trace-uncaught` flag
9. ✅ Verify `.env.local` validity (vars are valid)
10. ❌ Add `next.config.js` logging
11. ❌ Try dev mode instead of production (also crashes)
12. ❌ Git checkout to pre-Guardian commit (still crashes)
13. ❌ Check module import dependencies (suspicious but not proven)

### Debug Flags Tested
```powershell
# Trace warnings
$env:NODE_OPTIONS="--trace-warnings"
Result: No additional output

# Trace uncaught exceptions
$env:NODE_OPTIONS="--trace-uncaught"
Result: No additional output

# Debug mode
$env:DEBUG="*"
Result: No additional output

# All combined
$env:NODE_OPTIONS="--trace-warnings --trace-uncaught"
$env:DEBUG="*"
Result: Still crashes silently
```

---

## Recommendations for Next Investigation

### Immediate Actions (Priority 1)
1. **Clean Install Test** (30 min)
   ```powershell
   cd C:\Work\Orchestrator\apps\admin
   Remove-Item -Recurse -Force .next, node_modules
   pnpm install
   pnpm build
   pnpm start
   ```
   
2. **Verbose Logging in lib/env.ts** (15 min)
   Add console.log to `parseEnv()` to see if validation runs

3. **Node.js Debugger** (30 min)
   ```powershell
   node --inspect node_modules/.bin/next start
   # Chrome DevTools: chrome://inspect
   # Breakpoint in lib/env.ts parseEnv()
   ```

### Medium Priority Actions
4. **Minimal Next.js Test** (20 min)
   Create fresh Next.js 15.0.3 app, test if framework works

5. **Standalone Build Test** (15 min)
   Add `output: 'standalone'` to `next.config.js`, test `.next/standalone/server.js`

6. **Downgrade Next.js** (20 min)
   Try Next.js 14.2.x to check if 15.0.3 has regression

### Low Priority Actions
7. **Git Bisect** (60 min)
   Find exact commit that broke AdminPanel

8. **Windows Event Viewer** (10 min)
   Check for Node.js crash logs

9. **Disable Antivirus** (5 min)
   Test if AV blocks port binding

---

## Files Generated in This Report

```
docs/_artifacts/guardian-sprint1/
├── ADMINPANEL-CRASH-AUDIT.md        # Full investigation report (600+ lines)
├── ENVIRONMENT-REPORT.md            # This file (system snapshot)
├── system-info.txt                  # OS, CPU, RAM details
├── software-versions.txt            # Node, pnpm, Git versions
├── adminpanel-deps.txt              # AdminPanel package.json deps
├── guardian-deps.txt                # Guardian package.json deps
├── git-status.txt                   # Git branch, commits, status
├── windows-services.txt             # Windows services check
├── running-processes.txt            # Node processes, listening ports
├── project-structure.txt            # Monorepo structure
└── environment-vars.txt             # .env.local (secrets redacted)
```

---

## Contact & Next Steps

### For Auditor/Debugger
- **Primary Report:** `ADMINPANEL-CRASH-AUDIT.md` (detailed investigation timeline)
- **System Snapshot:** This file (`ENVIRONMENT-REPORT.md`)
- **Raw Data:** `*.txt` files in same directory

### Questions to Answer
1. Why does Next.js 15.0.3 crash silently with exit code 1?
2. Why does rollback to 9b2f1c8 (pre-Guardian) still crash?
3. Is this a framework bug, code bug, or system issue?
4. Why do `--trace-warnings` and `--trace-uncaught` show nothing?

### Success Criteria
- [ ] AdminPanel starts successfully (port 3000 binds)
- [ ] Guardian can monitor AdminPanel `/api/health`
- [ ] Integration test passes
- [ ] Root cause documented

---

**Report Status:** Complete  
**Generated By:** GitHub Copilot (AI Agent)  
**Timestamp:** 2025-10-20  
**Next Action:** Commit all reports to Git for team review
