# Context7 fetch script for P0 libraries
$queries = @(
    'react-resizable-panels typescript',
    'radix-ui tooltip Next.js', 
    'cmdk command palette',
    'Next.js hotkeys keyboard shortcuts'
)

foreach ($q in $queries) {
    $fn = $q -replace ' ','-'
    Write-Host "Fetching: $q"
    
    $uri = "https://context7.com/api/v1/search?query=$([uri]::EscapeDataString($q))&limit=10"
    $outFile = "C:\Work\Orchestrator\docs\_artifacts\context7-$fn.json"
    
    curl -s $uri -H "Authorization: Bearer ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928" | Out-File $outFile -Encoding utf8
    
    Start-Sleep -Milliseconds 500
}

Write-Host "Done! Check docs/_artifacts/context7-*.json"
