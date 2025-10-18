# ИНСТРУКЦИЯ ДЛЯ АГЕНТА

## Воркспейс и точки входа

**Главный воркспейс:** `C:\Work\Orchestrator\ASWAD-Orchestrator.code-workspace`

**Порядок чтения файлов (ОБЯЗАТЕЛЬНО):**

1. **CONTEXT-START-HERE.md** (этот файл) — общий ориентир
2. **PROJECT-RULES.md** — правила проекта (ТОЛЬКО РУССКИЙ!)
3. **TODO-NEXT.md** — что делать прямо сейчас
4. **docs/_context/agent-context.md** — техническое состояние проекта
5. **docs/BUILDER-STATUS.md** — статус билдера (если есть)
6. **README.md** — общая информация о проекте

## Что за проект

"Orchestrator V6 — Ultra Builder" — улучшенный аналог v0 с одним экраном:
- **FLUX** — только с подтверждением (через bfl.ai API)
- **ComfyUI** — локальная генерация (http://127.0.0.1:8188)
- **v0 Platform** — интеграция (сухая валидация)
- Кнопки/чат, никаких ручных команд

## Архитектура

- **Backend:** C:\Work\Orchestrator (Express, API routes)
- **Frontend:** C:\Work\Orchestrator\apps\admin (Next.js 15 App Router)
- **Модели:** F:\Models (checkpoints, LoRA, etc.)
- **Выходы:** F:\Drop\out (результаты генерации)
- **Кэш/джобы:** C:\Work\Orchestrator\jobs

## Текущее состояние (2025-10-18)

- Сервер: http://localhost:3000 (живой)
- /diagnostics: 404 (НЕТ СТРАНИЦЫ — добавить первым делом)
- /api/comfyui/status: 200 OK
- /api/paths/validate: 500 (починить)
- Ветка: feat/tilda-import (запушена)

## Приоритеты

1. **Добавить /diagnostics** (PathValidator + ComfyUIMonitor)
2. **Починить /api/paths/validate** (ранние гарды)
3. **Phase 3:** Canvas API + UI (листинг F:\Drop\out)
4. Коммит и пуш

## Правила кода

- **Conventional Commits** обязательно
- Не менять сетку/лейаут v0
- Все запросы через /api/* (rewrites)
- Никаких try/catch — только guard-ветки
- TypeScript строгий режим
