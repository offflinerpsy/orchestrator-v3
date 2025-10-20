# Handoff Checklist — Deep Dive Complete Analysis

## Executive Summary (Exec Board)

**Project Status:** 🔴 **CRITICAL BLOCKERS** — Zero successful SDXL generations
**User Mood:** 🔥 **CRITICAL** — Frustrated with manual prompting, expects autonomous work
**Primary Blocker:** SDXL generation 100% failure rate (model corruption + i2i workflow mismatch)
**Secondary Issue:** Agent workflow broken — user must manually prompt for progress ("я опять пишу в чат что бы вызвать тебя")

**User's Core Demand (from cursor_.md final lines):**
> "ты блять на автомате должен все делать а не ждать чего то от меня"
> "я жду только выполнения всех задач и точка"
> "ты что не понимаешь как работает агент в курсоре? изучи этот момент и сделай так что бы ты сюда писал процесс работы, а не я ждал не понятно чего и тебя дергал постоянно"

---

## Critical Context (Must Read First)

### Verified System State
- **Commit:** 2c098b8 (pushed to GitHub, all Phase 0-I merged)
- **NSSM Services:** OrchestratorPanel, OrchestratorComfyUI, OrchestratorGuardian (all running, auto-start)
- **dropOut Path:** **F:\Drop\out** (NOT C:\Work\Orchestrator\dropOut — critical path confusion)
- **Workflows:** F:\Workflows (sdxl-i2i.json, sd35-i2i.json, svd-i2v.json)
- **Models:** F:\Models (sd_xl_base_1.0.safetensors — **CORRUPTED** per SafetensorError)

### Root Causes Identified
1. **SDXL 100% Failure:**
   - Model: sd_xl_base_1.0.safetensors throws SafetensorError (invalid UTF-8 header)
   - Workflow: sdxl-i2i requires input image; text-only prompts fail
   - No successful end-to-end generation to dropOut

2. **Agent Workflow Broken:**
   - User must manually prompt "ну как там дела" / "проверь статус"
   - Agent doesn't autonomously monitor progress
   - Terminal hangs ("висит на терминале") — blocking commands
   - User frustrated: "я не дождался" / "я нажал кэнсел"

3. **Path Configuration Confusion:**
   - Code referenced C:\Work\Orchestrator\dropOut (doesn't exist)
   - Correct path: F:\Drop\out (from paths.json)

4. **FLUX API Key Issue:**
   - Worker process doesn't inherit BFL_API_KEY from system env
   - Need .env.local loading in worker

---

## Immediate Action Plan (Autonomous Execution)

### Phase 1: Fix SDXL Generation (HIGHEST PRIORITY)
**Goal:** One successful SDXL generation with file in F:\Drop\out within 5 minutes

**Steps:**
1. Check available SDXL checkpoints in ComfyUI /object_info
2. Create sdxl-t2i.json workflow (text-to-image, no LoadImage node)
3. Update worker to use first valid checkpoint from /object_info
4. Create test job: SDXL backend, simple prompt
5. Monitor autonomously (check /api/jobs every 10s)
6. Verify file appears in F:\Drop\out

**Success Criteria:**
- File exists: F:\Drop\out/*.png or *.jpg
- Job status: "done" with result.file path
- No SafetensorError, no timeout

**Fallback:**
- If all SDXL checkpoints fail → use FLUX as proof-of-concept
- Document SDXL as "requires valid checkpoint download"

---

### Phase 2: Implement Autonomous Monitoring
**Goal:** Agent works without user prompts, reports progress proactively

**Implementation:**
1. Create `monitor-loop.mjs` script:
   - Poll /api/jobs every 10s
   - Track state changes (created → running → done/failed)
   - Report status to console and append to docs/MONITOR-LOG.md
   - On error: diagnose and apply fix automatically

2. Workflow pattern:
   ```
   [Agent creates job] 
   → [Start monitor-loop.mjs in background]
   → [Agent continues other work]
   → [monitor-loop reports progress every 30s]
   → [On completion/error: agent receives callback, takes action]
   ```

3. User experience:
   - User sees continuous progress updates in chat
   - No manual "ну как там дела" needed
   - Agent self-reports blockers and fixes

**Success Criteria:**
- User doesn't need to prompt for status
- Progress visible in chat every 30-60s
- Errors auto-diagnosed with fix applied

---

### Phase 3: Fix Path Configuration
**Audit all references to dropOut:**

```bash
# Search for hardcoded paths
rg "C:\\\\Work\\\\Orchestrator\\\\dropOut" --type ts
rg "dropOut.*C:" --type ts
```

**Replace with:**
```typescript
const { dropOut } = getPaths() // Always use paths.json
```

**Files to check:**
- services/worker/src/index.ts
- apps/admin/app/api/generate/route.ts
- apps/admin/lib/flux-client.ts
- Any other generation code

**Success Criteria:**
- Zero hardcoded C:\Work\Orchestrator\dropOut references
- All artifacts go to F:\Drop\out
- paths.json is single source of truth

---

### Phase 4: Worker Service Hardening
**Add comprehensive error handling:**

1. **Env Loading:**
   ```typescript
   // Load .env.local at worker startup
   import dotenv from 'dotenv'
   dotenv.config({ path: join(getPaths().projectRoot, '.env.local') })
   dotenv.config({ path: join(getPaths().projectRoot, 'apps/admin/.env.local') })
   ```

2. **Error Types:**
   - ComfyUI model errors → auto-select alternate checkpoint
   - Network timeouts → retry with exponential backoff
   - Invalid workflow → detailed error with node/input info
   - Missing API keys → clear error message

3. **Logging:**
   - Every step logged to job.logs (visible in /api/jobs)
   - Structured logging with pino (level: debug in dev, info in prod)
   - Error stack traces in logs for debugging

**Success Criteria:**
- FLUX works with auto-loaded BFL_API_KEY
- SDXL auto-selects valid checkpoint on error
- All failures have clear error messages in job.result.error

---

## Verification Commands

### Check System State
```powershell
# Services running
nssm status OrchestratorPanel
nssm status OrchestratorComfyUI

# ComfyUI health
Invoke-WebRequest http://localhost:8188/system_stats

# Available checkpoints
Invoke-RestMethod http://localhost:8188/object_info | ConvertTo-Json -Depth 5 | Select-String "CheckpointLoaderSimple" -Context 20

# Paths config
Get-Content C:\Work\Orchestrator\paths.json | ConvertFrom-Json
```

### Test Generation
```powershell
# Create SDXL job
Invoke-WebRequest http://localhost:3000/api/generate -Method POST `
  -ContentType "application/json" `
  -Body '{"backend":"sdxl","prompt":"test prompt","runNow":false}'

# Monitor jobs
while ($true) {
  Invoke-RestMethod http://localhost:3000/api/jobs | ConvertTo-Json -Depth 3
  Start-Sleep 10
}
```

### Verify Output
```powershell
# Check dropOut directory
Get-ChildItem F:\Drop\out -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

---

## Known Issues & Solutions

### Issue 1: SDXL Model Corruption
**Symptom:** SafetensorError: invalid UTF-8 header
**Root Cause:** sd_xl_base_1.0.safetensors file corrupted/incomplete
**Solution:**
- Auto-select first valid checkpoint from /object_info
- OR create sdxl-t2i.json without LoadImage node
- OR download fresh SDXL checkpoint

### Issue 2: FLUX API Key Not Loaded
**Symptom:** BFL_API_KEY not set in worker process
**Root Cause:** Worker doesn't inherit system env vars
**Solution:**
- Add dotenv loading in services/worker/src/index.ts
- Load from apps/admin/.env.local and root .env.local

### Issue 3: Path Configuration Confusion
**Symptom:** Artifacts not appearing in expected location
**Root Cause:** Hardcoded C:\Work\Orchestrator\dropOut vs F:\Drop\out
**Solution:**
- Audit all code for hardcoded paths
- Use getPaths().dropOut exclusively

### Issue 4: Agent Workflow (Manual Prompting Required)
**Symptom:** User must manually ask "ну как там дела"
**Root Cause:** Agent doesn't autonomously monitor progress
**Solution:**
- Implement monitor-loop.mjs with polling
- Agent reports progress proactively every 30-60s
- Self-diagnose errors and apply fixes

---

## Handoff State

### Completed ✅
- Production audit report (docs/AUDIT-GPT5-HIGH.md)
- NSSM services setup (all running)
- Worker service scaffold (TypeScript)
- FLUX client with retry logic
- ComfyUI sampler validation
- Git commit 2c098b8 pushed

### In Progress ⏳
- SDXL generation debugging (multiple failures)
- Autonomous monitoring implementation
- Path configuration audit

### Blocked ❌
- SDXL end-to-end: Zero successful runs
- Model integrity: sd_xl_base_1.0.safetensors corrupted
- User workflow: Requires manual prompts for status

---

## Next Engineer — Start Here

1. **Read docs/cursor_.md lines 6000-6852** (user frustration escalation)
2. **Verify system state** (NSSM services, paths.json, ComfyUI /object_info)
3. **Fix SDXL generation** (create t2i workflow OR fix model)
4. **Implement autonomous monitoring** (no manual prompts needed)
5. **Test end-to-end** (job created → file in F:\Drop\out within 3 min)

**Success = File in F:\Drop\out + No user prompts needed**

---

## User Requirements (Explicit)

From cursor_.md analysis:

1. **"делай все качественно"** — Quality over speed
2. **"общайся со мной всегда по русски"** — Always Russian communication
3. **"я не понимаю такой работы"** — No manual prompting
4. **"ты сюда писал процесс работы"** — Report progress in chat continuously
5. **"я жду только выполнения всех задач и точка"** — Just deliver results

**Critical:** User expects agent to work autonomously with continuous progress updates, NOT wait for manual prompts.

---

## Token Budget Plan

If this session hits token limits:

1. **All progress documented** in:
   - docs/HANDOFF-CHECKLIST.md (this file)
   - docs/AUDIT-GPT5-HIGH.md (comprehensive audit)
   - docs/MONITOR-LOG.md (runtime progress)

2. **Next session starts with:**
   - Read HANDOFF-CHECKLIST.md (current state)
   - Check latest job: GET /api/jobs (sort by createdAt)
   - Resume from Phase N (1-4 above)

3. **Verification:**
   - Does file exist in F:\Drop\out? → Success
   - Are jobs stuck in "running"? → Resume monitoring
   - New errors? → Diagnose and fix

---

**Last Updated:** Session start (post cursor_.md analysis)
**Status:** Ready to execute autonomous plan
**Next Action:** Phase 1 — Fix SDXL generation
