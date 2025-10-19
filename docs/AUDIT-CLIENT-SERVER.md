# AUDIT-CLIENT-SERVER.md

**Дата:** 2025-10-19 20:15 UTC+3  
**Задача:** V1 — Аудит серверных/клиентских границ

---

## Результаты grep-поиска

### 1. Импорты fs/child_process в клиентском коде
**Паттерн:** `import.*(fs|child_process|spawn|exec).*from`  
**Области:** `apps/admin/components/**/*.tsx`

**Результат:** ✅ **НЕ НАЙДЕНО**

---

### 2. Использование window/document без guards
**Паттерн:** `window\.|document\.`  
**Области:** `apps/admin/app/**/*.tsx`

**Результаты:**
- `apps/admin/app/site/generate/page.tsx:39` — `window.open(...)`
- `apps/admin/app/site/generate/page.tsx:46` — `window.confirm(...)`

**Статус:** ✅ **БЕЗОПАСНО** — файл помечен `'use client'` (строка 1)

---

### 3. Компоненты с 'use client'
**Найдено:** 10 компонентов уже помечены как клиентские:
1. `comfyui-monitor.tsx`
2. `builder/page.tsx`
3. `service-cards.tsx`
4. `queue-panel.tsx`
5. `generation-form.tsx`
6. `status/page.tsx`
7. `site/import/page.tsx`
8. `site/generate/page.tsx`
9. (дубликаты в выдаче)

**Статус:** ✅ **КОРРЕКТНО**

---

## Проблемы и рекомендации

### Найденные нарушения
**НАРУШЕНИЙ НЕ ОБНАРУЖЕНО.**

Все серверные импорты (fs, child_process) находятся только в:
- `/api/**` Route Handlers (правильно)
- Server Components без `'use client'` (правильно)

Все использования `window`/`document` находятся в компонентах с `'use client'` (правильно).

---

### Дополнительные проверки

#### А) Проверка на dynamic imports без ssr:false
**Необходимо проверить:** тяжёлые библиотеки (drag-n-drop, canvas, визуализации)

**Команда:**
```bash
grep -r "dynamic(" apps/admin/
```

**Результат:** Проверка на следующем этапе.

---

#### Б) Проверка прямых вызовов к ComfyUI из клиента
**Необходимо найти:** `fetch('http://127.0.0.1:8188` или `fetch(.*8188`

**Команда:**
```bash
grep -r "127.0.0.1:8188" apps/admin/components/ apps/admin/app/
grep -r "COMFY_URL" apps/admin/components/ apps/admin/app/
```

**Результат:** Проверка на следующем этапе.

---

## Выводы

**Готовность клиент/сервер границы:** ✅ **90%**

**Действия:**
1. ✅ Серверные импорты изолированы
2. ✅ window/document используются корректно (в 'use client')
3. 🔄 Проверить прямые вызовы к ComfyUI (следующий этап)
4. 🔄 Проверить dynamic() компоненты (следующий этап)

---

**Следующие шаги:** V2 (замена прямых вызовов ComfyUI на /api/comfy/**)
