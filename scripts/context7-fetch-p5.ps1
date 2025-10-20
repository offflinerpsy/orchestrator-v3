# Context7 P5 Queries — cmdk Command Palette
#
# Modern patterns for command palette UI:
# - cmdk (pacocoursey/cmdk) library integration
# - Keyboard navigation (⌘K / Ctrl+K)
# - Command registration patterns
# - Search/filter algorithms
# - Grouped commands UI
#
# Execution: pwsh .\scripts\context7-fetch-p5.ps1

$API_KEY = "ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928"
$BASE_URL = "https://context7.com/v1/repositories/query"

$queries = @(
  @{
    name = "cmdk-command-palette-react"
    query = "cmdk pacocoursey command palette React TypeScript keyboard navigation"
  },
  @{
    name = "command-k-shortcut"
    query = "Command-K keyboard shortcut overlay modal React modern"
  },
  @{
    name = "command-palette-search"
    query = "Command palette search fuzzy filter grouped commands TypeScript"
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

Write-Host "`n[Context7] P5 queries complete!" -ForegroundColor Green
