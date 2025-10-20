# Test v0 API
$body = @{
    prompt = "создай hero секцию для AI стартапа"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v0" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop

Write-Host "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
