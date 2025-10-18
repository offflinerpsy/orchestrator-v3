import { NextResponse } from 'next/server';

type V0File = { name?: string; path?: string; content: string };

export async function POST(req: Request) {
  const { slug, files } = (await req.json().catch(() => ({}))) as { slug?: string; files?: V0File[] };
  if (!slug || !/^[a-z0-9\-_]+$/i.test(slug)) {
    return NextResponse.json({ ok: false, error: 'invalid slug' }, { status: 400 });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ ok: false, error: 'no files' }, { status: 400 });
  }

  const { mkdir, writeFile } = await import('fs/promises');
  const { join } = await import('path');

  const root = join(process.cwd(), '../../'); // C:\Work\Orchestrator
  const artifactsDir = join(root, 'docs/_artifacts/v0');
  await mkdir(artifactsDir, { recursive: true });

  const manifestPath = join(artifactsDir, `preview-${slug}.json`);
  await writeFile(manifestPath, JSON.stringify({ slug, files, savedAt: new Date().toISOString() }, null, 2), 'utf-8');

  // If any HTML file exists, save a merged preview HTML for iframe srcdoc
  const htmlFile = files.find(f => (f.name || f.path || '').endsWith('.html'));
  if (htmlFile) {
    const htmlPath = join(artifactsDir, `preview-${slug}.html`);
    await writeFile(htmlPath, htmlFile.content, 'utf-8');
  }

  return NextResponse.json({ ok: true, artifact: manifestPath.replaceAll('\\', '/') });
}
