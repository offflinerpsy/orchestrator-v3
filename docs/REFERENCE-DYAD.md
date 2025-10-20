<!-- GPT-5 Reference Note — Dyad patterns for Orchestrator -->

# Dyad (Apache-2.0) — что это и что берём

- Репозиторий: https://github.com/dyad-sh/dyad
- Сайт/документация: https://www.dyad.sh/
- Лицензия: Apache-2.0 (совместима для заимствования кода с указанием авторства)

## Коротко

Dyad — локальный open‑source «app builder» (альтернатива v0/Lovable/Bolt), монорепа на TypeScript, десктоп через Electron Forge + Vite. Поддерживает «bring your own keys», локальные модели (Ollama/LM Studio), Next.js‑шаблоны, MCP‑мост. Хорош как эталон UX/архитектуры и источник паттернов.

Ссылки по фичам/релизам:
- Репозиторий: https://github.com/dyad-sh/dyad
- Next.js support (релиз 0.7.0): https://www.dyad.sh/docs/releases/0.7.0
- Import App (0.6.0, experimental): https://www.dyad.sh/docs/releases/0.6.0
- MCP support (0.22.0): https://www.dyad.sh/docs/releases/0.22.0
- MCP beta (0.22.0-beta.1): https://www.dyad.sh/docs/releases/0.22.0-beta.1
- Пример провайдера под Ollama: https://github.com/dyad-sh/ollama-ai-provider-v2

Подводные камни (для ориентира):
- Импорт чужих Next/Node проектов местами багует: https://github.com/dyad-sh/dyad/issues/1451
- Проксирование/URL для локальных LLM через Ollama/сетевые настройки: https://github.com/dyad-sh/dyad/issues/840

## Что именно заимствуем (паттерны)

1) Слой провайдеров моделей (единый интерфейс)
- Идея: абстракции для источников генерации (локальные/облачные) с единым контрактом generate()/poll()/cancel().
- Применение у нас: providers/image/* → flux, comfy, позже ollama (text), lm-studio.
- Эффект: UI и /api/generate оперируют провайдером по имени; лёгкий роутинг и тестируемость.

2) Шаблоны/скелет Next.js
- У них есть «Create Next» шаблоны и структура стартеров (релиз 0.7.0). Используем как референс сборки/структуры.

3) MCP‑мост
- Dyad «shipped» MCP. Это подтверждает нашу стратегию мостов (панель ↔ IDE‑агент). Берём модель взаимодействия и формат ресурсов/инструментов.

4) E2E (Playwright)
- Их подход подкрепляет наш smoke/e2e. Берём структуру сценариев и практики стабилизации UI‑потоков.

## Что не берём «как есть»

- Electron Forge / настольная обвязка — у нас веб‑ядро (Next.js + службы NSSM). Переносить Electron нецелесообразно.
- «Импорт любых чужих проектов» как фича — оставляем сугубо детерминированный импорт («Tilda→Next») с валидацией/сухим прогоном.

## План внедрения паттернов (миграция без ломки)

Этап P1 — Провайдеры генерации
- Создать apps/admin/lib/providers/:
  - types.ts — ImageProvider интерфейс: generate(input) → { taskId | promptId }, poll(id), cancel(id)
  - fluxProvider.ts — обёртка над lib/flux-client.ts
  - comfyProvider.ts — обёртка над lib/comfy-client.ts (+ нормализация workflow и парсинг history)
- Обновить /api/generate — переключатель провайдера по backend.

Этап P2 — Единая ошибка/контракты
- Ввести lib/api-error.ts (код, message, details, hint), использовать во всех маршрутах.
- Маппинг провайдерских ошибок в типизированные ответы.

Этап P3 — Тесты
- Playwright e2e: сценарии flux и sdxl до артефакта в dropOut.
- Контрактные тесты для /api/generate (dry‑run/real), /api/jobs, /api/health.

Этап P4 — MCP
- Манифест инструментов (просмотр/перезапуск джоб, чтение логов, импорт заготовок), интеграция с IDE‑агентом.

Этап P5 — UX‑паттерны
- В UI: выбор провайдера/шаблона, префлайт‑чекапы, читабельные ошибки, retry/fallback (переключение провайдера при отказе).

## Маппинг на текущий бэклог

- providers layer → новая задача «Ввести слой провайдеров генерации (flux/comfy)»
- api‑unify → «Единые схемы ошибок и агрегатор /api/generate»
- tests‑e2e → «Сценарии Comfy/FLUX до изображения»
- mcp‑bridge → «Экспорт инструментов в MCP для IDE‑агента»


