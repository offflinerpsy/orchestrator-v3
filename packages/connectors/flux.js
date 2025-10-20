/**
 * BFL FLUX 1.1 Pro Ultra API Connector
 *
 * Документация: https://docs.bfl.ai/endpoints/flux-pro-1.1-ultra
 */
const BFL_API_URL = 'https://api.bfl.ai/v1';
/**
 * Загрузка изображения в base64
 */
async function loadImageAsBase64(source) {
    // URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
        const response = await fetch(source);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    }
    // Локальный файл
    const { readFile } = await import('fs/promises');
    const buffer = await readFile(source);
    return buffer.toString('base64');
}
/**
 * Генерация изображения через FLUX 1.1 Pro Ultra
 */
export async function generateWithFlux(params) {
    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'BFL_API_KEY not found in environment' };
    }
    try {
        const body = {
            prompt: params.prompt,
            raw: params.raw ?? true, // По умолчанию Ultra Mode
            aspect_ratio: params.aspectRatio ?? '16:9',
            output_format: 'jpeg'
        };
        if (params.seed !== undefined) {
            body.seed = params.seed;
        }
        // Image → Image
        if (params.image) {
            const base64Image = await loadImageAsBase64(params.image);
            body.image_prompt = base64Image;
            body.image_prompt_strength = params.imagePromptStrength ?? 0.35;
        }
        console.log('[FLUX] Отправка запроса:', {
            prompt: params.prompt,
            raw: body.raw,
            aspect_ratio: body.aspect_ratio,
            has_image_prompt: !!body.image_prompt,
            image_prompt_strength: body.image_prompt_strength
        });
        // POST /flux-pro-1.1-ultra
        const response = await fetch(`${BFL_API_URL}/flux-pro-1.1-ultra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-key': apiKey
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: `API error: ${response.status} — ${error}` };
        }
        const data = await response.json();
        const requestId = data.id;
        console.log(`[FLUX] Request ID: ${requestId}, polling...`);
        // Polling
        const result = await pollResult(requestId, apiKey);
        if (!result.success) {
            return result;
        }
        // Скачивание
        const { downloadAndSave } = await import('./download');
        const outputPath = params.outputPath ?? `F:\\Drop\\out\\flux_${Date.now()}.jpg`;
        await downloadAndSave(result.imageUrl, outputPath);
        console.log(`[FLUX] ✅ Saved to ${outputPath}`);
        return {
            success: true,
            imagePath: outputPath,
            requestId
        };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * Polling результата
 */
async function pollResult(requestId, apiKey) {
    const maxAttempts = 120; // 2 минуты (каждую секунду)
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(`${BFL_API_URL}/get_result?id=${requestId}`, {
            headers: { 'x-key': apiKey }
        });
        if (!response.ok) {
            return { success: false, error: `Polling error: ${response.status}` };
        }
        const data = await response.json();
        if (data.status === 'Ready') {
            return { success: true, imageUrl: data.result.sample };
        }
        if (data.status === 'Error') {
            return { success: false, error: data.error || 'Generation failed' };
        }
        // Pending — продолжаем
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return { success: false, error: 'Timeout: exceeded 120 seconds' };
}
//# sourceMappingURL=flux.js.map