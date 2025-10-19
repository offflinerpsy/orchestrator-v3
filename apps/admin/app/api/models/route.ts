import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

type PathsSchema = {
  modelsRoot?: string;
  models?: { root?: string };
};

export async function GET() {
  const out: any = {
    ok: false,
    comfyui: { online: false, url: process.env.COMFYUI_URL || 'http://127.0.0.1:8188' },
    modelsRoot: null as string | null,
    checkpoints: [] as string[],
    hint: '' as string,
    timestamp: new Date().toISOString(),
  };

  // 1) Read models root from paths.json
  try {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const pathsFile = join(process.cwd(), '../../paths.json');
    const content = await readFile(pathsFile, 'utf-8');
    const paths: PathsSchema = JSON.parse(content);
    out.modelsRoot = paths.modelsRoot || paths.models?.root || null;
  } catch {}

  // 2) Try to query ComfyUI for object_info → checkpoint options (через прокси)
  const base = out.comfyui.url;
  try {
    // Можно использовать прямой вызов или через /api/comfy/models (если создадим отдельный эндпоинт)
    const res = await fetch(`${base}/object_info`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      const opts = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
      if (Array.isArray(opts)) out.checkpoints = opts;
      out.comfyui.online = true;
      out.ok = true;
    }
  } catch {}

  if (!out.ok) {
    out.hint = [
      'ComfyUI офлайн или недоступен.',
      'Как включить:',
      '1) Запустите: F:\\ComfyUI\\run_nvidia_gpu.bat',
      `2) Откройте: ${out.comfyui.url}`,
      '3) В UI: Settings → Scan models (если список пуст)',
    ].join('\n');
  }

  return NextResponse.json(out);
}
