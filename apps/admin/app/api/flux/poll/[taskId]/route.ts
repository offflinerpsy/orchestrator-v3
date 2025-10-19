/**
 * Прокси для FLUX API polling
 * Опрос статуса задачи по task_id
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const BFL_API_KEY = process.env.BFL_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    if (!BFL_API_KEY) {
      return Response.json(
        { error: 'BFL_API_KEY не настроен в .env.local' },
        { status: 500 }
      );
    }

    const { taskId } = params;

    // FLUX polling URL обычно: https://api.bfl.ai/v1/get_result?id=<taskId>
    const response = await fetch(
      `https://api.bfl.ai/v1/get_result?id=${taskId}`,
      {
        method: 'GET',
        headers: {
          'X-Key': BFL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json(
        { error: `FLUX API ошибка: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Статусы: Ready, Pending, Request Moderated, Content Moderated, Error
    return Response.json({
      status: data.status,
      result: data.result, // URL изображения если Ready
      error: data.error,
    });
  } catch (error: any) {
    console.error('[FLUX PROXY] /poll error:', error);
    return Response.json(
      { error: `Ошибка опроса FLUX: ${error.message}` },
      { status: 500 }
    );
  }
}
