'use client';

import { useEffect, useState } from 'react';

interface CheckStatus {
  comfyui: boolean;
  flux: boolean;
  hf: boolean;
  models: boolean;
  timestamp?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<CheckStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/selfcheck')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch status:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Orchestrator V3 — Status</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ComfyUI */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${status?.comfyui ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="font-semibold">ComfyUI</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {status?.comfyui ? 'Online (http://127.0.0.1:8188)' : 'Offline — запустите F:\\ComfyUI\\run_nvidia_gpu.bat'}
          </p>
        </div>

        {/* Flux API */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${status?.flux ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="font-semibold">Flux API</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {status?.flux ? 'BFL_API_KEY найден' : 'BFL_API_KEY не найден в .env.local'}
          </p>
        </div>

        {/* HF Token */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${status?.hf ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="font-semibold">HuggingFace</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {status?.hf ? 'HF_TOKEN найден (read-only)' : 'HF_TOKEN не найден в .env.local'}
          </p>
        </div>

        {/* Models */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${status?.models ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <h3 className="font-semibold">Models Path</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {status?.models ? 'paths.json найден (F:\\Models)' : 'paths.json не найден'}
          </p>
        </div>
      </div>

      <div className="mt-8 p-6 border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Быстрый старт</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Запустить ComfyUI</h3>
            <code className="block bg-muted p-2 rounded">
              F:\ComfyUI\run_nvidia_gpu.bat
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Импортировать модели (если ещё не сделано)</h3>
            <code className="block bg-muted p-2 rounded">
              cd C:\Work\Orchestrator<br/>
              node scripts/import-models.mjs
            </code>
            <p className="text-muted-foreground mt-1">
              ⚠️ Сначала примите лицензии на HuggingFace (SD3.5, SVD)
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Проверить пути</h3>
            <code className="block bg-muted p-2 rounded">
              node scripts/paths-check.mjs
            </code>
          </div>
        </div>
      </div>

      {status?.timestamp && (
        <div className="mt-4 text-sm text-muted-foreground text-right">
          Последняя проверка: {new Date(status.timestamp).toLocaleString('ru-RU')}
        </div>
      )}
    </div>
  );
}
