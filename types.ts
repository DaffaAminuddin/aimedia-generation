export type AppMode = 'image' | 'video' | 'image-to-video' | 'prompt';

export type ImageModelOption = 'imagen-4' | 'imagen-4-fast';
export type VideoModelOption = 'veo-2' | 'veo-3-preview' | 'veo-3-fast-preview';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type NumberOfVariations = 1 | 2 | 5 | 10;

export interface GenerateImageParams {
  prompt: string;
  model: ImageModelOption;
  aspectRatio: AspectRatio;
  apiKey: string;
}

export interface GenerateVideoParams {
  prompt: string;
  model: VideoModelOption;
  apiKey: string;
  image?: string | null;
}

export interface ImageToVideoResult {
  image: string;
  video: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface StructuredPromptParams {
  idea: string;
  style: string;
  camera: string;
  apiKey: string;
  negatives?: string;
  isJson: boolean;
  numberOfVariations: NumberOfVariations;
}
