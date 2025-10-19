# Установка ComfyUI как службы Windows через NSSM
# Требует Administrator privileges

param(
    [string]$ComfyPath = "F:\ComfyUI",
    [string]$ServiceName = "OrchestratorComfyUI"
)

# Проверка прав администратора
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Скрипт требует прав администратора. Запустите PowerShell как Administrator."
    exit 1
}

# Проверка NSSM
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmPath) {
    Write-Error "NSSM не найден. Установите через: choco install nssm"
    Write-Host "Или скачайте вручную с https://nssm.cc/download"
    exit 1
}

Write-Host "✓ NSSM найден: $($nssmPath.Source)" -ForegroundColor Green

# Проверка ComfyUI
$batPath = Join-Path $ComfyPath "run_nvidia_gpu.bat"
if (-not (Test-Path $batPath)) {
    Write-Error "Не найден $batPath"
    Write-Host "Укажите корректный путь через параметр -ComfyPath"
    exit 1
}

Write-Host "✓ ComfyUI найден: $batPath" -ForegroundColor Green

# Создание папки для логов
$logsDir = Join-Path $ComfyPath "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    Write-Host "✓ Создана папка логов: $logsDir" -ForegroundColor Green
}

# Проверка существующей службы
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠ Служба $ServiceName уже существует" -ForegroundColor Yellow
    $confirm = Read-Host "Переустановить службу? (y/N)"
    if ($confirm -ne 'y') {
        Write-Host "Отменено пользователем"
        exit 0
    }
    
    # Остановка и удаление старой службы
    Write-Host "Остановка службы..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    
    Write-Host "Удаление старой службы..."
    & nssm remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# Установка службы
Write-Host "`nУстановка службы $ServiceName..." -ForegroundColor Cyan

& nssm install $ServiceName $batPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "Ошибка установки службы (код: $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host "✓ Служба установлена" -ForegroundColor Green

# Настройка параметров
Write-Host "Настройка параметров..." -ForegroundColor Cyan

& nssm set $ServiceName AppDirectory $ComfyPath
& nssm set $ServiceName AppStdout (Join-Path $logsDir "stdout.log")
& nssm set $ServiceName AppStderr (Join-Path $logsDir "stderr.log")
& nssm set $ServiceName AppRotateFiles 1
& nssm set $ServiceName AppRotateBytes 10485760  # 10MB

# Display name и описание
& nssm set $ServiceName DisplayName "Orchestrator ComfyUI Backend"
& nssm set $ServiceName Description "ComfyUI image generation backend for Orchestrator v3"

# Restart policy
& nssm set $ServiceName AppExit Default Restart
& nssm set $ServiceName AppRestartDelay 5000

Write-Host "✓ Параметры настроены" -ForegroundColor Green

# Запуск службы
Write-Host "`nЗапуск службы..." -ForegroundColor Cyan
& nssm start $ServiceName

Start-Sleep -Seconds 3

# Проверка статуса
$status = & nssm status $ServiceName
Write-Host "Статус службы: $status" -ForegroundColor $(if ($status -match "SERVICE_RUNNING") { "Green" } else { "Yellow" })

# Инструкции
Write-Host "`n=== Служба успешно установлена ===" -ForegroundColor Green
Write-Host "`nКоманды управления:"
Write-Host "  Запуск:    nssm start $ServiceName"
Write-Host "  Остановка: nssm stop $ServiceName"
Write-Host "  Статус:    nssm status $ServiceName"
Write-Host "  Перезапуск: nssm restart $ServiceName"
Write-Host "  Удаление:  nssm remove $ServiceName confirm"
Write-Host "`nЛоги:"
Write-Host "  stdout: $logsDir\stdout.log"
Write-Host "  stderr: $logsDir\stderr.log"
Write-Host "`nWeb UI: http://127.0.0.1:8188"
