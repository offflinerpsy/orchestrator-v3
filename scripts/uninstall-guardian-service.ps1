#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Uninstall V1 Guardian Windows service

.DESCRIPTION
  Stops and removes the V1Guardian service

.EXAMPLE
  .\uninstall-guardian-service.ps1

.NOTES
  Must run as Administrator
#>

$ErrorActionPreference = "Stop"
$ServiceName = "V1Guardian"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  V1 Guardian Service Uninstaller" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "⚠️  Service '$ServiceName' not found" -ForegroundColor Yellow
    Write-Host "   Nothing to uninstall." -ForegroundColor Gray
    exit 0
}

Write-Host "🛑 Stopping service..." -ForegroundColor Cyan
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$service = Get-Service -Name $ServiceName
if ($service.Status -eq 'Stopped') {
    Write-Host "✅ Service stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service status: $($service.Status)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗑️  Removing service..." -ForegroundColor Cyan
& nssm remove $ServiceName confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service removed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to remove service" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Uninstallation Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Log files in F:\Logs\guardian\ were not deleted." -ForegroundColor Gray
Write-Host "      Delete manually if needed." -ForegroundColor Gray
Write-Host ""
