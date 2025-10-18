'use client';

import { useState } from 'react';

type ConversionStatus = 'idle' | 'loading' | 'success' | 'error';

type PageMapping = {
  slug: string;
  title: string;
  route: string;
  blocks: number;
  sourceFile: string;
};

type ImportResult = {
  ok: boolean;
  pages?: Array<{
    slug: string;
    title: string;
    blocks: Array<any>;
    sourceFile: string;
  }>;
  componentsGenerated?: number;
  routesGenerated?: number;
  error?: string;
  hint?: string;
};

export default function ImportTildaPage() {
  const [dumpPath, setDumpPath] = useState('C:\\Users\\Makkaroshka\\Desktop\\aswad\\сайт\\content\\tilda\\');
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mapping, setMapping] = useState<PageMapping[]>([]);

  const handleConvert = async () => {
    setStatus('loading');
    setResult(null);
    setMapping([]);

    try {
      const res = await fetch('/api/tilda/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dumpPath })
      });

      const data: ImportResult = await res.json();
      setResult(data);

      if (data.ok && data.pages) {
        const mappingData: PageMapping[] = data.pages.map(p => ({
          slug: p.slug,
          title: p.title,
          route: `/(tilda)/${p.slug}`,
          blocks: p.blocks.length,
          sourceFile: p.sourceFile
        }));
        setMapping(mappingData);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check console for details'
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            📁 Import Tilda → Next.js
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Convert Tilda HTML dump to Next.js React components
          </p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={dumpPath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDumpPath(e.target.value)}
            placeholder="Path to Tilda dump folder"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleConvert}
            disabled={status === 'loading' || !dumpPath}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? '⏳ Converting...' : 'Convert'}
          </button>
        </div>

        {status === 'error' && result && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <strong>❌ {result.error}</strong>
            {result.hint && <p className="text-sm mt-1">{result.hint}</p>}
          </div>
        )}

        {status === 'success' && result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
            <strong>✅ Conversion complete!</strong>
            <div className="flex gap-4 mt-2">
              <span className="px-2 py-1 bg-white border rounded text-sm">
                {result.routesGenerated} routes
              </span>
              <span className="px-2 py-1 bg-white border rounded text-sm">
                {result.componentsGenerated} components
              </span>
            </div>
          </div>
        )}
      </div>

      {mapping.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              📄 Mapping Preview
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {mapping.length} page{mapping.length > 1 ? 's' : ''} converted
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Source File</th>
                  <th className="text-left py-2 px-4">Page Title</th>
                  <th className="text-left py-2 px-4">Next.js Route</th>
                  <th className="text-right py-2 px-4">Blocks</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((m, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-xs">{m.sourceFile}</td>
                    <td className="py-2 px-4">{m.title}</td>
                    <td className="py-2 px-4 font-mono text-xs text-blue-600">
                      /site/app{m.route}/page.tsx
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {m.blocks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
