# РЕВИЗОР++ · IGNITE & UNITY — План исправлений

**Дата:** 2025-10-19 20:00 UTC+3  
**Режим:** Жёсткая унификация (RU UI, чат слева, MCP-мост)  
**Репозиторий:** https://github.com/offflinerpsy/orchestrator-v3  
**Ветка:** feat/tilda-import → будут созданы fix/* ветки

---

## БЛОК А: Автозапуск стека одной кнопкой («Ignite»)

### ☐ A1: Создать NSSM-службы для Windows
**Файлы:**
- `scripts/install-services.ps1` — установка служб
- `scripts/uninstall-services.ps1` — удаление служб

**Службы:**
1. `OrchestratorComfyUI` — F:\ComfyUI\run_nvidia_gpu.bat
2. `OrchestratorPanel` — next start в apps/admin
3. `OrchestratorWorker` — worker процесс очереди (если отдельный)

**Приёмка:**
- [ ] `nssm install OrchestratorComfyUI` корректно устанавливает службу
- [ ] Логи пишутся в logs/comfyui-service.log
- [ ] Служба стартует при перезагрузке ОС

---

### ☐ A2: API Route Handlers для управления службами
**Файлы:**
- `apps/admin/app/api/system/comfy/start/route.ts` — nssm start OrchestratorComfyUI
- `apps/admin/app/api/system/comfy/stop/route.ts` — nssm stop
- `apps/admin/app/api/system/comfy/status/route.ts` — nssm status
- `apps/admin/app/api/system/panel/status/route.ts` — статус Next dev/prod
- `apps/admin/app/api/system/ignite/route.ts` — запуск всего стека

**Приёмка:**
- [ ] POST /api/system/comfy/start возвращает { success: true }
- [ ] GET /api/system/comfy/status возвращает { running: true/false }
- [ ] POST /api/system/ignite стартует все службы по порядку

---

### ☐ A3: UI кнопка «Запуск системы» на главной
**Файлы:**
- `apps/admin/app/page.tsx` — стартовая страница с кнопкой Ignite

**Компоненты:**
- Кнопка «Запуск системы» (зелёная, иконка Zap)
- Индикаторы статуса: ComfyUI, Panel, Worker (зелёный/красный)
- Ссылка «Открыть панель» → /builder

**Приёмка:**
- [ ] Клик → POST /api/system/ignite
- [ ] Через 10-15 сек статусы зелёные
- [ ] Ссылка «Открыть панель» работает

---

## БЛОК Б: Прокси-слой и запрет прямых вызовов

### ☐ B1: Прокси-маршруты для ComfyUI API
**Файлы:**
- `apps/admin/app/api/comfy/prompt/route.ts` → http://127.0.0.1:8188/prompt
- `apps/admin/app/api/comfy/history/[id]/route.ts` → /history/:id
- `apps/admin/app/api/comfy/models/route.ts` → /object_info
- `apps/admin/app/api/comfy/ws/route.ts` → WebSocket прокси (если нужен)

**Приёмка:**
- [ ] fetch('/api/comfy/prompt') работает без CORS
- [ ] Headers прокидываются корректно
- [ ] Нет прямых запросов к 127.0.0.1:8188 из браузера

---

### ☐ B2: Прокси-маршруты для FLUX API
**Файлы:**
- `apps/admin/app/api/flux/generate/route.ts` → https://api.bfl.ai/v1/flux-pro-1.1-ultra
- `apps/admin/app/api/flux/poll/route.ts` → polling_url из результата

**Секреты:**
- BFL_API_KEY из .env.local (никогда не на клиент)

**Приёмка:**
- [ ] POST /api/flux/generate формирует тело по спеке FLUX
- [ ] GET /api/flux/poll/:taskId опрашивает polling_url
- [ ] BFL_API_KEY не утекает в браузер

---

### ☐ B3: Прокси-маршруты для v0 Platform API
**Файлы:**
- `apps/admin/app/api/v0/generate/route.ts` → v0 SDK createClient

**Приёмка:**
- [ ] V0_API_KEY не утекает на клиент
- [ ] Запросы идут через серверный Route Handler

---

## БЛОК В: Клиент/сервер-граница (убираем белый экран)

### ☐ V1: Аудит серверных/клиентских границ
**Задача:**
- Найти все использования fs, child_process, spawn в клиентском коде
- Проверить компоненты на hydration (window, document без guards)

**Файлы для проверки:**
- `apps/admin/components/**/*.tsx`
- `apps/admin/app/**/*.tsx`

**Приёмка:**
- [ ] Список найденных нарушений
- [ ] План переноса в Route Handlers

---

### ☐ V2: Перенос серверной логики в Route Handlers
**Файлы:**
- Все fs/spawn вызовы → новые /api/** маршруты
- Клиентские компоненты → только fetch('/api/**')

**Приёмка:**
- [ ] Нет импортов fs, child_process, path в клиентском коде
- [ ] Все серверные действия через API

---

### ☐ V3: Добавить use client и dynamic() где нужно
**Файлы:**
- Компоненты с window/drag-n-drop → `'use client'`
- Компоненты с тяжёлыми библиотеками → `dynamic(() => import(...), { ssr: false })`

**Приёмка:**
- [ ] Нет hydration ошибок в консоли
- [ ] Страницы рендерятся корректно

---

### ☐ V4: Добавить fallback и русские тосты для ошибок
**Файлы:**
- `apps/admin/lib/toast.ts` — утилита для уведомлений
- Все fetch вызовы → обработка ошибок с русским текстом

**Приёмка:**
- [ ] При ошибке API показывается toast на русском
- [ ] UI не «пустеет», показывается сообщение

---

## БЛОК Г: Пути моделей ComfyUI (устойчиво)

### ☐ G1: Генератор extra_model_paths.yaml
**Файлы:**
- `apps/admin/app/api/comfy/models/setup/route.ts` — создание/валидация yaml
- `scripts/comfy-models-setup.mjs` — резервная утилита

**Схема YAML:**
```yaml
orchestrator:
  base_path: F:\Models\
  checkpoints: checkpoints/
  vae: vae/
  loras: loras/
  controlnet: controlnet/
  clip_vision: ipadapter/IP-Adapter/models/image_encoder/
```

**Приёмка:**
- [ ] POST /api/comfy/models/setup создаёт yaml
- [ ] Бэкап в .bak перед перезаписью
- [ ] ComfyUI видит модели после перезапуска

---

### ☐ G2: Кнопка «Пересканировать модели» в Settings
**Файлы:**
- `apps/admin/app/settings/page.tsx` — кнопка Rescan Models
- `apps/admin/app/api/comfy/models/rescan/route.ts` — вызов ComfyUI endpoint

**Приёмка:**
- [ ] Кнопка дёргает ComfyUI /models/refresh (если есть)
- [ ] После клика список моделей обновляется

---

### ☐ G3: Отображение списка моделей в Settings
**Файлы:**
- `apps/admin/app/settings/page.tsx` — секция Models
- Fetch /api/comfy/models → показать checkpoints, ControlNet, IP-Adapter

**Приёмка:**
- [ ] Видны: SDXL, SD3.5, SVD, ControlNet Depth, IP-Adapter
- [ ] Если модель отсутствует — подсказка где скачать

---

## БЛОК Д: Единый чат и очередь (панель ↔ VS Code через MCP)

### ☐ D1: Создать SQLite хранилище orchestrator.db
**Файлы:**
- `data/orchestrator.db` — SQLite база
- `apps/admin/lib/db.ts` — обёртка (better-sqlite3)

**Таблицы:**
- `jobs` (id, type, status, prompt, params, result, createdAt, finishedAt)
- `messages` (id, role, content, jobId, timestamp)
- `attachments` (id, messageId, filePath, mimeType)

**Приёмка:**
- [ ] База создаётся автоматически при первом запуске
- [ ] CRUD операции работают

---

### ☐ D2: Реализовать Orchestrator-MCP сервер
**Файлы:**
- `mcp-server/index.ts` — MCP сервер (stdio transport)
- `mcp-server/tools/` — инструменты (queue, comfy, flux, v0, tilda, codemod, preview)

**Инструменты:**
- `queue.create(type, prompt, params)`
- `queue.run(jobId)`
- `queue.status(jobId)`
- `comfy.prompt(workflow)`
- `flux.prompt(prompt, params)`
- `v0.generate(prompt)`
- `tilda.import(pageId)`
- `codemod.apply(pattern, replacement)`
- `preview.screenshot(url)`

**Приёмка:**
- [ ] `node mcp-server/index.ts` запускается
- [ ] Инструменты возвращают корректные результаты

---

### ☐ D3: Настроить VS Code MCP конфиг
**Файлы:**
- `.vscode/mcp-servers.json` — конфигурация MCP серверов

**Конфиг:**
```json
{
  "orchestrator": {
    "command": "node",
    "args": ["C:\\Work\\Orchestrator\\mcp-server\\index.js"],
    "env": {
      "DB_PATH": "C:\\Work\\Orchestrator\\data\\orchestrator.db"
    }
  }
}
```

**Приёмка:**
- [ ] Copilot в VS Code видит инструменты Orchestrator
- [ ] Вызов queue.create работает из чата Copilot

---

### ☐ D4: UI чат слева в панели
**Файлы:**
- `apps/admin/components/chat-panel.tsx` — левая панель чата
- `apps/admin/app/api/chat/messages/route.ts` — GET/POST сообщения

**Функции:**
- Автопрокрутка вниз
- Поддержка `/команд` (например, `/generate flux ...`)
- Отображение результатов задач (превью изображений)

**Приёмка:**
- [ ] Чат слева, фиксированная ширина 380-420px
- [ ] Сообщения сохраняются в orchestrator.db
- [ ] Copilot видит те же сообщения

---

## БЛОК Е: UI/UX «как v0, только наше» (русский интерфейс)

### ☐ E1: Рефакторинг layout (чат слева + вкладки справа)
**Файлы:**
- `apps/admin/app/builder/layout.tsx` — новый лэйаут

**Структура:**
```
<div class="flex h-screen">
  <ChatPanel /> {/* 380-420px слева */}
  <main class="flex-1">
    <Tabs>
      <Tab>Страницы</Tab>
      <Tab>Дизайн</Tab>
      <Tab>Генерация</Tab>
      <Tab>Очередь</Tab>
      <Tab>Результаты</Tab>
      <Tab>Настройки</Tab>
    </Tabs>
  </main>
</div>
```

**Приёмка:**
- [ ] Чат слева, вкладки справа
- [ ] Весь текст на русском

---

### ☐ E2: Добавить Tooltip и Popover для всех кнопок
**Файлы:**
- `apps/admin/components/ui/tooltip-with-info.tsx` — компонент с иконкой (i)

**Функция:**
- Tooltip при hover (краткое описание)
- Popover при клике на (i) (развёрнутое объяснение)

**Примеры:**
- raw (FLUX): «Фотореализм, меньше стилизации»
- aspect_ratio: «21:9 — герой сцены, 16:9 — баланс...»
- image_prompt_strength: «0–1: влияние исходника на результат»

**Приёмка:**
- [ ] У каждой кнопки генерации есть tooltip
- [ ] Иконка (i) открывает popover с подробностями

---

### ☐ E3: Пресеты «Модульные дома»
**Файлы:**
- `apps/admin/components/presets/modular-homes.tsx` — компонент пресетов

**Пресеты:**
1. **Hero 21:9** (FLUX, raw: true, aspect_ratio: "21:9")
2. **Каталожная 16:9** (SDXL i2i + ControlNet Depth, 1024x576)
3. **Детали 4:3** (SD3.5 + IP-Adapter, 1024x768)

**Приёмка:**
- [ ] Клик на пресет → заполняет форму генерации
- [ ] Создаёт задачу, но не запускает автоматически

---

### ☐ E4: Русификация всего UI
**Файлы:**
- Все компоненты в `apps/admin/components/**/*.tsx`
- Все страницы в `apps/admin/app/**/*.tsx`

**Замены:**
- Generate → Сгенерировать
- Queue → Очередь
- Results → Результаты
- Settings → Настройки
- Loading... → Загрузка...
- Error → Ошибка

**Приёмка:**
- [ ] Весь UI на русском
- [ ] Нет английских текстов в интерфейсе

---

## БЛОК Ж: Генерация медиа (прокси + очереди)

### ☐ ZH1: Унифицировать /api/generate (общая точка)
**Файлы:**
- `apps/admin/app/api/generate/route.ts` — POST создаёт задачу в orchestrator.db

**Логика:**
- Принимает { backend: 'flux'|'sdxl'|'sd35'|'svd', prompt, params, runNow }
- Создаёт запись в jobs
- Если runNow → запускает executeJob в фоне

**Приёмка:**
- [ ] POST /api/generate возвращает { jobId }
- [ ] Задача сохраняется в БД

---

### ☐ ZH2: FLUX — модалка подтверждения перед платным вызовом
**Файлы:**
- `apps/admin/components/flux-confirm-modal.tsx` — модалка с ценой

**Функция:**
- Показывает prompt, параметры, цену (~$0.05)
- Кнопки: Отмена / Да, запустить ($)

**Приёмка:**
- [ ] Модалка появляется перед реальным вызовом FLUX
- [ ] Отмена не создаёт задачу

---

### ☐ ZH3: FLUX — polling результата
**Файлы:**
- `apps/admin/app/api/generate/route.ts` → executeFlux()

**Логика:**
- POST /flux-pro-1.1-ultra
- Получить { id, polling_url }
- Опрос каждые 5 сек (макс 60 попыток)
- Скачать результат → F:\Drop\out\flux_<jobId>.jpg

**Приёмка:**
- [ ] Задача FLUX завершается со статусом done
- [ ] Результат сохранён в dropOut

---

### ☐ ZH4: ComfyUI — workflow в API формате + /prompt
**Файлы:**
- Обновить `executeComfyUI()` в /api/generate/route.ts

**Логика:**
- Читать workflow JSON
- Инъектировать prompt, steps, cfg, width, height, seed
- POST /api/comfy/prompt
- Polling GET /api/comfy/history/:promptId
- Результат → F:\Drop\out

**Приёмка:**
- [ ] Задачи SDXL/SD3.5/SVD завершаются успешно
- [ ] Результаты в dropOut

---

### ☐ ZH5: UI прогресс-бар и логи задачи
**Файлы:**
- `apps/admin/components/job-progress.tsx` — компонент прогресса
- `apps/admin/app/api/jobs/[id]/route.ts` — GET детали задачи

**Функция:**
- Polling GET /api/jobs/:id каждые 2 сек
- Показывать: progress (0-100%), status, logs
- Кнопка Cancel (если реализуемо)

**Приёмка:**
- [ ] Прогресс обновляется в реальном времени
- [ ] Логи отображаются

---

## БЛОК З: Импорт Tilda → Next

### ☐ Z1: Парсер Tilda export JSON
**Файлы:**
- `apps/admin/app/api/tilda/convert/route.ts` — POST с дампом

**Логика:**
- Принимает JSON из getpagefullexport
- Парсит html, images, js, css
- Копирует ассеты в public/tilda/:pageId/
- Генерирует Next.js маршруты в apps/site/app/(tilda)/:slug/

**Приёмка:**
- [ ] POST /api/tilda/convert успешно конвертирует страницу
- [ ] Ассеты доступны по /tilda/:pageId/:file

---

### ☐ Z2: Карта соответствий page → route
**Файлы:**
- `docs/tilda-routes-map.md` — таблица соответствий

**Содержание:**
- pageId | slug | title | route

**Приёмка:**
- [ ] Документ создан с примерами
- [ ] Маршруты работают

---

## БЛОК И: Диагностика и автотесты

### ☐ I1: Страница /builder/diagnostics
**Файлы:**
- `apps/admin/app/builder/diagnostics/page.tsx` — новая страница

**Секции:**
- Службы: ComfyUI, Panel, Worker (зелёный/красный)
- Модели: список checkpoints, ControlNet, IP-Adapter
- extra_model_paths.yaml: валидность, кнопка Restore
- API ключи: FLUX, v0 (без показа значений)
- Ping ComfyUI, FLUX, v0 (без реальных запросов)

**Приёмка:**
- [ ] Диагностика показывает корректные статусы
- [ ] При ошибках — чёткие советы на русском

---

### ☐ I2: Playwright тесты с toHaveScreenshot()
**Файлы:**
- `tests/visual/builder.spec.ts` — скриншот-тесты
- `tests/visual/generate.spec.ts`
- `tests/visual/queue.spec.ts`
- `tests/visual/results.spec.ts`

**Тесты:**
```ts
test('Builder page matches screenshot', async ({ page }) => {
  await page.goto('http://localhost:3000/builder');
  await expect(page).toHaveScreenshot('builder.png');
});
```

**Приёмка:**
- [ ] Тесты проходят без регрессий
- [ ] Базовые скрины сохранены

---

### ☐ I3: CI/CD для автотестов
**Файлы:**
- `.github/workflows/visual-tests.yml` — GitHub Actions

**Шаги:**
- pnpm install
- pnpm --filter admin build
- pnpm --filter admin test:visual

**Приёмка:**
- [ ] Тесты запускаются в CI
- [ ] При регрессии — PR не мержится

---

## БЛОК Я: Финальная сборка и документация

### ☐ YA1: Обновить README.md
**Файлы:**
- `README.md` — главная документация

**Секции:**
- Быстрый старт (Ignite)
- Структура проекта
- API эндпоинты
- MCP интеграция
- Ссылки на офф. доки

**Приёмка:**
- [ ] README актуален
- [ ] Инструкции работают

---

### ☐ YA2: Создать CHANGELOG.md
**Файлы:**
- `CHANGELOG.md` — список изменений

**Формат:**
```md
## [Unreleased]
### Added
- NSSM службы для автозапуска
- Прокси-маршруты для ComfyUI/FLUX/v0
- MCP-сервер для VS Code интеграции
...
```

**Приёмка:**
- [ ] CHANGELOG заполнен
- [ ] Ссылки на коммиты работают

---

### ☐ YA3: Финальная ревизия и отчёт
**Файлы:**
- `docs/REVISION-REPORT.md` — дополнить секцию «Что исправлено»

**Содержание:**
- Ссылки на все PR fix/*
- Метрики: до/после (готовность 80% → 95%)
- Known Issues (если остались)

**Приёмка:**
- [ ] Отчёт актуализирован
- [ ] Все PR ссылки работают

---

## ИТОГО: 25 ЗАДАЧ

**По блокам:**
- А (Автозапуск): 3 задачи
- Б (Прокси): 3 задачи
- В (Клиент/сервер): 4 задачи
- Г (Модели): 3 задачи
- Д (Чат/MCP): 4 задачи
- Е (UI/UX): 4 задачи
- Ж (Генерация): 5 задачи
- З (Tilda): 2 задачи
- И (Диагностика): 3 задачи
- Я (Документация): 3 задачи

**Приоритет выполнения:**
1. **Критично:** B1-B3, V1-V4 (прокси + клиент/сервер граница)
2. **Высоко:** A1-A3, D1-D4 (автозапуск + MCP)
3. **Средне:** G1-G3, E1-E4, ZH1-ZH5 (модели + UI + генерация)
4. **Низко:** Z1-Z2, I1-I3, YA1-YA3 (Tilda + тесты + доки)

---

**Следующий шаг:** Начать с задачи **B1** (прокси ComfyUI) — это устранит CORS и белый экран.
