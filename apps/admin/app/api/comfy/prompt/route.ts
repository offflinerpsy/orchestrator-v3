/**
 * Прокси для ComfyUI /prompt эндпоинта
 * Убирает CORS, скрывает прямые запросы к 127.0.0.1:8188
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${COMFY_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json(
        { error: `ComfyUI ошибка: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error: any) {
    console.error('[COMFY PROXY] /prompt error:', error);
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    );
  }
}
