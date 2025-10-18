# v0 Platform API — UX Patterns для Orchestrator V6 Ultra Builder

## Источники исследования

**v0 Platform API Blog:**  
https://vercel.com/blog/build-your-own-ai-app-builder-with-the-v0-platform-api

**Simple v0 Demo Template:**  
https://vercel.com/templates/next.js/v0-platform-api-demo  
GitHub: https://github.com/vercel/v0-sdk/tree/main/examples/simple-v0

**v0 Platform API Docs:**  
https://v0.dev/docs/v0-platform-api

---

## Ключевые UX-паттерны, которые мы копируем

### 1. **Composer (Input Interface)**
- **Единая строка ввода промпта** — центральный элемент интерфейса
- **Slash-команды** (`/ui`, `/img`, `/video`, `/codemod`, `/preview`) — быстрый доступ к функциям
- **Voice Input** (опционально) — speech-to-text для промптов
- **File Attachments** — возможность прикрепить изображения/файлы к промпту
- **Action Buttons:** "Generate", "Continue", "Fork", "Deploy"

**Наша реализация:**
```tsx
<Composer 
  prompt={prompt}
  onSubmit={handleGenerate}
  slashCommands={['/ui', '/img', '/video', '/codemod', '/preview']}
  actions={['Generate UI (v0)', 'Generate Media', 'Run', 'Estimate']}
/>
```

---

### 2. **Live Preview (Iframe Embed)**
- **Центральная панель с iframe** — показывает живой demo URL из v0 API
- **Real-time generation** — iframe обновляется автоматически при получении `chat.demo`
- **Responsive** — превью адаптируется под размер экрана
- **Full-screen mode** — возможность развернуть на весь экран

**Наша реализация:**
```tsx
<Tabs defaultValue="preview">
  <TabsList>
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="canvas">Canvas</TabsTrigger>
    <TabsTrigger value="diff">Diff/PR</TabsTrigger>
  </TabsList>
  
  <TabsContent value="preview">
    <iframe 
      src={demoUrl} 
      width="100%" 
      height="100%"
      className="border rounded-lg"
    />
  </TabsContent>
</Tabs>
```

---

### 3. **File List & Code View**
- **Список сгенерированных файлов** — отображается рядом с превью
- **Syntax highlighting** — подсветка кода для каждого файла
- **Copy/Download** — кнопки для копирования/скачивания файлов
- **File tree structure** — иерархия файлов как в проекте

**Структура данных:**
```typescript
interface ChatFile {
  name: string;        // "app/page.tsx"
  content: string;     // Код файла
  language?: string;   // "typescript", "css", "json"
}

chat.files?.forEach((file) => {
  console.log(`File: ${file.name}`)
  console.log(`Content: ${file.content}`)
})
```

**Наша реализация:**
- Показываем файлы в **Right Drawer** или отдельной вкладке
- Подсветка синтаксиса через `react-syntax-highlighter` или Monaco Editor
- Кнопки "Insert to Project", "Download ZIP"

---

### 4. **Project & Chat Management**
- **Projects** — группировка чатов (как папки)
- **Chats** — отдельные беседы с историей (продолжение диалога)
- **Fork** — создать копию чата для экспериментов
- **Rename/Delete** — управление чатами

**API endpoints (v0 SDK):**
```typescript
// Создать новый чат
const chat = await v0.chats.create({
  message: "Build a todo app with React"
})

// Продолжить диалог
const updated = await v0.chats.sendMessage(chatId, {
  message: "Add a dark mode toggle"
})

// Получить историю
const history = await v0.chats.get(chatId)
```

**Наша реализация:**
- **Left Drawer → Site Tree** — аналог Projects (список страниц/компонентов)
- **Queue** — список активных задач генерации (аналог Chats)
- Кнопки "Continue", "Fork", "Delete" в Queue

---

### 5. **One-Click Deployment**
- **Deploy to Vercel** — кнопка развёртывания прямо из интерфейса
- **Project linking** — связать v0 chat с Vercel project
- **Auto-deploy** — опция автоматического деплоя после генерации

**API endpoint:**
```typescript
POST /api/deployments
{
  chatId: string,
  projectId?: string  // Vercel project ID
}
```

**Наша реализация:**
- **Кнопка "Open PR"** — создаёт PR в GitHub (через MCP)
- **Кнопка "Deploy"** — опционально (если используем Vercel)
- **Insert to Project** — вставляет файлы локально и коммитит через Git

---

### 6. **Rate Limiting & Modals**
- **Confirmation modals** — перед платными операциями (Flux API)
- **Rate limit display** — показывает оставшиеся запросы (3 generations / 12 hours)
- **Error handling** — понятные сообщения об ошибках без технических деталей

**Пример модалки:**
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Платный вызов Flux API</AlertDialogTitle>
      <AlertDialogDescription>
        Генерация изображения через Flux Ultra (~0.05 USD).
        У вас осталось X кредитов.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Отмена</AlertDialogCancel>
      <AlertDialogAction onClick={handleFluxGenerate}>
        Запустить
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 7. **Session Caching & Performance**
- **Intelligent caching** — кэширование проектов/чатов для быстрого доступа
- **Optimistic UI** — мгновенная реакция интерфейса (loading states)
- **Polling/WebSocket** — отслеживание статуса генерации в реальном времени

**Наша реализация:**
- **Jobs system** — `jobs/<id>.json` с состояниями `queued → running → done`
- **Polling** — `/api/jobs` для обновления прогресса
- **WebSocket** (опционально) — для real-time обновлений из ComfyUI

---

### 8. **Responsive Design**
- **Mobile-first** — работает на телефонах/планшетах
- **Collapsible panels** — боковые панели сворачиваются на малых экранах
- **Touch-friendly** — кнопки и контролы адаптированы для тач-интерфейса

**Tailwind breakpoints:**
```tsx
<div className="
  grid grid-cols-1 
  md:grid-cols-[250px_1fr] 
  lg:grid-cols-[250px_1fr_300px]
">
  {/* Left Drawer (скрыт на mobile) */}
  <aside className="hidden md:block">...</aside>
  
  {/* Center (всегда видим) */}
  <main>...</main>
  
  {/* Right Drawer (скрыт на tablet) */}
  <aside className="hidden lg:block">...</aside>
</div>
```

---

## Жизненный цикл генерации (v0 flow)

```
1. User enters prompt in Composer
   ↓
2. POST /api/generate → v0.chats.create({ message })
   ↓
3. Response: { chatId, demo: "https://...", files: [...] }
   ↓
4. Update UI:
   - Iframe src = demo URL (live preview)
   - File list = files array
   ↓
5. User clicks "Continue" or "Insert"
   ↓
6. Option A: Continue chat → v0.chats.sendMessage(chatId, newMessage)
   Option B: Insert → POST /api/site/insert → Git commit + PR
```

---

## Отличия нашего Builder от Simple v0

| Фича | Simple v0 | Orchestrator V6 |
|------|-----------|-----------------|
| **Генерация UI** | v0 API (облако) | v0 API (облако) ✅ |
| **Генерация медиа** | ❌ | FLUX (облако) + ComfyUI (локально) ✅ |
| **Workflow** | Prompt → Demo URL | Prompt → Queue → Canvas/Preview ✅ |
| **Файлы** | Список файлов | Вставка в проект + PR ✅ |
| **Сервисы** | Только v0 | ComfyUI Start/Stop, Flux, v0 ✅ |
| **Queue** | Нет | Система задач с прогрессом ✅ |
| **Codemods** | Нет | Replace buttons, Design tokens ✅ |
| **Tilda Import** | Нет | HTML → Next.js конвертация ✅ |
| **Screenshots** | Нет | Playwright regression tests ✅ |
| **Git** | Manual | MCP автоматизация (Open PR из UI) ✅ |

---

## UI Layout (итоговая структура)

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: [Composer Input] [/ui /img] [Generate] [Run]     │
├─────────┬───────────────────────────────────┬───────────────┤
│  Left   │         Center                    │    Right      │
│ Drawer  │                                   │   Drawer      │
│         │  ┌─────────────────────────────┐  │               │
│ Assets  │  │  Tabs:                      │  │  Controls:    │
│  - imgs │  │  • Preview (iframe)         │  │  • Generate   │
│  - vids │  │  • Canvas (grid)            │  │  • UI Code    │
│         │  │  • Diff/PR                  │  │  • Tokens     │
│ Tree    │  └─────────────────────────────┘  │  • Codemods   │
│  - /    │                                   │               │
│  - /app │                                   │               │
│         │                                   │               │
│ Queue   │                                   │               │
│  #1 ⚡  │                                   │               │
│  #2 ⏳  │                                   │               │
└─────────┴───────────────────────────────────┴───────────────┘
```

---

## Технологический стек (как Simple v0)

- **Framework:** Next.js 15 App Router
- **Runtime:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **API Integration:** v0-sdk + наши коннекторы (Flux, ComfyUI)
- **Fonts:** Geist Sans / Geist Mono

---

## Критерии приёмки UX-паттернов

✅ Единая строка Composer с slash-командами  
✅ Live Preview в iframe (v0 demo URL)  
✅ Canvas для грид-превью медиа (F:\Drop\out)  
✅ File list с кнопками Insert/Download  
✅ Confirmation modals перед платными вызовами (Flux)  
✅ Queue с прогрессом задач (polling)  
✅ Responsive layout (collapsible drawers)  
✅ One-click PR creation (через MCP)  

---

## Следующие шаги

1. ✅ Создать `docs/v0-ux-notes.md` (этот файл)
2. 🔄 Реализовать `apps/admin/app/builder/page.tsx` (layout)
3. 🔄 Добавить `<Composer>` компонент (slash-команды)
4. 🔄 Интегрировать v0 SDK в `/api/v0` (streaming)
5. 🔄 Canvas для результатов генерации (грид + лайтбокс)
6. 🔄 Jobs Queue UI (Run/Cancel/Progress)

---

**Ссылки на референсы в коде:**  
См. JSDoc комментарии в:
- `apps/admin/app/api/v0/route.ts` (v0 Platform API wrapper)
- `apps/admin/app/builder/page.tsx` (UI layout)
- `apps/admin/components/composer.tsx` (Composer component)
