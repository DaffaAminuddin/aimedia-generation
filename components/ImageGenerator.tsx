import React, { useState } from 'react';
import type { ImageModelOption, AspectRatio } from '../types';
import { generateImage } from '../services/geminiService';
import SettingsPanel from './SettingsPanel';
import PromptInput from './PromptInput';
import ImageDisplay from './ImageDisplay';
import CollectionPanel from './CollectionPanel';
import { IMAGE_MODEL_OPTIONS } from '../constants';
import { sanitizeFilename, downloadFile } from '../utils';

interface ImageGeneratorProps {
  apiKey: string | null;
  onSendToVideo: (imageData: string) => void;
  collection: string[];
  onAddToCollection: (url: string) => void;
  // State lifted to App.tsx
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  progress: string | null;
  setProgress: (progress: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  result: string | null;
  setResult: (result: string | null) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  apiKey, 
  onSendToVideo, 
  collection, 
  onAddToCollection,
  isLoading,
  setIsLoading,
  progress,
  setProgress,
  error,
  setError,
  result,
  setResult,
}) => {
  const [prompt, setPrompt] = useState<string>('A high-detail, photorealistic image of a majestic lion with a golden mane, staring intently at the camera. The background is a blurry savanna at sunset.');
  const [model, setModel] = useState<ImageModelOption>('imagen-4-fast');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (isLoading || !apiKey) {
        if (!apiKey) setError("Please set your Gemini API Key in the header before generating.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    if (isBulkMode) {
      const prompts = prompt.split('\n').filter(p => p.trim() !== '');
       if (prompts.length === 0) {
        setError("Bulk mode is on, but no prompts were entered. Please enter one prompt per line.");
        setIsLoading(false);
        return;
      }
      
      for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        try {
          const progressText = `Generating ${i + 1}/${prompts.length}`;
          setProgress(progressText);
          const imageUrl = await generateImage({ prompt: currentPrompt, model, aspectRatio, apiKey });
          
          if (autoDownload) {
            const filename = `${sanitizeFilename(currentPrompt)}_${Date.now()}.jpeg`;
            downloadFile(imageUrl, filename);
          }

          setResult(imageUrl); // Show the latest one in main display
          onAddToCollection(imageUrl); // Add to collection

          if (i < prompts.length - 1) {
            setProgress(`Waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Short delay between bulk generations
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(`Error on prompt ${i + 1} ("${currentPrompt.substring(0, 20)}..."): ${errorMessage}`);
          setIsLoading(false);
          setProgress(null);
          return; // Stop on error
        }
      }
    } else {
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            setIsLoading(false);
            return;
        }
      try {
        setProgress(null);
        const imageUrl = await generateImage({ prompt, model, aspectRatio, apiKey });
        
        if (autoDownload) {
          const filename = `${sanitizeFilename(prompt)}_${Date.now()}.jpeg`;
          downloadFile(imageUrl, filename);
        }
        
        setResult(imageUrl);
        onAddToCollection(imageUrl);
      } catch (err)
        {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    }

    setIsLoading(false);
    setProgress(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[480px] flex-shrink-0 flex flex-col gap-6">
        <SettingsPanel
          model={model}
          setModel={setModel}
          modelOptions={IMAGE_MODEL_OPTIONS}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isLoading={isLoading}
          showAspectRatio={true}
          isBulkMode={isBulkMode}
          setIsBulkMode={setIsBulkMode}
          showBulkControls={true}
        />
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          isLoading={isLoading || !apiKey}
          isBulkMode={isBulkMode}
          generationProgress={progress}
        />
      </div>

      <div className="flex-1 lg:min-w-0 flex flex-col md:flex-row gap-8">
        <div className="flex-1 md:w-2/3">
          <ImageDisplay
            image={result}
            isLoading={isLoading}
            error={error}
            aspectRatio={aspectRatio}
            generationProgress={progress}
            onSendToVideo={onSendToVideo}
            prompt={prompt}
          />
        </div>
        <div className="md:w-1/3 flex flex-col">
           <div className="flex items-center justify-end mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <label htmlFor="auto-download-toggle" className="text-sm font-medium text-gray-300">Auto-Download Images</label>
                    <button
                        id="auto-download-toggle"
                        onClick={() => setAutoDownload(!autoDownload)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${autoDownload ? 'bg-purple-600' : 'bg-gray-600'}`}
                        aria-pressed={autoDownload}
                    >
                        <span className="sr-only">Toggle auto-download</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoDownload ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>
            </div>
           <CollectionPanel 
             collection={collection} 
             mode="image"
             onSelect={(item) => setResult(item as string)}
             className="flex-1 min-h-0" // Changed for flexbox behavior
            />
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;