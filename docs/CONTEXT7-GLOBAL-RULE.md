# Context7 MCP — Глобальное правило использования

## Статус установки
- ✅ **Репозиторий:** C:\Work\context7 (cloned from github.com/upstash/context7)
- ✅ **Build:** dist/index.js compiled successfully
- ✅ **Config:** %APPDATA%\Code\User\globalStorage\github.copilot-chat\modelContextProtocol.json
- ✅ **API Key:** ctx7sk-cfe7b2ec-ee89-4d42-ba6f-834aab27e928 (configured)
- ✅ **VS Code restart:** Completed by user (2025-10-20)
- ✅ **Global rule:** Added to russian.instructions.md

---

## Обязательное правило (для всех workspace)

**ПЕРЕД написанием кода с любой библиотекой/фреймворком:**
1. Запросить актуальные примеры через Context7 MCP
2. Использовать modern code patterns из Context7
3. Проверять актуальные API (не legacy/deprecated)

### Применяется к:
- ✅ Next.js (App Router, Server Components, Actions)
- ✅ React (Hooks, Suspense, новые patterns)
- ✅ TypeScript (latest features, strict mode)
- ✅ Node.js (ES Modules, async/await patterns)
- ✅ Express, Fastify и другие backend frameworks
- ✅ Testing libraries (Vitest, Playwright, Jest)
- ✅ UI libraries (shadcn/ui, Radix, TailwindCSS)

---

## Зачем это нужно?

### Проблема без Context7:
- Устаревший код из training data (до 2023)
- Deprecated APIs (например, Next.js Pages Router вместо App Router)
- Legacy patterns (классовые компоненты вместо Hooks)
- Не актуальные best practices

### С Context7:
- ✅ **Modern code:** Свежие примеры из 2024-2025
- ✅ **Актуальные API:** Next.js 15, React 19, TypeScript 5.x
- ✅ **Best practices:** Современные паттерны (Server Components, Server Actions)
- ✅ **Проверенный код:** Примеры из production-ready проектов

---

## Примеры использования

### ❌ БЕЗ Context7 (старый код):
```typescript
// Legacy Next.js Pages Router
export async function getServerSideProps() {
  const data = await fetch('...')
  return { props: { data } }
}

// Старый React pattern
class MyComponent extends React.Component {
  render() { return <div>...</div> }
}
```

### ✅ С Context7 (modern код):
```typescript
// Next.js 15 App Router with Server Components
export default async function Page() {
  const data = await fetch('...', { cache: 'no-store' })
  return <div>{data}</div>
}

// React 19 with Hooks
export function MyComponent() {
  const [state, setState] = useState()
  return <div>...</div>
}
```

---

## Workflow с Context7

### Перед написанием нового кода:
1. **Query Context7:** "Next.js 15 App Router server component with fetch"
2. **Review examples:** Проверить актуальные patterns
3. **Apply pattern:** Использовать modern код из примеров
4. **Verify:** Проверить что API не deprecated

### Примеры запросов:
- "Next.js 15 App Router dynamic routes"
- "React 19 Server Actions form submission"
- "TypeScript 5.x generic constraints"
- "Node.js 22 ES Modules import patterns"
- "shadcn/ui button component usage"
- "Vitest React component testing"

---

## Добавлено в russian.instructions.md

```markdown
- **Context7 MCP — ОБЯЗАТЕЛЬНО использовать** для всех библиотек/фреймворков. 
  Перед написанием кода с Next.js, React, TypeScript, Node.js и т.д. — 
  **сначала запросить актуальные примеры через Context7**. 
  Это обеспечивает modern code patterns и актуальные API.
```

**Это правило применяется ко ВСЕМ workspace в VS Code**, не только к Orchestrator.

---

## Верификация доступности

После перезапуска VS Code (выполнен пользователем 2025-10-20):
- Context7 MCP server должен быть доступен в Copilot Chat
- Tools должны автоматически подключаться при запросах к библиотекам
- Примеры будут modern и актуальные (2024-2025)

### Тест доступности:
```bash
# Проверка конфига
cat %APPDATA%\Code\User\globalStorage\github.copilot-chat\modelContextProtocol.json

# Проверка executable
node C:\Work\context7\dist\index.js --help
```

---

## FAQ

**Q: Когда НЕ нужно использовать Context7?**
A: Только для тривиального кода (console.log, простые переменные). Для всего остального — ОБЯЗАТЕЛЬНО.

**Q: Что если Context7 не отвечает?**
A: Fallback на standard code patterns, но это должно быть ИСКЛЮЧЕНИЕМ.

**Q: Применяется ли к другим проектам?**
A: ДА! Правило в russian.instructions.md с `applyTo: '**'` работает для ВСЕХ файлов во ВСЕХ workspace.

**Q: Нужно ли обновлять Context7?**
A: Периодически (раз в месяц): `cd C:\Work\context7 && git pull && npm install && npm run build`

---

## Подтверждение

✅ **Context7 MCP установлен и настроен**  
✅ **Глобальное правило добавлено в russian.instructions.md**  
✅ **Обязательно использовать ПЕРЕД написанием кода с библиотеками**  
✅ **Применяется ко всем workspace в VS Code**  
✅ **Обеспечивает modern code patterns и актуальные API**

**Дата:** 2025-10-20  
**Status:** ACTIVE  
**Scope:** GLOBAL (all workspaces)
