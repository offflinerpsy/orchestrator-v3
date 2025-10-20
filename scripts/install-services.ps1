#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$NSSM = "C:\ProgramData\chocolatey\bin\nssm.exe"
$COMFYUI_BAT = "F:\ComfyUI\run_nvidia_gpu.bat"
$ORCHESTRATOR_ROOT = "C:\Work\Orchestrator"
$ADMIN_ROOT = Join-Path $ORCHESTRATOR_ROOT "apps\admin"
$GUARDIAN_ROOT = Join-Path $ORCHESTRATOR_ROOT "services\guardian"
$LOGS_DIR = "F:\Logs"

if (-not (Test-Path $NSSM)) {
    Write-Error "NSSM not found: $NSSM - Install via: choco install nssm"
    exit 1
}

if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR -Force | Out-Null
}

Write-Host "=== Installing Orchestrator Services ===" -ForegroundColor Cyan

# 1. OrchestratorComfyUI
Write-Host "`n[1/3] OrchestratorComfyUI..." -ForegroundColor Yellow

if (-not (Test-Path $COMFYUI_BAT)) {
    Write-Warning "Not found: $COMFYUI_BAT - skipping"
} else {
    $ServiceName = "OrchestratorComfyUI"
    & $NSSM stop $ServiceName 2>&1 | Out-Null
    & $NSSM remove $ServiceName confirm 2>&1 | Out-Null
    & $NSSM install $ServiceName $COMFYUI_BAT
    & $NSSM set $ServiceName AppDirectory "F:\ComfyUI"
    & $NSSM set $ServiceName AppStdout "$LOGS_DIR\comfyui-stdout.log"
    & $NSSM set $ServiceName AppStderr "$LOGS_DIR\comfyui-stderr.log"
    & $NSSM set $ServiceName AppRotateFiles 1
    & $NSSM set $ServiceName AppRotateBytes 10485760
    & $NSSM set $ServiceName DisplayName "Orchestrator ComfyUI"
    & $NSSM set $ServiceName Description "ComfyUI server for local generation"
    & $NSSM set $ServiceName Start SERVICE_AUTO_START
    Write-Host "  OK $ServiceName" -ForegroundColor Green
}

# 2. OrchestratorPanel
Write-Host "`n[2/3] OrchestratorPanel..." -ForegroundColor Yellow

$ServiceName = "OrchestratorPanel"
$NODE = "C:\Program Files\nodejs\node.exe"
$NEXT_BIN = Join-Path $ADMIN_ROOT "node_modules\next\dist\bin\next"

if (-not (Test-Path $NODE)) { Write-Error "Node.js not found: $NODE"; exit 1 }
if (-not (Test-Path $NEXT_BIN)) { Write-Error "Next.js not found: $NEXT_BIN"; exit 1 }

& $NSSM stop $ServiceName 2>&1 | Out-Null
& $NSSM remove $ServiceName confirm 2>&1 | Out-Null
& $NSSM install $ServiceName $NODE $NEXT_BIN "start"
& $NSSM set $ServiceName AppDirectory $ADMIN_ROOT
& $NSSM set $ServiceName AppEnvironmentExtra "NODE_ENV=production" "HOSTNAME=localhost" "PORT=3000"
& $NSSM set $ServiceName AppStdout "$LOGS_DIR\panel-stdout.log"
& $NSSM set $ServiceName AppStderr "$LOGS_DIR\panel-stderr.log"
& $NSSM set $ServiceName AppRotateFiles 1
& $NSSM set $ServiceName AppRotateBytes 10485760
& $NSSM set $ServiceName DisplayName "Orchestrator Admin Panel"
& $NSSM set $ServiceName Description "Next.js admin panel on port 3000"
& $NSSM set $ServiceName Start SERVICE_AUTO_START
Write-Host "  OK $ServiceName" -ForegroundColor Green

# 3. OrchestratorGuardian
Write-Host "`n[3/3] OrchestratorGuardian..." -ForegroundColor Yellow

$GUARDIAN_SCRIPT = Join-Path $GUARDIAN_ROOT "dist\index.js"

if (-not (Test-Path $GUARDIAN_SCRIPT)) {
    Write-Warning "Guardian not found: $GUARDIAN_SCRIPT - skipping"
} else {
    $ServiceName = "OrchestratorGuardian"
    & $NSSM stop $ServiceName 2>&1 | Out-Null
    & $NSSM remove $ServiceName confirm 2>&1 | Out-Null
    & $NSSM install $ServiceName $NODE $GUARDIAN_SCRIPT
    & $NSSM set $ServiceName AppDirectory $GUARDIAN_ROOT
    & $NSSM set $ServiceName AppEnvironmentExtra "NODE_ENV=production" "HOSTNAME=localhost" "PORT=3000"
    & $NSSM set $ServiceName AppStdout "$LOGS_DIR\guardian-stdout.log"
    & $NSSM set $ServiceName AppStderr "$LOGS_DIR\guardian-stderr.log"
    & $NSSM set $ServiceName AppRotateFiles 1
    & $NSSM set $ServiceName AppRotateBytes 10485760
    & $NSSM set $ServiceName DisplayName "Orchestrator Guardian"
    & $NSSM set $ServiceName Description "Service monitoring daemon"
    & $NSSM set $ServiceName Start SERVICE_AUTO_START
    Write-Host "  OK $ServiceName" -ForegroundColor Green
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "Starting services..." -ForegroundColor Yellow

Get-Service -Name "Orchestrator*" -ErrorAction SilentlyContinue | Start-Service
Start-Sleep -Seconds 3
Get-Service -Name "Orchestrator*" -ErrorAction SilentlyContinue | Format-Table -AutoSize

Write-Host "`nDone! Logs: $LOGS_DIR" -ForegroundColor Green

