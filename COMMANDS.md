# ГОТОВЫЕ КОМАНДЫ

## Открыть воркспейс
```
Точный путь: C:\Work\Orchestrator\ASWAD-Orchestrator.code-workspace
```

## Проверить сервер
```pwsh
# Статус портов
Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue

# Проверка эндпоинтов
curl http://localhost:3000/api/comfyui/status
curl http://localhost:3000/diagnostics
```

## Перезапуск админки (если нужен)
```pwsh
cd C:\Work\Orchestrator\apps\admin
$env:PORT=3000
npm run dev
```

## Git команды
```pwsh
cd C:\Work\Orchestrator
git status
git add .
git commit -m "feat(diagnostics): Add diagnostics page"
git push origin feat/tilda-import
```