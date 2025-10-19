import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

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
  const { join, dirname } = await import('path');

  const root = join(process.cwd(), '../../');
  const base = join(root, 'apps/site/src/components', slug);
  await mkdir(base, { recursive: true });

  const overwritten: string[] = [];
  for (const f of files) {
    const name = (f.path || f.name || '').split('/').pop();
    if (!name) continue;
    const target = join(base, name);
    await mkdir(dirname(target), { recursive: true });
    // we overwrite intentionally after warning on UI
    await writeFile(target, f.content, 'utf-8');
    overwritten.push(target.replaceAll('\\', '/'));
  }

  // Save artifact manifest
  const artifactsDir = join(root, 'docs/_artifacts/v0');
  await mkdir(artifactsDir, { recursive: true });
  const manifestPath = join(artifactsDir, `applied-${slug}.json`);
  await writeFile(manifestPath, JSON.stringify({ slug, files, overwritten, savedAt: new Date().toISOString() }, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, overwritten });
}
