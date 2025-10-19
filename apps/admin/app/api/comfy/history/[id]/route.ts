/**
 * Прокси для ComfyUI /history/:id эндпоинта
 * Получение истории задачи по prompt_id
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const response = await fetch(`${COMFY_URL}/history/${id}`, {
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
    console.error('[COMFY PROXY] /history error:', error);
    return Response.json(
      { error: `Не удалось подключиться к ComfyUI: ${error.message}` },
      { status: 503 }
    );
  }
}
