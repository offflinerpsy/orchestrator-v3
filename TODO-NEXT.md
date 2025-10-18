# TODO (ближайшие шаги)

## СРОЧНО — ПЕРВЫМ ДЕЛОМ

**1) Страница /diagnostics** ← НАЧАТЬ ЗДЕСЬ
   - Файл: `apps/admin/app/diagnostics/page.tsx`
   - Компоненты: PathValidator + ComfyUIMonitor (если есть в components/)
   - Простая разметка без изменения сетки v0

**2) Починить /api/paths/validate (возвращает 500)**
   - Файл: `apps/admin/app/api/paths/validate/route.ts` 
   - Добавить ранние гарды на config/paths.json
   - Безопасные фоллбеки, никаких исключений

**3) Phase 3 — Canvas (read-only)**
   - API: `/api/canvas/list` → листинг F:\Drop\out с пагинацией
   - UI: вкладка "Canvas" в Builder → сетка превью из API
   - БЕЗ генерации, только показ существующих файлов

**4) Коммит и пуш**
   - `git commit -m "feat(diagnostics): Add diagnostics page + fix paths validator"`
   - `git push origin feat/tilda-import`

## Состояние сейчас (2025‑10‑18)
- ✅ Админка: http://localhost:3000 (живая)
- ❌ /diagnostics: 404 (страницы НЕТ)
- ✅ /api/comfyui/status: 200 OK
- ❌ /api/paths/validate: 500 (сломано)
- ✅ Ветка: feat/tilda-import (запушена)
