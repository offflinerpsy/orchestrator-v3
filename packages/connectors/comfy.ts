/**
 * ComfyUI API Connector
 * 
 * Документация: https://github.com/comfyanonymous/ComfyUI/wiki/API
 */

export interface ComfyGenerateParams {
  workflow: 'sdxl-i2i' | 'sd35-i2i' | 'svd-i2v';
  prompt: string;
  sourceImage: string; // Path or URL
  denoise?: number; // 0-1 (для i2i)
  steps?: number;
  cfg?: number;
  ipadapterWeight?: number;
  controlnetDepth?: boolean;
  // SVD params
  frames?: number;
  fps?: number;
  motionScale?: number;
}

export interface ComfyResult {
  success: boolean;
  imagePath?: string;
  videoPath?: string;
  error?: string;
  promptId?: string;
}

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';

/**
 * Загрузка workflow JSON из F:\Workflows\
 */
async function loadWorkflow(name: string): Promise<any> {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  
  const workflowPath = join('F:\\Workflows', `${name}.json`);
  const content = await readFile(workflowPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Генерация через ComfyUI
 */
export async function generateWithComfyUI(params: ComfyGenerateParams): Promise<ComfyResult> {
  try {
    // Проверка доступности ComfyUI
    const healthCheck = await fetch(`${COMFYUI_URL}/system_stats`, { signal: AbortSignal.timeout(2000) });
    if (!healthCheck.ok) {
      return { success: false, error: 'ComfyUI не доступен. Запустите F:\\ComfyUI\\run_nvidia_gpu.bat' };
    }
    
    // Загрузка workflow
    const workflow = await loadWorkflow(params.workflow);
    
    // Модификация workflow с параметрами
    applyParams(workflow, params);
    
    console.log('[ComfyUI] Отправка workflow:', params.workflow);
    
    // POST /prompt
    const response = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `ComfyUI error: ${response.status} — ${error}` };
    }
    
    const data = await response.json();
    const promptId = data.prompt_id;
    
    console.log(`[ComfyUI] Prompt ID: ${promptId}, ожидание завершения...`);
    
    // Polling (в реальности используем WebSocket /ws для прогресса)
    const result = await pollComfyResult(promptId);
    
    if (!result.success) {
      return result;
    }
    
    console.log(`[ComfyUI] ✅ Завершено`);
    
    return result;
    
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Применение параметров к workflow JSON
 */
function applyParams(workflow: any, params: ComfyGenerateParams) {
  // Ищем ноды по типу (KSampler, LoadImage, CLIPTextEncode и т.д.)
  for (const [nodeId, node] of Object.entries<any>(workflow)) {
    // Prompt
    if (node.class_type === 'CLIPTextEncode' && node._meta?.title === 'Positive Prompt') {
      node.inputs.text = params.prompt;
    }
    
    // Source Image
    if (node.class_type === 'LoadImage') {
      node.inputs.image = params.sourceImage;
    }
    
    // Denoise
    if (node.class_type === 'KSampler' && params.denoise !== undefined) {
      node.inputs.denoise = params.denoise;
    }
    
    // Steps
    if (node.class_type === 'KSampler' && params.steps !== undefined) {
      node.inputs.steps = params.steps;
    }
    
    // CFG
    if (node.class_type === 'KSampler' && params.cfg !== undefined) {
      node.inputs.cfg = params.cfg;
    }
    
    // IP-Adapter Weight
    if (node.class_type === 'IPAdapterApply' && params.ipadapterWeight !== undefined) {
      node.inputs.weight = params.ipadapterWeight;
    }
    
    // SVD params
    if (node.class_type === 'SVD_img2vid_Conditioning') {
      if (params.frames !== undefined) node.inputs.video_frames = params.frames;
      if (params.fps !== undefined) node.inputs.fps = params.fps;
      if (params.motionScale !== undefined) node.inputs.motion_bucket_id = params.motionScale;
    }
  }
}

/**
 * Polling результата (упрощённо; лучше использовать WebSocket)
 */
async function pollComfyResult(promptId: string): Promise<ComfyResult> {
  const maxAttempts = 300; // 5 минут
  
  for (let i = 0; i < maxAttempts; i++) {
    // GET /history/{prompt_id}
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch history' };
    }
    
    const history = await response.json();
    
    if (history[promptId]?.status?.completed) {
      // Найти output в outputs
      const outputs = history[promptId].outputs;
      
      // Ищем SaveImage ноду
      for (const [nodeId, output] of Object.entries<any>(outputs)) {
        if (output.images && output.images.length > 0) {
          const filename = output.images[0].filename;
          const imagePath = `${COMFYUI_URL}/view?filename=${filename}`;
          
          // Скачать в F:\Drop\out
          const { downloadAndSave } = await import('./download');
          const localPath = `F:\\Drop\\out\\${filename}`;
          await downloadAndSave(imagePath, localPath);
          
          return {
            success: true,
            imagePath: localPath,
            promptId
          };
        }
        
        // Для видео (SVD)
        if (output.videos && output.videos.length > 0) {
          const filename = output.videos[0].filename;
          const videoPath = `${COMFYUI_URL}/view?filename=${filename}`;
          
          const { downloadAndSave } = await import('./download');
          const localPath = `F:\\Drop\\out\\${filename}`;
          await downloadAndSave(videoPath, localPath);
          
          return {
            success: true,
            videoPath: localPath,
            promptId
          };
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return { success: false, error: 'Timeout: exceeded 5 minutes' };
}
