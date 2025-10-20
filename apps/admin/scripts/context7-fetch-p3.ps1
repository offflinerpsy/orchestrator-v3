# Context7 API queries for P3 (SSE + Job Queue + Gallery)
# Usage: pwsh .\scripts\context7-fetch-p3.ps1

$apiKey = "ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928"
$outputDir = "docs\_artifacts"

$queries = @(
    @{
        name = "sse-server-sent-events"
        query = "Server-Sent Events SSE React hooks real-time TypeScript"
    },
    @{
        name = "job-queue-ui"
        query = "Job queue UI component React status polling WebSocket"
    },
    @{
        name = "image-gallery-react"
        query = "Image gallery React pagination masonry grid modern"
    }
)

foreach ($q in $queries) {
    $encodedQuery = [System.Web.HttpUtility]::UrlEncode($q.query)
    $uri = "https://context7.com/v1/repositories/query?query=$encodedQuery"
    
    Write-Host "`n[Context7] Fetching: $($q.name)" -ForegroundColor Cyan
    Write-Host "  Query: $($q.query)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method Get -Headers @{
            "Authorization" = "Bearer $apiKey"
        } -ErrorAction Stop
        
        $outputFile = Join-Path $outputDir "context7-$($q.name).json"
        $response | ConvertTo-Json -Depth 10 | Out-File $outputFile -Encoding UTF8
        
        Write-Host "  ✓ Saved to $outputFile" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n[Context7] P3 queries complete!" -ForegroundColor Green
