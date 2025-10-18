# Tilda → Next.js Import Feature

## Overview
Конвертер HTML-дампа Tilda CMS в React-компоненты Next.js с автоматической генерацией роутов.

## Architecture

### Components

#### 1. API Endpoint: `/api/tilda/import`
**Location:** `apps/admin/app/api/tilda/import/route.ts`

**Flow:**
```
POST /api/tilda/import
  ↓
Parse HTML files from dump folder
  ↓
Extract Tilda blocks (div[id^="rec"])
  ↓
Generate React components for each block
  ↓
Create Next.js page.tsx for each Tilda page
  ↓
Save mapping artifact to docs/_artifacts/tilda-import/
  ↓
Return { ok, pages, componentsGenerated, routesGenerated }
```

**Input Schema:**
```typescript
{
  dumpPath?: string  // Default: TILDA_DUMP_PATH from env
}
```

**Output Schema:**
```typescript
{
  ok: boolean;
  pages?: TildaPage[];
  componentsGenerated?: number;
  routesGenerated?: number;
  error?: string;
  hint?: string;
}
```

#### 2. UI Page: `/site/import`
**Location:** `apps/admin/app/site/import/page.tsx`

**Features:**
- Input field for dump folder path (default: C:\Users\Makkaroshka\Desktop\aswad\сайт\content\tilda\)
- Convert button with loading state
- Error/success alerts
- Mapping preview table (Source File → Page Title → Next.js Route → Blocks count)

**State Management:**
- `dumpPath`: string (user-editable)
- `status`: 'idle' | 'loading' | 'success' | 'error'
- `result`: ImportResult (API response)
- `mapping`: PageMapping[] (formatted for table display)

### Conversion Logic

#### HTML Parsing (node-html-parser)
```typescript
const root = parse(html);
const blockElements = root.querySelectorAll('[id^="rec"]');
```

**Tilda Block Structure:**
- `id`: rec{digits} (e.g., rec1100273251)
- `data-record-type`: Block type identifier
- Inner HTML: Complete block markup

#### React Component Generation
Each Tilda block → separate React component in `_components/block-{n}.tsx`:
```typescript
export function HeaderBlock0() {
  return (
    <div 
      id="rec1100273251" 
      data-record-type="396"
      dangerouslySetInnerHTML={{ __html: `...` }}
    />
  );
}
```

**Rationale for `dangerouslySetInnerHTML`:**
- Preserves Tilda CSS classes and inline styles
- Maintains Tilda scripts and event handlers
- Avoids manual React-ification of complex DOM structures
- Quick path from static export to live Next.js app

#### Next.js Page Generation
```typescript
// apps/site/app/(tilda)/header/page.tsx
import { HeaderBlock0 } from './_components/block-0';
import { HeaderBlock1 } from './_components/block-1';

export default function HeaderPage() {
  return (
    <main className="tilda-page" data-tilda-slug="header">
      <HeaderBlock0 />
      <HeaderBlock1 />
    </main>
  );
}

export const metadata = {
  title: 'Header',
  description: 'Imported from Tilda: header',
};
```

### Route Mapping

#### Tilda Page → Next.js Route
| Tilda File | Slug | Next.js Route |
|---|---|---|
| header.html | header | apps/site/app/(tilda)/header/page.tsx |
| company.html | company | apps/site/app/(tilda)/company/page.tsx |
| contacts.html | contacts | apps/site/app/(tilda)/contacts/page.tsx |

**(tilda)** route group used for:
- Isolation from other site sections
- Shared Tilda assets layout (CSS/JS from dump)
- SEO-friendly URLs without `/tilda/` prefix

### Artifacts

Generated mapping saved to:
```
docs/_artifacts/tilda-import/import-{timestamp}.json
```

**Schema:**
```json
{
  "timestamp": "2025-01-29T12:34:56.789Z",
  "dumpPath": "C:\\Users\\...\\content\\tilda\\",
  "pagesProcessed": 15,
  "componentsGenerated": 87,
  "routesGenerated": 15,
  "pages": [
    {
      "slug": "header",
      "title": "Header",
      "route": "/(tilda)/header",
      "blocks": 6,
      "sourceFile": "header.html"
    }
  ]
}
```

## Usage

### 1. Via Admin UI
1. Navigate to http://localhost:3000/site/import
2. Verify dump path: `C:\Users\Makkaroshka\Desktop\aswad\сайт\content\tilda\`
3. Click **Convert**
4. Review mapping preview
5. Check generated files in `apps/site/app/(tilda)/`

### 2. Via API
```bash
curl -X POST http://localhost:3000/api/tilda/import \
  -H "Content-Type: application/json" \
  -d '{"dumpPath":"C:\\Users\\Makkaroshka\\Desktop\\aswad\\сайт\\content\\tilda\\"}'
```

## Known Limitations

1. **Static HTML Only**: No server-side Tilda logic (forms, CRM, etc.)
2. **Asset Paths**: Tilda assets must be copied manually to `public/tilda/` or served from dump folder
3. **Script Execution**: Tilda JS may require browser compatibility fixes
4. **Responsive Breakpoints**: Tilda media queries preserved as-is (may conflict with Tailwind)
5. **SEO Metadata**: Only basic title/description extracted; meta tags from Tilda `<head>` lost

## Future Improvements

- [ ] Asset pipeline: Auto-copy CSS/JS/images from dump to Next.js public/
- [ ] Script sanitization: Parse and adapt Tilda scripts for React lifecycle
- [ ] Component extraction: Identify reusable blocks (header/footer/forms) for shared components
- [ ] Style isolation: Scope Tilda CSS to `.tilda-page` to avoid global pollution
- [ ] Incremental conversion: Only convert changed pages on re-import

## Dependencies

- `node-html-parser@7.0.1`: Lightweight HTML parser (no DOM emulation overhead)
- Next.js 15: App Router for file-system routing
- React 19: Client components for `dangerouslySetInnerHTML`

## Testing Checklist

- [ ] Import 15 Tilda pages from dump
- [ ] Verify all routes accessible at `/header`, `/company`, `/contacts`, etc.
- [ ] Check Tilda CSS/JS load correctly (assets copied to public/)
- [ ] Test responsive layout on mobile/tablet/desktop
- [ ] Validate metadata appears in `<head>`
- [ ] Confirm mapping artifact generated in docs/_artifacts/

---

**Last Updated:** 2025-01-29  
**Status:** ✅ Implementation complete, ready for testing
