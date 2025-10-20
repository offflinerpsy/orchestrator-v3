/**
 * ComfyUI API Connector
 *
 * Документация: https://github.com/comfyanonymous/ComfyUI/wiki/API
 */
export interface ComfyGenerateParams {
    workflow: 'sdxl-i2i' | 'sd35-i2i' | 'svd-i2v';
    prompt: string;
    sourceImage: string;
    denoise?: number;
    steps?: number;
    cfg?: number;
    ipadapterWeight?: number;
    controlnetDepth?: boolean;
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
/**
 * Генерация через ComfyUI
 */
export declare function generateWithComfyUI(params: ComfyGenerateParams): Promise<ComfyResult>;
//# sourceMappingURL=comfy.d.ts.map