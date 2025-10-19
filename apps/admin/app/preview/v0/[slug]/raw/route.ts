import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

function filePath(slug: string) {
  return path.join(process.cwd(), 'docs', '_artifacts', 'v0', `preview-${slug}.html`);
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = filePath(slug);
  const buf = await fs.readFile(file).catch(() => null as Buffer | null);
  if (!buf) return NextResponse.json({ ok: false, error: 'Preview not found' }, { status: 404 });
  const html = buf.toString('utf8');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
