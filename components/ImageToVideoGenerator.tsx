import React, { useState } from 'react';
import type { ImageModelOption, AspectRatio, VideoModelOption, ImageToVideoResult } from '../types';
import { generateImage, generateVideo } from '../services/geminiService';
import ImageToVideoSettings from './ImageToVideoSettings';
import CollectionPanel from './CollectionPanel';
import { GenerateIcon, ErrorIcon, ImageToVideoIcon, DownloadIcon } from './icons';
import { downloadFile, sanitizeFilename } from '../utils';

interface ImageToVideoGeneratorProps {
  apiKey: string | null;
  collection: ImageToVideoResult[];
  onAddToCollection: (result: ImageToVideoResult) => void;
  // State lifted to App.tsx
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  progress: string | null;
  setProgress: (progress: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  result: ImageToVideoResult | null;
  setResult: (result: ImageToVideoResult | null) => void;
}

const ImageToVideoGenerator: React.FC<ImageToVideoGeneratorProps> = ({ 
  apiKey, 
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
  const [imagePrompt, setImagePrompt] = useState<string>('A photorealistic image of a single red rose on a black background, with a single drop of dew on a petal');
  const [videoPrompt, setVideoPrompt] = useState<string>('The dew drop slowly rolls down the petal of the rose, camera follows the drop');
  const [imageModel, setImageModel] = useState<ImageModelOption>('imagen-4-fast');
  const [videoModel, setVideoModel] = useState<VideoModelOption>('veo-3-fast-preview');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkDelay, setBulkDelay] = useState<string>('40');

  const handleGenerate = async () => {
    if (isLoading || !apiKey) {
      if (!apiKey) setError("Please set your Gemini API Key in the header before generating.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    const imagePrompts = isBulkMode ? imagePrompt.split('\n').filter(p => p.trim()) : [imagePrompt.trim()].filter(p => p.trim());
    const videoPrompts = isBulkMode ? videoPrompt.split('\n').filter(p => p.trim()) : [videoPrompt.trim()].filter(p => p.trim());

    if (imagePrompts.length === 0 || videoPrompts.length === 0) {
      setError("Please enter at least one image and one video prompt.");
      setIsLoading(false);
      return;
    }
    if (isBulkMode && imagePrompts.length !== videoPrompts.length) {
      setError("The number of image prompts must match the number of video prompts in bulk mode.");
      setIsLoading(false);
      return;
    }
    
    for (let i = 0; i < imagePrompts.length; i++) {
      const currentImagePrompt = imagePrompts[i];
      const currentVideoPrompt = videoPrompts[i] || videoPrompts[0];

      try {
        const progressPrefix = isBulkMode ? `(${i + 1}/${imagePrompts.length}) ` : '';
        setProgress(`${progressPrefix}Generating image...`);
        const imageUrl = await generateImage({ prompt: currentImagePrompt, model: imageModel, aspectRatio, apiKey });

        setProgress(`${progressPrefix}Generating video...`);
        const videoUrl = await generateVideo({ prompt: currentVideoPrompt, model: videoModel, image: imageUrl, apiKey });
        
        const imageFilename = `${sanitizeFilename(currentImagePrompt)}_${Date.now()}.jpeg`;
        downloadFile(imageUrl, imageFilename);
        const videoFilename = `${sanitizeFilename(currentVideoPrompt)}_${Date.now()}.mp4`;
        downloadFile(videoUrl, videoFilename);

        const resultPair = { image: imageUrl, video: videoUrl, imagePrompt: currentImagePrompt, videoPrompt: currentVideoPrompt };
        
        setResult(resultPair);
        onAddToCollection(resultPair);
        
        if (i < imagePrompts.length - 1) {
            const delaySeconds = parseInt(bulkDelay) || 40;
            setProgress(`Waiting ${delaySeconds}s...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Error on set ${i + 1} ("${currentImagePrompt.substring(0, 20)}..."): ${errorMessage}`);
        setIsLoading(false);
        setProgress(null);
        return;
      }
    }

    setIsLoading(false);
    setProgress(null);
  };

  const handleDownload = (url: string, prompt: string, extension: 'jpeg' | 'mp4') => {
      const filename = `${sanitizeFilename(prompt)}_${Date.now()}.${extension}`;
      downloadFile(url, filename);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-pulse-fast p-4">
            <ImageToVideoIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium text-lg">{progress || 'Starting generation...'}</p>
            <p className="text-sm text-gray-500">This may take a few minutes per video.</p>
        </div>
      );
    }
     if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 bg-red-900/20 rounded-lg">
          <ErrorIcon className="w-16 h-16 mb-4" />
          <p className="font-bold text-lg">Oops! Something went wrong.</p>
          <p className="text-sm text-center text-red-300 max-w-md">{error}</p>
        </div>
      );
    }
    if(result) {
        return (
            <div className="w-full h-full p-4 bg-gray-800/40 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Result */}
                    <div className="space-y-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                            <img src={result.image} alt={`Generated image for: ${result.imagePrompt}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 text-xs text-gray-400 leading-snug break-words">
                                <span className='font-semibold text-gray-300'>Image Prompt:</span> {result.imagePrompt}
                            </p>
                            <button onClick={() => handleDownload(result.image, result.imagePrompt, 'jpeg')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors" aria-label="Download Image">
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Video Result */}
                    <div className="space-y-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <video src={result.video} controls loop muted className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 text-xs text-gray-400 leading-snug break-words">
                                <span className='font-semibold text-gray-300'>Video Prompt:</span> {result.videoPrompt}
                            </p>
                            <button onClick={() => handleDownload(result.video, result.videoPrompt, 'mp4')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors" aria-label="Download Video">
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return (
       <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ImageToVideoIcon className="w-24 h-24 mb-4 opacity-30" />
        <p className="text-lg font-medium">Your generated image & video pairs will appear here</p>
        <p className="text-sm">Enter prompts and adjust settings to begin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[480px] flex-shrink-0 flex flex-col gap-6">
        <ImageToVideoSettings
          imageModel={imageModel}
          setImageModel={setImageModel}
          videoModel={videoModel}
          setVideoModel={setVideoModel}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          isLoading={isLoading}
          isBulkMode={isBulkMode}
          setIsBulkMode={setIsBulkMode}
          bulkDelay={bulkDelay}
          setBulkDelay={setBulkDelay}
        />
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-300">
                    Enter your prompt(s)
                </h3>
            </div>

            <div className='flex flex-col sm:flex-row gap-4'>
                <div className='flex-1'>
                    <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-300 mb-2">Image Prompt(s)</label>
                    <textarea id="image-prompt" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder={isBulkMode ? "One image prompt per line..." : "A single prompt for the image..."} disabled={isLoading} rows={6}
                        className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
                </div>
                 <div className='flex-1'>
                    <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Video Prompt(s)</label>
                    <textarea id="video-prompt" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder={isBulkMode ? "One video prompt per line..." : "A single prompt for the video..."} disabled={isLoading} rows={6}
                        className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
                </div>
            </div>
            <button onClick={handleGenerate} disabled={isLoading || !apiKey || !imagePrompt.trim() || !videoPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500">
                <GenerateIcon className="w-5 h-5" />
                {isLoading ? (progress || 'Generating...') : (isBulkMode ? 'Generate All Pairs' : 'Generate')}
            </button>
        </div>
      </div>
      <div className="flex-1 lg:min-w-0 flex flex-col md:flex-row gap-8">
        <div className="flex-1 md:w-2/3">
          <div className="w-full h-full bg-gray-900/50 backdrop-blur-sm border border-dashed border-gray-700 rounded-2xl flex items-center justify-center transition-all duration-300 min-h-[400px] lg:min-h-full">
            {renderContent()}
          </div>
        </div>
        <div className="md:w-1/3">
           <CollectionPanel 
             collection={collection} 
             mode="image-to-video"
             onSelect={(item) => setResult(item as ImageToVideoResult)}
             className="max-h-[60vh] md:max-h-full"
            />
        </div>
      </div>
    </div>
  );
};

export default ImageToVideoGenerator;