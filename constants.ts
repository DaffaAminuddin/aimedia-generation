import type { ImageModelOption, VideoModelOption, AspectRatio, NumberOfVariations } from './types';

export const IMAGE_MODEL_OPTIONS: { id: ImageModelOption; name: string; modelName: string; }[] = [
  { id: 'imagen-4-fast', name: 'Imagen 4 Fast (Default)', modelName: 'imagen-4.0-fast-generate-001' },
  { id: 'imagen-4', name: 'Imagen 4', modelName: 'imagen-4.0-generate-001' },
];

export const VIDEO_MODEL_OPTIONS: { id: VideoModelOption; name: string; modelName: string; }[] = [
  { id: 'veo-3-fast-preview', name: 'VEO 3 Fast Preview (Default)', modelName: 'veo-3.0-fast-generate-preview' },
  { id: 'veo-3-preview', name: 'VEO 3 Preview', modelName: 'veo-3.0-generate-preview' },
  { id: 'veo-2', name: 'VEO 2', modelName: 'veo-2.0-generate-001' },
];


export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

export const VARIATION_OPTIONS: NumberOfVariations[] = [1, 2, 5, 10];

export const BASE_STYLE_OPTIONS: { label: string; value: string; }[] = [
  { label: 'Cinematic', value: 'Cinematic, photorealistic, 4K animated, Pixar style' },
  { label: 'Documentary', value: 'Documentary style, handheld' },
  { label: 'Dreamy', value: 'Dreamy, soft focus, ethereal' },
  { label: 'Noir', value: 'Noir, black and white, high contrast' },
  { label: 'Vibrant', value: 'Vibrant, colorful, saturated' },
  { label: 'Minimalist', value: 'Minimalist, clean, modern' },
  { label: 'Vintage', value: 'Vintage, retro, film grain' },
  { label: 'Surreal/Artistic', value: 'Surreal, artistic, abstract, Claymation, stop motion' },
  { label: 'Custom', value: 'custom' },
];

export const CAMERA_SETUP_OPTIONS: { label: string; value: string; }[] = [
    { label: 'Fixed Wide-Angle', value: 'Fixed wide-angle shot, no movement' },
    { label: 'Slow Zoom In', value: 'Slow zoom in' },
    { label: 'Overhead / Bird\'s Eye', value: 'Overhead shot, bird\'s eye view' },
    { label: 'Low Angle', value: 'Low angle shot, looking up' },
    { label: 'Handheld', value: 'Handheld, slight movement' },
    { label: 'Dolly Shot', value: 'Smooth dolly-in from wide to medium shot' },
    { label: 'Tracking Shot', value: 'Camera tracks alongside the characters as they walk' },
    { label: 'Crane Movement', value: 'High crane shot descending to eye level' },
    { label: 'Handheld (Documentary)', value: 'Subtle handheld camera movement for documentary feel' },
    { label: 'Gimbal Stabilized', value: 'Smooth gimbal movement following the action' },
    { label: 'Custom', value: 'custom' },
];
