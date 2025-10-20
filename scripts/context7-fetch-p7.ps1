# Context7 P7 Queries — Playwright E2E Testing
#
# Modern patterns for E2E testing with Playwright:
# - Test structure and organization
# - Page Object Model (POM) patterns
# - Assertions and locators
# - Fixtures and test hooks
# - SSE/WebSocket testing
#
# Execution: pwsh .\scripts\context7-fetch-p7.ps1

$API_KEY = "ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928"
$BASE_URL = "https://context7.com/v1/repositories/query"

$queries = @(
  @{
    name = "playwright-typescript-modern"
    query = "Playwright TypeScript modern test structure page object model best practices"
  },
  @{
    name = "playwright-drag-drop-resize"
    query = "Playwright drag and drop test resizable panels mouse interaction"
  },
  @{
    name = "playwright-sse-websocket"
    query = "Playwright test Server-Sent Events SSE WebSocket real-time updates"
  },
  @{
    name = "playwright-react-components"
    query = "Playwright test React components button click modal keyboard shortcuts"
  }
)

foreach ($q in $queries) {
  Write-Host "[Context7] Fetching: $($q.name)..." -ForegroundColor Cyan

  $encodedQuery = [System.Web.HttpUtility]::UrlEncode($q.query)
  $url = "$BASE_URL`?query=$encodedQuery"

  try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
      "Authorization" = "Bearer $API_KEY"
    }

    $outputPath = "C:\Work\Orchestrator\docs\_artifacts\context7-$($q.name).json"
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding utf8

    Write-Host "  ✓ Saved to $outputPath" -ForegroundColor Green
  } catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
  }
}

Write-Host "`n[Context7] P7 queries complete!" -ForegroundColor Green
