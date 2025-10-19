#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Install V1 Guardian as Windows service using NSSM

.DESCRIPTION
  This script:
  1. Checks for NSSM installation
  2. Builds Guardian TypeScript code
  3. Installs V1Guardian as Windows service
  4. Configures logging, restart policy, and environment
  5. Starts the service

.EXAMPLE
  .\install-guardian-service.ps1

.NOTES
  Must run as Administrator
  Requires NSSM (https://nssm.cc/)
  Assumes Node.js and pnpm are installed
#>

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "V1Guardian"
$GuardianPath = "C:\Work\Orchestrator\services\guardian"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$LogDir = "F:\Logs\guardian"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  V1 Guardian Service Installer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Check if NSSM is installed
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmPath) {
    Write-Host "❌ ERROR: NSSM not found in PATH" -ForegroundColor Red
    Write-Host "   Download from: https://nssm.cc/download" -ForegroundColor Yellow
    Write-Host "   Or install with: winget install NSSM.NSSM" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ NSSM found: $($nssmPath.Source)" -ForegroundColor Green

# Check if Node.js exists
if (-not (Test-Path $NodeExe)) {
    Write-Host "❌ ERROR: Node.js not found at $NodeExe" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $NodeExe" -ForegroundColor Green

# Check if Guardian directory exists
if (-not (Test-Path $GuardianPath)) {
    Write-Host "❌ ERROR: Guardian directory not found: $GuardianPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Guardian directory: $GuardianPath" -ForegroundColor Green

# Create log directory if not exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "✅ Created log directory: $LogDir" -ForegroundColor Green
} else {
    Write-Host "✅ Log directory exists: $LogDir" -ForegroundColor Green
}

# Check if service already exists
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "⚠️  Service '$ServiceName' already exists" -ForegroundColor Yellow
    $response = Read-Host "   Do you want to remove and reinstall? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "   Stopping service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        Write-Host "   Removing service..." -ForegroundColor Yellow
        & nssm remove $ServiceName confirm
        Start-Sleep -Seconds 2
        Write-Host "✅ Service removed" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation cancelled" -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "📦 Building Guardian..." -ForegroundColor Cyan
Push-Location $GuardianPath
try {
    # Install dependencies
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    & pnpm install --silent 2>&1 | Out-Null
    
    # Build TypeScript
    Write-Host "   Compiling TypeScript..." -ForegroundColor Gray
    & pnpm run build 2>&1 | Out-Null
    
    if (-not (Test-Path "$GuardianPath\dist\index.js")) {
        throw "Build failed: dist/index.js not found"
    }
    
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "🔧 Installing service..." -ForegroundColor Cyan

# Install service with NSSM
$appPath = "$GuardianPath\dist\index.js"
& nssm install $ServiceName $NodeExe $appPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install service" -ForegroundColor Red
    exit 1
}

# Configure service
Write-Host "   Configuring service..." -ForegroundColor Gray

# Set display name and description
& nssm set $ServiceName DisplayName "V1 Guardian Monitoring Service"
& nssm set $ServiceName Description "Autonomous monitoring and auto-recovery for Orchestrator services"

# Set working directory
& nssm set $ServiceName AppDirectory $GuardianPath

# Set log files
$stdoutLog = "$LogDir\stdout.log"
$stderrLog = "$LogDir\stderr.log"
& nssm set $ServiceName AppStdout $stdoutLog
& nssm set $ServiceName AppStderr $stderrLog

# Log rotation: 10MB max, keep 5 files
& nssm set $ServiceName AppRotateFiles 1
& nssm set $ServiceName AppRotateBytes 10485760  # 10 MB
& nssm set $ServiceName AppRotateOnline 1

# Restart policy: restart on failure, 30 second delay
& nssm set $ServiceName AppExit Default Restart
& nssm set $ServiceName AppRestartDelay 30000  # 30 seconds

# Throttle restarts: max 3 restarts in 60 seconds
& nssm set $ServiceName AppThrottle 60000  # 60 seconds

# Startup type: Automatic (Delayed Start)
& nssm set $ServiceName Start SERVICE_DELAYED_AUTO_START

# Set priority: Normal
& nssm set $ServiceName AppPriority NORMAL_PRIORITY_CLASS

Write-Host "✅ Service configured" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting service..." -ForegroundColor Cyan

# Start the service
& nssm start $ServiceName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start service" -ForegroundColor Red
    Write-Host "   Check logs: $LogDir" -ForegroundColor Yellow
    exit 1
}

# Wait for service to start
Start-Sleep -Seconds 3

# Check service status
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "✅ Service started successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service installed but not running" -ForegroundColor Yellow
    Write-Host "   Status: $($service.Status)" -ForegroundColor Yellow
    Write-Host "   Check logs: $LogDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name:   $ServiceName" -ForegroundColor White
Write-Host "Log Directory:  $LogDir" -ForegroundColor White
Write-Host "Guardian Path:  $GuardianPath" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "  Start:   nssm start $ServiceName" -ForegroundColor Gray
Write-Host "  Stop:    nssm stop $ServiceName" -ForegroundColor Gray
Write-Host "  Restart: nssm restart $ServiceName" -ForegroundColor Gray
Write-Host "  Status:  nssm status $ServiceName" -ForegroundColor Gray
Write-Host "  Remove:  nssm remove $ServiceName confirm" -ForegroundColor Gray
Write-Host ""
Write-Host "View Logs:" -ForegroundColor Cyan
Write-Host "  Get-Content '$LogDir\guardian.log' -Tail 20" -ForegroundColor Gray
Write-Host "  Get-Content '$LogDir\stdout.log' -Tail 20" -ForegroundColor Gray
Write-Host "  Get-Content '$LogDir\stderr.log' -Tail 20" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Guardian is now monitoring your system 24/7!" -ForegroundColor Green
Write-Host ""
