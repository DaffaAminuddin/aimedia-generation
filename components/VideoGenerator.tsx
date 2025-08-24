import React, { useState, useEffect } from 'react';
import type { VideoModelOption } from '../types';
import { generateVideo } from '../services/geminiService';
import SettingsPanel from './SettingsPanel';
import PromptInput from './PromptInput';
import VideoDisplay from './VideoDisplay';
import CollectionPanel from './CollectionPanel';
import ImageInputPanel from './ImageInputPanel';
import { VIDEO_MODEL_OPTIONS } from '../constants';
import { sanitizeFilename, downloadFile } from '../utils';

interface VideoGeneratorProps {
  apiKey: string | null;
  initialImage: string | null;
  onClearInitialImage: () => void;
  initialPrompt: { content: string; isBulk: boolean } | null;
  onClearInitialPrompt: () => void;
  collection: string[];
  onAddToCollection: (url: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ 
  apiKey,
  initialImage, 
  onClearInitialImage, 
  initialPrompt,
  onClearInitialPrompt,
  collection, 
  onAddToCollection 
}) => {
  const [prompt, setPrompt] = useState<string>('A neon hologram of a cat driving a futuristic car at top speed on a rainy night in Neo-Tokyo');
  const [model, setModel] = useState<VideoModelOption>('veo-3-fast-preview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [imageForVideo, setImageForVideo] = useState<string | null>(null);
  const [bulkDelay, setBulkDelay] = useState<string>('40');

  useEffect(() => {
    if (initialImage) {
      setImageForVideo(initialImage);
      onClearInitialImage(); // Consume the prop after setting it
    }
  }, [initialImage, onClearInitialImage]);

  useEffect(() => {
    if (initialPrompt) {
        setPrompt(initialPrompt.content);
        setIsBulkMode(initialPrompt.isBulk);
        onClearInitialPrompt(); // Consume the prop
    }
  }, [initialPrompt, onClearInitialPrompt]);


  const handleGenerate = async () => {
    if (isLoading || !apiKey) {
      if (!apiKey) setError("Please set your Gemini API Key in the header before generating.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    setGenerationProgress(null);

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
          setGenerationProgress(progressText);
          const videoUrl = await generateVideo({ prompt: currentPrompt, model, image: imageForVideo, apiKey });
          
          const filename = `${sanitizeFilename(currentPrompt)}_${Date.now()}.mp4`;
          downloadFile(videoUrl, filename);

          setGeneratedVideo(videoUrl);
          onAddToCollection(videoUrl);
          
          if (i < prompts.length - 1) {
            const delaySeconds = parseInt(bulkDelay) || 40;
            setGenerationProgress(`Waiting ${delaySeconds}s...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(`Error on prompt ${i + 1} ("${currentPrompt.substring(0, 20)}..."): ${errorMessage}`);
          setIsLoading(false);
          setGenerationProgress(null);
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
        setGenerationProgress(null);
        const videoUrl = await generateVideo({ prompt, model, image: imageForVideo, apiKey });
        
        const filename = `${sanitizeFilename(prompt)}_${Date.now()}.mp4`;
        downloadFile(videoUrl, filename);

        setGeneratedVideo(videoUrl);
        onAddToCollection(videoUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    }

    setIsLoading(false);
    setGenerationProgress(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[480px] flex-shrink-0 flex flex-col gap-6">
        <SettingsPanel
          model={model}
          setModel={setModel}
          modelOptions={VIDEO_MODEL_OPTIONS}
          isLoading={isLoading}
          showAspectRatio={false}
          isBulkMode={isBulkMode}
          setIsBulkMode={setIsBulkMode}
          showBulkControls={true}
          bulkDelay={bulkDelay}
          setBulkDelay={setBulkDelay}
        />
        <ImageInputPanel
          image={imageForVideo}
          setImage={setImageForVideo}
          isLoading={isLoading}
        />
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          isLoading={isLoading || !apiKey}
          isBulkMode={isBulkMode}
          generationProgress={generationProgress}
        />
      </div>

      <div className="flex-1 lg:min-w-0 flex flex-col md:flex-row gap-8">
        <div className="flex-1 md:w-2/3">
          <VideoDisplay
            video={generatedVideo}
            isLoading={isLoading}
            error={error}
            generationProgress={generationProgress}
          />
        </div>
        <div className="md:w-1/3">
           <CollectionPanel 
             collection={collection} 
             mode="video"
             onSelect={(item) => setGeneratedVideo(item as string)}
             className="max-h-[60vh] md:max-h-full"
            />
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;