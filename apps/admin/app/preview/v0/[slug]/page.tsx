import fs from 'node:fs/promises';
import path from 'node:path';

type Props = { params: Promise<{ slug: string }> };

async function readPreviewHtml(slug: string): Promise<string | null> {
  const artifactsDir = path.join(process.cwd(), 'docs', '_artifacts', 'v0');
  const file = path.join(artifactsDir, `preview-${slug}.html`);
  try {
    const buf = await fs.readFile(file);
    return buf.toString('utf8');
  } catch (_) {
    return null;
  }
}

export default async function PreviewV0Page({ params }: Props) {
  const { slug } = await params;
  const html = await readPreviewHtml(slug);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Preview: {slug}</h1>
        <a
          href={`/preview/v0/${encodeURIComponent(slug)}/raw`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline opacity-80 hover:opacity-100"
        >
          Открыть в новой вкладке
        </a>
      </div>
      {!html ? (
        <div className="text-sm text-muted-foreground">
          Превью не найдено. Сначала сохраните артефакт через кнопку «Просмотр» на странице генерации.
        </div>
      ) : (
        <div className="border rounded overflow-hidden" style={{ height: '75vh' }}>
          <iframe
            title={`preview-${slug}`}
            src={`/preview/v0/${encodeURIComponent(slug)}/raw`}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
