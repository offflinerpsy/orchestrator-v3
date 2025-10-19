import { NextResponse } from 'next/server';
import { createClient, type ChatDetail } from 'v0-sdk';

export const runtime = 'nodejs';
export const revalidate = 0;

type V0File = { path?: string; name?: string; content: string };
type ReqBody = { prompt?: string; refs?: string[]; slug?: string };

const V0_API_KEY = process.env.V0_API_KEY || '';

export async function POST(req: Request) {
  const { prompt, refs } = (await req.json()) as ReqBody;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ ok: false, error: 'prompt is required' }, { status: 400 });
  }

  if (!V0_API_KEY) {
    return NextResponse.json({
      ok: false,
      error: 'V0_API_KEY is missing in .env.local',
      hint: 'Add V0_API_KEY to .env.local and restart the dev server.'
    }, { status: 400 });
  }

  const v0 = createClient({ apiKey: V0_API_KEY });

  const message = [prompt.trim(), Array.isArray(refs) && refs.length ? `References: ${refs.join(', ')}` : ''].filter(Boolean).join('\n\n');

  const chat = await v0.chats.create({
    message,
    responseMode: 'sync',
    modelConfiguration: { modelId: 'v0-1.5-md' }
  }).catch((e: Error) => ({ error: e.message }));

  if ('error' in chat) {
    return NextResponse.json({
      ok: false,
      error: 'v0 API request failed',
      hint: chat.error
    }, { status: 502 });
  }

  const chatDetail = chat as ChatDetail;
  const files: V0File[] = chatDetail.files?.map((f: any) => ({ path: f.path, name: f.name, content: f.content || '' })) || [];

  return NextResponse.json({ ok: true, files, chatId: chatDetail.id, demo: chatDetail.demo });
}
