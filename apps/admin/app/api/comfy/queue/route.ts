/**
 * Прокси для ComfyUI /queue эндпоинта
 * Получение текущей очереди задач
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

export async function GET() {
  try {
    const response = await fetch(`${COMFY_URL}/queue`, {
      method: 'GET',
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
    console.error('[COMFY PROXY] /queue error:', error);
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    );
  }
}
