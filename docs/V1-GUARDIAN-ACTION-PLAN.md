# ⚡ V1 Guardian — IMMEDIATE ACTION PLAN

**СТАТУС:** 🟢 READY TO START  
**СТАРТ:** Прямо сейчас  
**ЦЕЛЬ:** Запустить Guardian Service за 4 часа

---

## 🎯 Sprint 1 (TODAY): Guardian Minimum Viable Product

### Задача 1.1: Структура проекта (15 мин)
```bash
# Создать директории
mkdir services\guardian
mkdir services\guardian\monitors
mkdir services\guardian\recovery  
mkdir services\guardian\reporting
mkdir services\guardian\utils
mkdir F:\Logs\guardian
```

**Файлы для создания:**
- `services/guardian/package.json`
- `services/guardian/tsconfig.json`
- `services/guardian/index.ts`
- `services/guardian/config.ts`

---

### Задача 1.2: Guardian Core Service (45 мин)

#### `services/guardian/package.json`
```json
{
  "name": "v1-guardian",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "pino": "^10.1.0",
    "pino-pretty": "^13.1.2",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.0"
  }
}
```

#### `services/guardian/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### `services/guardian/config.ts`
```typescript
export const config = {
  // Интервалы мониторинга
  healthCheckInterval: 30_000,      // 30 секунд
  serviceCheckInterval: 60_000,     // 1 минута
  diskCheckInterval: 300_000,       // 5 минут
  
  // Таймауты
  healthCheckTimeout: 10_000,       // 10 секунд
  serviceRestartCooldown: 30_000,   // 30 секунд между рестартами
  
  // Пороги
  maxRestartAttempts: 3,
  diskSpaceWarningGB: 50,
  diskSpaceCriticalGB: 20,
  
  // Endpoints
  healthUrl: 'http://localhost:3000/api/health',
  comfyUrl: 'http://127.0.0.1:8188/system_stats',
  
  // Службы для мониторинга
  services: [
    { name: 'OrchestratorComfyUI', critical: true },
    { name: 'OrchestratorPanel', critical: true }
  ],
  
  // Логи
  logDir: 'F:/Logs/guardian',
  logLevel: 'info' as const,
  
  // Отчёты
  reportDir: 'F:/Logs/reports'
}
```

#### `services/guardian/utils/logger.ts`
```typescript
import pino from 'pino'
import { join } from 'path'
import { config } from '../config.js'

export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino/file',
    options: {
      destination: join(config.logDir, 'guardian.log'),
      mkdir: true
    }
  },
  base: {
    service: 'guardian'
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`
})

// Также логируем в консоль в dev режиме
if (process.env.NODE_ENV === 'development') {
  logger.info('Guardian Logger initialized (dev mode)')
}
```

#### `services/guardian/monitors/health-check.ts`
```typescript
import { logger } from '../utils/logger.js'
import { config } from '../config.js'

export interface HealthStatus {
  ok: boolean
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services?: Record<string, any>
  error?: string
}

export async function checkHealth(): Promise<HealthStatus> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.healthCheckTimeout)
    
    const response = await fetch(config.healthUrl, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return {
        ok: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}`
      }
    }
    
    const data = await response.json()
    const duration = Date.now() - startTime
    
    logger.info({
      msg: 'Health check completed',
      status: data.status || data.overall,
      duration_ms: duration
    })
    
    return {
      ok: data.status === 'healthy' || data.overall === 'healthy',
      status: data.status || data.overall || 'unknown',
      timestamp: new Date().toISOString(),
      services: data.services
    }
  } catch (error: any) {
    logger.error({
      msg: 'Health check failed',
      error: error.message,
      url: config.healthUrl
    })
    
    return {
      ok: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}
```

#### `services/guardian/monitors/service-watch.ts`
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

export interface ServiceStatus {
  name: string
  exists: boolean
  running: boolean
  status: string
  pid?: number
}

export async function checkService(serviceName: string): Promise<ServiceStatus> {
  try {
    const { stdout } = await execAsync(`sc query ${serviceName}`, {
      timeout: 5000,
      windowsHide: true
    })
    
    const running = stdout.includes('RUNNING')
    const stopped = stdout.includes('STOPPED')
    
    // Extract PID if available (Windows doesn't always show it in sc query)
    const pidMatch = stdout.match(/PID\s+:\s+(\d+)/)
    const pid = pidMatch ? parseInt(pidMatch[1]) : undefined
    
    return {
      name: serviceName,
      exists: true,
      running,
      status: running ? 'running' : (stopped ? 'stopped' : 'unknown'),
      pid
    }
  } catch (error: any) {
    // Service doesn't exist or error
    if (error.message.includes('1060')) {
      return {
        name: serviceName,
        exists: false,
        running: false,
        status: 'not-installed'
      }
    }
    
    logger.error({
      msg: 'Failed to check service',
      service: serviceName,
      error: error.message
    })
    
    return {
      name: serviceName,
      exists: false,
      running: false,
      status: 'error'
    }
  }
}
```

#### `services/guardian/recovery/restart-service.ts`
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'
import { config } from '../config.js'

const execAsync = promisify(exec)

// Счётчик попыток перезапуска
const restartAttempts = new Map<string, number>()
const lastRestartTime = new Map<string, number>()

export async function restartService(serviceName: string): Promise<boolean> {
  const now = Date.now()
  const lastRestart = lastRestartTime.get(serviceName) || 0
  const attempts = restartAttempts.get(serviceName) || 0
  
  // Cooldown check
  if (now - lastRestart < config.serviceRestartCooldown) {
    logger.warn({
      msg: 'Restart cooldown active',
      service: serviceName,
      wait_ms: config.serviceRestartCooldown - (now - lastRestart)
    })
    return false
  }
  
  // Max attempts check
  if (attempts >= config.maxRestartAttempts) {
    logger.error({
      msg: 'Max restart attempts reached',
      service: serviceName,
      attempts
    })
    return false
  }
  
  try {
    logger.info({
      msg: 'Attempting service restart',
      service: serviceName,
      attempt: attempts + 1
    })
    
    const { stdout } = await execAsync(`sc start ${serviceName}`, {
      timeout: 30000,
      windowsHide: true
    })
    
    lastRestartTime.set(serviceName, now)
    restartAttempts.set(serviceName, attempts + 1)
    
    const success = stdout.includes('START_PENDING') || stdout.includes('RUNNING')
    
    if (success) {
      logger.info({
        msg: 'Service restart initiated',
        service: serviceName
      })
    }
    
    return success
  } catch (error: any) {
    logger.error({
      msg: 'Service restart failed',
      service: serviceName,
      error: error.message
    })
    
    restartAttempts.set(serviceName, attempts + 1)
    return false
  }
}

export function resetRestartCounter(serviceName: string) {
  restartAttempts.delete(serviceName)
  lastRestartTime.delete(serviceName)
}
```

#### `services/guardian/index.ts`
```typescript
#!/usr/bin/env node

import { logger } from './utils/logger.js'
import { config } from './config.js'
import { checkHealth } from './monitors/health-check.js'
import { checkService } from './monitors/service-watch.js'
import { restartService, resetRestartCounter } from './recovery/restart-service.js'

logger.info('V1 Guardian starting...')
logger.info({ config: { ...config, services: config.services.map(s => s.name) } })

// Health check loop
setInterval(async () => {
  const health = await checkHealth()
  
  if (!health.ok) {
    logger.warn({
      msg: 'System unhealthy',
      status: health.status,
      error: health.error
    })
  }
}, config.healthCheckInterval)

// Service monitoring loop
setInterval(async () => {
  for (const svc of config.services) {
    const status = await checkService(svc.name)
    
    if (status.exists && !status.running && svc.critical) {
      logger.warn({
        msg: 'Critical service down',
        service: svc.name,
        status: status.status
      })
      
      // Attempt restart
      const restarted = await restartService(svc.name)
      
      if (restarted) {
        logger.info({
          msg: 'Service recovery initiated',
          service: svc.name
        })
      }
    } else if (status.running) {
      // Service is healthy, reset restart counter
      resetRestartCounter(svc.name)
    }
    
    logger.debug({
      msg: 'Service check',
      service: svc.name,
      running: status.running,
      pid: status.pid
    })
  }
}, config.serviceCheckInterval)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Guardian shutting down (SIGTERM)')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('Guardian shutting down (SIGINT)')
  process.exit(0)
})

logger.info('V1 Guardian started successfully')
logger.info(`Health checks: every ${config.healthCheckInterval/1000}s`)
logger.info(`Service checks: every ${config.serviceCheckInterval/1000}s`)
```

---

### Задача 1.3: Рефактор /api/health (30 мин)

#### Переименовать `apps/admin/app/api/status/route.ts` → `apps/admin/app/api/health/route.ts`

**Обновить контент:**
```typescript
/**
 * Health Check Endpoint (Kubernetes-style)
 * Used by V1 Guardian for monitoring
 * 
 * @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
 */

import { NextResponse } from 'next/server'
import { runServiceCommand, serviceExists } from '@/lib/service-control'
import { env } from '@/lib/env'
import { execSync } from 'child_process'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const checks = {
    services: {} as Record<string, any>,
    comfy: {} as Record<string, any>,
    system: {} as Record<string, any>
  }
  
  let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  // Check services
  for (const serviceName of ['OrchestratorComfyUI', 'OrchestratorPanel']) {
    const exists = await serviceExists(serviceName)
    if (exists) {
      const result = await runServiceCommand('query', serviceName, 5000)
      checks.services[serviceName] = {
        installed: true,
        status: result.status,
        running: result.status === 'running'
      }
      
      if (result.status !== 'running') {
        overall = 'degraded'
      }
    } else {
      checks.services[serviceName] = {
        installed: false,
        status: 'not-installed',
        running: false
      }
    }
  }
  
  // Check ComfyUI API
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${env.COMFY_URL}/system_stats`, {
      signal: controller.signal
    })
    
    if (response.ok) {
      const data = await response.json()
      checks.comfy = {
        online: true,
        vram: data.system?.vram_total,
        cuda: data.system?.pytorch_version?.includes('cuda'),
        queue: data.queue_remaining || 0
      }
    } else {
      checks.comfy = { online: false }
      overall = 'degraded'
    }
  } catch {
    checks.comfy = { online: false }
    overall = 'degraded'
  }
  
  // Check disk space F:\
  try {
    const output = execSync('wmic logicaldisk where "DeviceID=\'F:\'" get FreeSpace,Size /value', {
      encoding: 'utf-8',
      timeout: 3000,
      windowsHide: true
    })
    
    const freeMatch = output.match(/FreeSpace=(\d+)/)
    const sizeMatch = output.match(/Size=(\d+)/)
    
    if (freeMatch && sizeMatch) {
      const freeGB = Math.floor(parseInt(freeMatch[1]) / 1024 / 1024 / 1024)
      const totalGB = Math.floor(parseInt(sizeMatch[1]) / 1024 / 1024 / 1024)
      
      checks.system.diskF = {
        free: `${freeGB}GB`,
        total: `${totalGB}GB`,
        percent: Math.round((freeGB / totalGB) * 100)
      }
      
      if (freeGB < 20) {
        overall = 'unhealthy'
      } else if (freeGB < 50) {
        overall = 'degraded'
      }
    }
  } catch {
    checks.system.diskF = { error: 'Unable to check' }
  }
  
  // Memory info
  try {
    const output = execSync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value', {
      encoding: 'utf-8',
      timeout: 3000,
      windowsHide: true
    })
    
    const freeMatch = output.match(/FreePhysicalMemory=(\d+)/)
    const totalMatch = output.match(/TotalVisibleMemorySize=(\d+)/)
    
    if (freeMatch && totalMatch) {
      const freeGB = Math.floor(parseInt(freeMatch[1]) / 1024 / 1024)
      const totalGB = Math.floor(parseInt(totalMatch[1]) / 1024 / 1024)
      
      checks.system.memory = {
        free: `${freeGB}GB`,
        total: `${totalGB}GB`,
        percent: Math.round(((totalGB - freeGB) / totalGB) * 100)
      }
    }
  } catch {
    checks.system.memory = { error: 'Unable to check' }
  }
  
  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    ...checks
  })
}
```

**Обновить клиенты:**
- `components/system-status.tsx` → fetch('/api/health')

---

### Задача 1.4: NSSM Guardian Service (20 мин)

#### `scripts/install-guardian-service.ps1`
```powershell
#Requires -RunAsAdministrator

param(
    [string]$GuardianPath = "C:\Work\Orchestrator\services\guardian",
    [string]$ServiceName = "V1Guardian"
)

Write-Host "=== V1 Guardian Service Installer ===" -ForegroundColor Cyan

# Check NSSM
$nssmPath = "C:\ProgramData\chocolatey\bin\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Host "Error: NSSM not found. Install with: choco install nssm" -ForegroundColor Red
    exit 1
}

# Check Guardian exists
if (-not (Test-Path "$GuardianPath\package.json")) {
    Write-Host "Error: Guardian not found at $GuardianPath" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Push-Location $GuardianPath
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: pnpm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Build Guardian
Write-Host "Building Guardian..." -ForegroundColor Yellow
Push-Location $GuardianPath
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Create log directory
$logDir = "F:\Logs\guardian"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    Write-Host "Created log directory: $logDir" -ForegroundColor Green
}

# Install NSSM service
Write-Host "Installing NSSM service: $ServiceName" -ForegroundColor Yellow

# Remove if exists
& $nssmPath stop $ServiceName 2>$null
& $nssmPath remove $ServiceName confirm 2>$null

# Install
& $nssmPath install $ServiceName "node" "$GuardianPath\dist\index.js"
& $nssmPath set $ServiceName AppDirectory $GuardianPath
& $nssmPath set $ServiceName DisplayName "V1 Guardian Service"
& $nssmPath set $ServiceName Description "V1 Orchestrator monitoring and recovery service"

# Logging
& $nssmPath set $ServiceName AppStdout "$logDir\stdout.log"
& $nssmPath set $ServiceName AppStderr "$logDir\stderr.log"
& $nssmm set $ServiceName AppRotateFiles 1
& $nssmm set $ServiceName AppRotateBytes 10485760  # 10MB

# Restart policy
& $nssmm set $ServiceName AppExit Default Restart
& $nssmm set $ServiceName AppRestartDelay 5000  # 5 seconds

# Environment
& $nssmm set $ServiceName AppEnvironmentExtra "NODE_ENV=production"

Write-Host "Service installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Start service: nssm start $ServiceName" -ForegroundColor Cyan
Write-Host "Check status: nssm status $ServiceName" -ForegroundColor Cyan
Write-Host "View logs: type $logDir\stdout.log" -ForegroundColor Cyan
```

---

### Задача 1.5: Тестирование (30 мин)

**Manual Tests:**
```powershell
# 1. Install Guardian
cd C:\Work\Orchestrator
.\scripts\install-guardian-service.ps1

# 2. Start Guardian
nssm start V1Guardian

# 3. Check status
nssm status V1Guardian
# → SERVICE_RUNNING

# 4. Check logs
type F:\Logs\guardian\guardian.log | Select-Object -Last 10
# Должно быть:
# {"level":"info","msg":"V1 Guardian starting..."}
# {"level":"info","msg":"V1 Guardian started successfully"}

# 5. Wait 30 seconds, check health logs
Start-Sleep -Seconds 30
type F:\Logs\guardian\guardian.log | Select-String "Health check"

# 6. Kill ComfyUI (если запущен)
Get-Process | Where-Object {$_.Name -like "*python*"} | Stop-Process -Force

# 7. Wait 60 seconds — Guardian должен обнаружить и перезапустить
Start-Sleep -Seconds 60
type F:\Logs\guardian\guardian.log | Select-String "recovery"

# 8. Check ComfyUI restarted
nssm status OrchestratorComfyUI
# → SERVICE_RUNNING
```

---

## ✅ Definition of Done (Sprint 1)

- [ ] Guardian служба установлена (`V1Guardian`)
- [ ] Guardian запускается без ошибок
- [ ] Health checks каждые 30 секунд
- [ ] Service checks каждые 60 секунд
- [ ] Логи пишутся в `F:\Logs\guardian\guardian.log` (JSON)
- [ ] `/api/health` возвращает полный статус
- [ ] Auto-restart ComfyUI работает
- [ ] Документация обновлена

---

## 🚀 Следующие шаги (Sprint 2)

После завершения Sprint 1:
1. Баг-отчёты (автогенерация MD)
2. Escalation logic (3 фейла → отчёт)
3. Prometheus `/api/metrics`
4. Grafana Dashboard

---

**Время выполнения:** ~4 часа  
**Критичность:** P0  
**Блокеры:** Нет
