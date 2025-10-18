'use client';

import { useState } from 'react';

type V0File = { name?: string; path?: string; content: string };

export default function GenerateSitePage() {
  const [prompt, setPrompt] = useState('Create a responsive hero section with a headline, subhead and CTA button');
  const [refs, setRefs] = useState<string>('');
  const [insert, setInsert] = useState<boolean>(false);
  const [slug, setSlug] = useState<string>('hero');
  const [files, setFiles] = useState<V0File[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setBusy(true); setError(null); setFiles(null);
    const refsArr = refs.split(/\s+/).map(s => s.trim()).filter(Boolean);
    const res = await fetch('/api/v0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, refs: refsArr, slug })
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'Generation failed'); return; }
    setFiles(data.files || []);
  }

  async function onPreview() {
    if (!files || files.length === 0) return;
    const res = await fetch('/api/v0/artifact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, files })
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'Artifact save failed'); return; }
    window.open(`/preview/v0/${encodeURIComponent(slug)}`, '_blank');
  }

  async function onApply() {
    if (!files || files.length === 0) return;
    const list = files.map(f => f.path || f.name || '(unnamed)').join('\n');
    const msg = `Код будет перезаписан в apps/site/src/components/${slug}\n\nБудут затронуты файлы:\n${list}\n\nПродолжить?`;
    if (!window.confirm(msg)) return;
    const res = await fetch('/api/v0/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, files })
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'Apply failed'); return; }
    alert('Файлы применены. Скоммитьте изменения и откройте PR.\n' + (data.overwritten?.join('\n') || ''));
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Site → Generate (v0)</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea className="w-full p-2 border rounded bg-background" rows={5} value={prompt} onChange={e => setPrompt(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reference URLs (optional)</label>
            <input className="w-full p-2 border rounded bg-background" placeholder="https://... (space-separated)" value={refs} onChange={e => setRefs(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <input id="insert" type="checkbox" checked={insert} onChange={e => setInsert(e.target.checked)} />
            <label htmlFor="insert" className="text-sm">Вставить в apps/site/src/components/&lt;slug&gt;</label>
            <input className="ml-3 p-1 border rounded bg-background" placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} />
          </div>

          <button disabled={busy} onClick={onGenerate} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
            {busy ? 'Генерация…' : 'Сгенерировать'}
          </button>

          <div className="text-xs text-muted-foreground border rounded p-3">
            ⚠️ Внимание: если включена вставка, указанные файлы будут перезаписаны.
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Результат</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {!files && !error && <div className="text-muted-foreground">Нет данных</div>}
          {files && files.length === 0 && <div className="text-muted-foreground">Пусто</div>}
          {files && files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={onPreview} className="px-3 py-1 rounded bg-secondary text-secondary-foreground">Просмотр</button>
                {insert && (
                  <button onClick={onApply} className="px-3 py-1 rounded bg-destructive text-destructive-foreground">Применить</button>
                )}
              </div>
              {files.map((f, i) => (
                <details key={i} className="border rounded">
                  <summary className="px-3 py-2 text-sm bg-card flex items-center justify-between">
                    <span>{f.path || f.name || `file-${i+1}`}</span>
                  </summary>
                  <pre className="p-3 overflow-auto text-xs bg-background">{f.content}</pre>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
