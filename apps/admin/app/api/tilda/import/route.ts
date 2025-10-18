import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'node-html-parser';

type TildaBlock = {
  id: string;
  type: string;
  html: string;
  order: number;
};

type TildaPage = {
  slug: string;
  title: string;
  blocks: TildaBlock[];
  sourceFile: string;
};

type ImportResult = {
  ok: boolean;
  pages?: TildaPage[];
  componentsGenerated?: number;
  routesGenerated?: number;
  error?: string;
  hint?: string;
};

const TILDA_DUMP_PATH = process.env.TILDA_DUMP_PATH || 'C:\\Users\\Makkaroshka\\Desktop\\aswad\\сайт\\content\\tilda';
const SITE_APP_PATH = path.join(process.cwd(), '..', 'site', 'app', '(tilda)');

/**
 * Parse Tilda HTML and extract blocks
 */
function parseTildaPage(html: string, filename: string): TildaPage {
  const root = parse(html);
  const title = root.querySelector('title')?.text || filename.replace('.html', '');
  const slug = filename.replace('.html', '');

  const blockElements = root.querySelectorAll('[id^="rec"]');
  const blocks: TildaBlock[] = blockElements.map((el: any, idx: number) => ({
    id: el.getAttribute('id') || `block-${idx}`,
    type: el.getAttribute('data-record-type') || 'unknown',
    html: el.outerHTML,
    order: idx
  }));

  return { slug, title, blocks, sourceFile: filename };
}

/**
 * Convert Tilda block HTML to React component
 */
function blockToReactComponent(block: TildaBlock, pageName: string): string {
  // Simplified conversion: wrap in a server component
  const componentName = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Block${block.order}`;
  
  return `
export function ${componentName}() {
  return (
    <div 
      id="${block.id}" 
      data-record-type="${block.type}"
      dangerouslySetInnerHTML={{ __html: \`${block.html.replace(/`/g, '\\`')}\` }}
    />
  );
}
`.trim();
}

/**
 * Generate Next.js page from Tilda blocks
 */
function generateNextPage(page: TildaPage): string {
  const imports = page.blocks.map((_, idx) => 
    `import { ${page.slug.charAt(0).toUpperCase() + page.slug.slice(1)}Block${idx} } from './_components/block-${idx}';`
  ).join('\n');

  const blockRenders = page.blocks.map((_, idx) => 
    `      <${page.slug.charAt(0).toUpperCase() + page.slug.slice(1)}Block${idx} />`
  ).join('\n');

  return `
${imports}

export default function ${page.slug.charAt(0).toUpperCase() + page.slug.slice(1)}Page() {
  return (
    <main className="tilda-page" data-tilda-slug="${page.slug}">
${blockRenders}
    </main>
  );
}

export const metadata = {
  title: '${page.title}',
  description: 'Imported from Tilda: ${page.slug}',
};
`.trim();
}

export async function POST(req: Request) {
  const { dumpPath } = await req.json().catch(() => ({ dumpPath: TILDA_DUMP_PATH }));
  
  const tildaPath = dumpPath || TILDA_DUMP_PATH;

  if (!tildaPath || typeof tildaPath !== 'string') {
    return NextResponse.json({
      ok: false,
      error: 'dumpPath is required',
      hint: 'Provide the path to the Tilda dump folder in the request body'
    }, { status: 400 });
  }

  const stat = await fs.stat(tildaPath).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    return NextResponse.json({
      ok: false,
      error: 'Tilda dump folder not found',
      hint: `Path does not exist or is not a directory: ${tildaPath}`
    }, { status: 404 });
  }

  const files = await fs.readdir(tildaPath);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('page-'));

  if (htmlFiles.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'No Tilda HTML pages found',
      hint: `No .html files found in ${tildaPath}`
    }, { status: 404 });
  }

  const pages: TildaPage[] = [];
  let componentsGenerated = 0;
  let routesGenerated = 0;

  for (const file of htmlFiles) {
    const htmlPath = path.join(tildaPath, file);
    const html = await fs.readFile(htmlPath, 'utf-8');
    const page = parseTildaPage(html, file);
    pages.push(page);

    // Generate Next.js route
    const routeDir = path.join(SITE_APP_PATH, page.slug);
    const componentsDir = path.join(routeDir, '_components');
    
    await fs.mkdir(componentsDir, { recursive: true });

    // Generate page.tsx
    const pageContent = generateNextPage(page);
    await fs.writeFile(path.join(routeDir, 'page.tsx'), pageContent, 'utf-8');
    routesGenerated++;

    // Generate block components
    for (const block of page.blocks) {
      const componentContent = blockToReactComponent(block, page.slug);
      await fs.writeFile(
        path.join(componentsDir, `block-${block.order}.tsx`),
        componentContent,
        'utf-8'
      );
      componentsGenerated++;
    }
  }

  // Save mapping artifact
  const artifactDir = path.join(process.cwd(), 'docs', '_artifacts', 'tilda-import');
  await fs.mkdir(artifactDir, { recursive: true });
  
  const mapping = {
    timestamp: new Date().toISOString(),
    dumpPath: tildaPath,
    pagesProcessed: pages.length,
    componentsGenerated,
    routesGenerated,
    pages: pages.map(p => ({
      slug: p.slug,
      title: p.title,
      route: `/(tilda)/${p.slug}`,
      blocks: p.blocks.length,
      sourceFile: p.sourceFile
    }))
  };

  await fs.writeFile(
    path.join(artifactDir, `import-${Date.now()}.json`),
    JSON.stringify(mapping, null, 2),
    'utf-8'
  );

  return NextResponse.json({
    ok: true,
    pages,
    componentsGenerated,
    routesGenerated
  } as ImportResult);
}
