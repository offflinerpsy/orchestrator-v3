# Context7 API queries for P2 (FLUX + ComfyUI Image Generation)
# Usage: pwsh .\scripts\context7-fetch-p2.ps1

$apiKey = "ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928"
$outputDir = "docs/_artifacts"

$queries = @(
    @{
        name = "flux-api-integration"
        query = "FLUX API image generation REST TypeScript modern patterns"
    },
    @{
        name = "comfyui-websocket"
        query = "ComfyUI WebSocket integration prompt queue workflow"
    },
    @{
        name = "image-generation-workflows"
        query = "React image generation UI polling status WebSocket"
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

Write-Host "`n[Context7] P2 queries complete!" -ForegroundColor Green
