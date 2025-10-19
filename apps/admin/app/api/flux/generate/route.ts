/**
 * Прокси для FLUX API /flux-pro-1.1-ultra
 * ВАЖНО: платный эндпоинт, требует подтверждения перед вызовом
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const FLUX_API_URL = 'https://api.bfl.ai/v1';
const BFL_API_KEY = process.env.BFL_API_KEY;

export async function POST(request: Request) {
  try {
    if (!BFL_API_KEY) {
      return Response.json(
        { error: 'BFL_API_KEY не настроен в .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Валидация обязательных полей
    if (!body.prompt) {
      return Response.json(
        { error: 'Поле prompt обязательно' },
        { status: 400 }
      );
    }

    // Формируем запрос по спеке FLUX
    const payload = {
      prompt: body.prompt,
      width: body.width || 1024,
      height: body.height || 768,
      seed: body.seed,
      raw: body.raw || false,
      aspect_ratio: body.aspect_ratio,
      image_prompt: body.image_prompt,
      image_prompt_strength: body.image_prompt_strength,
      output_format: body.output_format || 'jpeg',
    };

    console.log('[FLUX PROXY] Запрос:', { prompt: payload.prompt.slice(0, 50), params: { ...payload, prompt: undefined } });

    const response = await fetch(`${FLUX_API_URL}/flux-pro-1.1-ultra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': BFL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[FLUX PROXY] Ошибка:', response.status, error);
      return Response.json(
        { error: `FLUX API ошибка: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[FLUX PROXY] Результат:', { id: data.id, polling_url: data.polling_url });

    return Response.json(data);
  } catch (error: any) {
    console.error('[FLUX PROXY] /generate error:', error);
    return Response.json(
      { error: `Ошибка генерации FLUX: ${error.message}` },
      { status: 500 }
    );
  }
}
