/**
 * Прокси для ComfyUI /interrupt эндпоинта
 * Прерывание текущей генерации
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

export async function POST() {
  try {
    const response = await fetch(`${COMFY_URL}/interrupt`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json(
        { error: `ComfyUI ошибка: ${error}` },
        { status: response.status }
      );
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('[COMFY PROXY] /interrupt error:', error);
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    );
  }
}
