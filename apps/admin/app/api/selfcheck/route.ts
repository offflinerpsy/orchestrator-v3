import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  const checks = {
    comfyui: false,
    flux: false,
    hf: false,
    models: false,
    timestamp: new Date().toISOString()
  };

  // 1. ComfyUI check
  try {
    const comfyUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    const res = await fetch(`${comfyUrl}/system_stats`, { 
      signal: AbortSignal.timeout(2000) 
    });
    checks.comfyui = res.ok;
  } catch {}

  // 2. Flux API key
  checks.flux = !!process.env.BFL_API_KEY;

  // 3. HF Token
  checks.hf = !!process.env.HF_TOKEN;

  // 4. Models (check paths.json)
  try {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const pathsFile = join(process.cwd(), '../../paths.json');
    const content = await readFile(pathsFile, 'utf-8');
    const paths = JSON.parse(content);
    checks.models = !!paths.modelsRoot;
  } catch {}

  return NextResponse.json(checks);
}
