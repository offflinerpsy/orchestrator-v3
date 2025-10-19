/**
 * Прокси для ComfyUI /object_info эндпоинта (расширенный)
 * Возвращает полную структуру доступных моделей
 */

export const runtime = 'nodejs';
export const revalidate = 0;

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

export async function GET() {
  try {
    const response = await fetch(`${COMFY_URL}/object_info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json(
        { error: `ComfyUI ошибка: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Извлекаем списки моделей для удобства
    const checkpoints = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
    const loras = data?.LoraLoader?.input?.required?.lora_name?.[0] || [];
    const controlnets = data?.ControlNetLoader?.input?.required?.control_net_name?.[0] || [];
    const vae = data?.VAELoader?.input?.required?.vae_name?.[0] || [];

    return Response.json({
      raw: data,
      models: {
        checkpoints,
        loras,
        controlnets,
        vae,
      },
      online: true,
    });
  } catch (error: any) {
    console.error('[COMFY PROXY] /object_info error:', error);
    return Response.json(
      {
        error: `Не удалось подключиться к ComfyUI: ${error.message}`,
        online: false,
        models: {
          checkpoints: [],
          loras: [],
          controlnets: [],
          vae: [],
        },
      },
      { status: 503 }
    );
  }
}
