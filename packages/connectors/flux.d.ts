/**
 * BFL FLUX 1.1 Pro Ultra API Connector
 *
 * Документация: https://docs.bfl.ai/endpoints/flux-pro-1.1-ultra
 */
export interface FluxGenerateParams {
    prompt: string;
    image?: string;
    imagePromptStrength?: number;
    raw?: boolean;
    aspectRatio?: string;
    seed?: number;
    outputPath?: string;
}
export interface FluxResult {
    success: boolean;
    imagePath?: string;
    error?: string;
    requestId?: string;
}
/**
 * Генерация изображения через FLUX 1.1 Pro Ultra
 */
export declare function generateWithFlux(params: FluxGenerateParams): Promise<FluxResult>;
//# sourceMappingURL=flux.d.ts.map