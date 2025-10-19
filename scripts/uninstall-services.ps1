<#
.SYNOPSIS
    Удаление Windows-служб Orchestrator

.DESCRIPTION
    Останавливает и удаляет все службы Orchestrator:
    - OrchestratorComfyUI
    - OrchestratorPanel
    - OrchestratorWorker

.NOTES
    Требует прав администратора

.EXAMPLE
    .\uninstall-services.ps1
#>

#Requires -RunAsAdministrator

$ErrorActionPreference = "Continue"

$NSSM = "C:\ProgramData\chocolatey\bin\nssm.exe"

if (-not (Test-Path $NSSM)) {
    Write-Error "NSSM не найден: $NSSM"
    exit 1
}

Write-Host "=== Удаление служб Orchestrator ===" -ForegroundColor Cyan

$Services = @(
    "OrchestratorComfyUI",
    "OrchestratorPanel",
    "OrchestratorWorker"
)

foreach ($ServiceName in $Services) {
    Write-Host "`nУдаление: $ServiceName..." -ForegroundColor Yellow
    
    # Останавливаем
    & $NSSM stop $ServiceName 2>$null
    
    # Удаляем
    & $NSSM remove $ServiceName confirm
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $ServiceName удалена" -ForegroundColor Green
    } else {
        Write-Warning "  ⚠ $ServiceName не найдена или ошибка удаления"
    }
}

Write-Host "`n=== Удаление завершено ===" -ForegroundColor Cyan
Write-Host "Проверка: Get-Service Orchestrator*" -ForegroundColor White
