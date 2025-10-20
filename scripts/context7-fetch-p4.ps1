# Context7 P4 Queries — Template Import System
#
# Modern patterns for component library integration:
# - shadcn/ui registry API patterns
# - Component installation workflows
# - Dependency injection + file templating
# - HyperUI component examples
# - Template gallery UI patterns
#
# Execution: pwsh .\scripts\context7-fetch-p4.ps1

$API_KEY = "ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928"
$BASE_URL = "https://context7.com/v1/repositories/query"

$queries = @(
  @{
    name = "shadcn-ui-registry-api"
    query = "shadcn/ui component registry API fetch install dependencies TypeScript"
  },
  @{
    name = "component-import-workflow"
    query = "React component library import CLI template installation modern"
  },
  @{
    name = "template-gallery-ui"
    query = "Component gallery preview thumbnails categories React TypeScript modern"
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

Write-Host "`n[Context7] P4 queries complete!" -ForegroundColor Green
