<#
.SYNOPSIS
    Установка Windows-служб для Orchestrator через NSSM

.DESCRIPTION
    Создаёт три службы:
    1. OrchestratorComfyUI — F:\ComfyUI\run_nvidia_gpu.bat
    2. OrchestratorPanel — pnpm --filter admin start
    3. OrchestratorWorker — node worker/index.js (если реализован)

.NOTES
    Требования:
    - NSSM установлен (https://nssm.cc/download)
    - PowerShell 5.1+
    - Права администратора

.EXAMPLE
    .\install-services.ps1
#>

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Пути
$NSSM = "C:\ProgramData\chocolatey\bin\nssm.exe" # Или другой путь
$COMFYUI_BAT = "F:\ComfyUI\run_nvidia_gpu.bat"
$ORCHESTRATOR_ROOT = "C:\Work\Orchestrator"
$ADMIN_ROOT = Join-Path $ORCHESTRATOR_ROOT "apps\admin"
$LOGS_DIR = Join-Path $ORCHESTRATOR_ROOT "logs"

# Проверка NSSM
if (-not (Test-Path $NSSM)) {
    Write-Error "NSSM не найден: $NSSM`nУстановите через: choco install nssm"
    exit 1
}

# Создание директории логов
if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR -Force | Out-Null
}

Write-Host "=== Установка служб Orchestrator ===" -ForegroundColor Cyan

# ========================================
# 1. OrchestratorComfyUI
# ========================================
Write-Host "`n[1/3] OrchestratorComfyUI..." -ForegroundColor Yellow

if (-not (Test-Path $COMFYUI_BAT)) {
    Write-Warning "Не найден: $COMFYUI_BAT — пропускаем ComfyUI службу"
} else {
    $ServiceName = "OrchestratorComfyUI"
    
    # Удаляем если существует
    & $NSSM stop $ServiceName 2>$null
    & $NSSM remove $ServiceName confirm 2>$null
    
    # Устанавливаем
    & $NSSM install $ServiceName $COMFYUI_BAT
    & $NSSM set $ServiceName AppDirectory "F:\ComfyUI"
    & $NSSM set $ServiceName AppStdout "$LOGS_DIR\comfyui-service.log"
    & $NSSM set $ServiceName AppStderr "$LOGS_DIR\comfyui-service-error.log"
    & $NSSM set $ServiceName AppRotateFiles 1
    & $NSSM set $ServiceName AppRotateBytes 10485760 # 10MB
    & $NSSM set $ServiceName DisplayName "Orchestrator ComfyUI"
    & $NSSM set $ServiceName Description "ComfyUI сервер для локальной генерации (SDXL, SD3.5, SVD)"
    & $NSSM set $ServiceName Start SERVICE_AUTO_START
    
    Write-Host "  ✓ Служба $ServiceName установлена" -ForegroundColor Green
}

# ========================================
# 2. OrchestratorPanel
# ========================================
Write-Host "`n[2/3] OrchestratorPanel..." -ForegroundColor Yellow

$ServiceName = "OrchestratorPanel"
$PNPM = "C:\Program Files\nodejs\pnpm.cmd" # Или где установлен pnpm

if (-not (Test-Path $PNPM)) {
    Write-Warning "pnpm не найден: $PNPM — используем npx pnpm"
    $PNPM = "npx"
    $PnpmArgs = "pnpm --filter admin start"
} else {
    $PnpmArgs = "--filter admin start"
}

# Удаляем если существует
& $NSSM stop $ServiceName 2>$null
& $NSSM remove $ServiceName confirm 2>$null

# Устанавливаем
& $NSSM install $ServiceName $PNPM $PnpmArgs
& $NSSM set $ServiceName AppDirectory $ORCHESTRATOR_ROOT
& $NSSM set $ServiceName AppEnvironmentExtra "NODE_ENV=production"
& $NSSM set $ServiceName AppStdout "$LOGS_DIR\panel-service.log"
& $NSSM set $ServiceName AppStderr "$LOGS_DIR\panel-service-error.log"
& $NSSM set $ServiceName AppRotateFiles 1
& $NSSM set $ServiceName AppRotateBytes 10485760
& $NSSM set $ServiceName DisplayName "Orchestrator Admin Panel"
& $NSSM set $ServiceName Description "Next.js админ-панель Orchestrator (порт 3000)"
& $NSSM set $ServiceName Start SERVICE_AUTO_START

Write-Host "  ✓ Служба $ServiceName установлена" -ForegroundColor Green

# ========================================
# 3. OrchestratorWorker (опционально)
# ========================================
Write-Host "`n[3/3] OrchestratorWorker..." -ForegroundColor Yellow

$WORKER_SCRIPT = Join-Path $ORCHESTRATOR_ROOT "worker\index.js"

if (-not (Test-Path $WORKER_SCRIPT)) {
    Write-Warning "Worker скрипт не найден: $WORKER_SCRIPT — пропускаем"
} else {
    $ServiceName = "OrchestratorWorker"
    $NODE = "C:\Program Files\nodejs\node.exe"
    
    # Удаляем если существует
    & $NSSM stop $ServiceName 2>$null
    & $NSSM remove $ServiceName confirm 2>$null
    
    # Устанавливаем
    & $NSSM install $ServiceName $NODE $WORKER_SCRIPT
    & $NSSM set $ServiceName AppDirectory $ORCHESTRATOR_ROOT
    & $NSSM set $ServiceName AppStdout "$LOGS_DIR\worker-service.log"
    & $NSSM set $ServiceName AppStderr "$LOGS_DIR\worker-service-error.log"
    & $NSSM set $ServiceName AppRotateFiles 1
    & $NSSM set $ServiceName DisplayName "Orchestrator Worker"
    & $NSSM set $ServiceName Description "Фоновый обработчик очереди задач"
    & $NSSM set $ServiceName Start SERVICE_AUTO_START
    
    Write-Host "  ✓ Служба $ServiceName установлена" -ForegroundColor Green
}

# ========================================
# Итог
# ========================================
Write-Host "`n=== Установка завершена ===" -ForegroundColor Cyan
Write-Host "Запуск служб: sc start OrchestratorComfyUI && sc start OrchestratorPanel" -ForegroundColor White
Write-Host "Статус: Get-Service Orchestrator*" -ForegroundColor White
Write-Host "Логи: $LOGS_DIR" -ForegroundColor White
