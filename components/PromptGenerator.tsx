import React, { useState } from 'react';
import type { NumberOfVariations } from '../types';
import { generateStructuredPrompt } from '../services/geminiService';
import { SparklesIcon, GenerateIcon, ErrorIcon, CopyIcon, CheckIcon, TrashIcon, VideoIcon } from './icons';
import { VARIATION_OPTIONS, BASE_STYLE_OPTIONS, CAMERA_SETUP_OPTIONS } from '../constants';

interface PromptGeneratorProps {
  apiKey: string | null;
  generatedPrompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  onSendToVideo: (prompts: string[], isBulk: boolean) => void;
}

const PromptResultItem: React.FC<{ prompt: string; index: number, onSendToVideo: (prompt: string) => void; }> = ({ prompt, index, onSendToVideo }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(prompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative bg-gray-900/50 p-4 rounded-lg border border-gray-700 group">
            <div className="flex justify-between items-start gap-4">
                 <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words flex-1">
                    <code>{prompt}</code>
                </pre>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={() => onSendToVideo(prompt)}
                        className="flex items-center gap-1.5 bg-purple-600/90 hover:bg-purple-700/90 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                        aria-label={`Use prompt for video`}
                    >
                        <VideoIcon className="w-4 h-4" />
                        Use
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                        aria-label={`Copy prompt ${index + 1}`}
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-4 h-4" />}
                        {isCopied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const PromptGenerator: React.FC<PromptGeneratorProps> = ({ apiKey, generatedPrompts, onPromptsChange, onSendToVideo }) => {
  const [idea, setIdea] = useState('A cinematic shot of a lone astronaut discovering a glowing, alien flower on a desolate moon.');
  const [selectedStyle, setSelectedStyle] = useState<string>(BASE_STYLE_OPTIONS[0].value);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>(CAMERA_SETUP_OPTIONS[0].value);
  const [customCamera, setCustomCamera] = useState<string>('');
  const [useNegatives, setUseNegatives] = useState(false);
  const [negatives, setNegatives] = useState('blurry, low resolution, cartoonish, watermark, text');
  const [isJson, setIsJson] = useState(false);
  const [numberOfVariations, setNumberOfVariations] = useState<NumberOfVariations>(1);
  const [isMultiIdeaMode, setIsMultiIdeaMode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);

  const handleMultiIdeaToggle = () => {
    const newMode = !isMultiIdeaMode;
    setIsMultiIdeaMode(newMode);
    if (newMode) {
      setNumberOfVariations(1);
    }
  };

  const handleGenerate = async () => {
     if (isLoading || !apiKey) {
      if (!apiKey) setError("Please set your Gemini API Key in the header before generating.");
      return;
    }

    const finalStyle = selectedStyle === 'custom' ? customStyle : selectedStyle;
    const finalCamera = selectedCamera === 'custom' ? customCamera : selectedStyle;

    if (isMultiIdeaMode) {
        const ideas = idea.split('\n').filter(p => p.trim());
        if (ideas.length === 0 || !finalStyle.trim() || !finalCamera.trim()) {
            setError("Please enter at least one idea, and select a style and camera setup.");
            return;
        }

        setIsLoading(true);
        setError(null);
        const allResults: string[] = [];
        onPromptsChange([]);

        try {
            for (let i = 0; i < ideas.length; i++) {
                const currentIdea = ideas[i];
                const results = await generateStructuredPrompt({
                    idea: currentIdea,
                    style: finalStyle,
                    camera: finalCamera,
                    negatives: useNegatives ? negatives : undefined,
                    isJson,
                    numberOfVariations: 1,
                    apiKey
                });
                allResults.push(...results);
                onPromptsChange([...allResults]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `An error occurred on idea ${allResults.length + 1}: ${err.message}`);
        } finally {
            setIsLoading(false);
        }

    } else {
        if (!idea.trim() || !finalStyle.trim() || !finalCamera.trim()) {
            setError("Please fill in all required fields: Idea, Style, and Camera.");
            return;
        }
        setIsLoading(true);
        setError(null);
        onPromptsChange([]);
        try {
        const results = await generateStructuredPrompt({
            idea,
            style: finalStyle,
            camera: finalCamera,
            negatives: useNegatives ? negatives : undefined,
            isJson,
            numberOfVariations,
            apiKey
        });
        onPromptsChange(results);
        } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
        setIsLoading(false);
        }
    }
  };

  const handleCopyAll = () => {
    if (generatedPrompts.length === 0) return;
    const allPromptsText = generatedPrompts.join('\n\n');
    navigator.clipboard.writeText(allPromptsText).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2000);
    });
  };

  const renderResult = () => {
    if (isLoading && generatedPrompts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-pulse-fast p-4">
          <SparklesIcon className="w-16 h-16 mb-4 opacity-50" />
          <p className="font-medium">Crafting your prompt(s)...</p>
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
    if (generatedPrompts.length > 0) {
      return (
        <div className="relative w-full h-full p-4 overflow-auto space-y-4">
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                    onClick={() => onSendToVideo(generatedPrompts, generatedPrompts.length > 1)}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50"
                    aria-label="Use all prompts for video generation"
                >
                    <VideoIcon className="w-4 h-4" />
                    Use All for Video
                </button>
                 <button
                    onClick={handleCopyAll}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gray-700/60 hover:bg-gray-600/60 backdrop-blur-sm text-gray-300 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50"
                    aria-label="Copy all generated prompts"
                >
                    {isAllCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    {isAllCopied ? 'Copied' : 'Copy All'}
                </button>
                <button
                    onClick={() => onPromptsChange([])}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gray-700/60 hover:bg-gray-600/60 backdrop-blur-sm text-gray-300 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50"
                    aria-label="Clear results"
                >
                    <TrashIcon className="w-4 h-4" />
                    Clear
                </button>
            </div>
            {generatedPrompts.map((prompt, index) => (
                <PromptResultItem 
                    key={index} 
                    prompt={prompt} 
                    index={index} 
                    onSendToVideo={(p) => onSendToVideo([p], false)}
                />
            ))}
            {isLoading && (
                 <div className="flex items-center justify-center text-center text-gray-400 p-4">
                    <SparklesIcon className="w-6 h-6 mr-2 opacity-50 animate-pulse-fast" />
                    <p className="font-medium">Generating next prompt...</p>
                </div>
            )}
        </div>
      )
    }
     return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <SparklesIcon className="w-24 h-24 mb-4 opacity-30" />
        <p className="text-lg font-medium">Your generated prompt will appear here</p>
        <p className="text-sm">Combine your ideas to create the perfect prompt</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[480px] flex-shrink-0 flex flex-col gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="idea" className="block text-sm font-medium text-gray-300">Video Idea(s)</label>
                <div className="flex items-center gap-2">
                    <label htmlFor="multi-idea-toggle" className="text-sm font-medium text-gray-400">Multi-Idea</label>
                    <button
                        id="multi-idea-toggle"
                        onClick={handleMultiIdeaToggle}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${isMultiIdeaMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                        aria-pressed={isMultiIdeaMode}
                    >
                        <span className="sr-only">Use setting</span>
                        <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMultiIdeaMode ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>
            </div>
            <textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} disabled={isLoading} rows={4}
              placeholder={isMultiIdeaMode ? "Enter one idea per line..." : "A cinematic shot of a lone astronaut..."}
              className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
          </div>
          <div>
            <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2">Base Style</label>
            <select
                id="style-select"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
            >
                {BASE_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
                ))}
            </select>
          </div>
          {selectedStyle === 'custom' && (
             <div>
                <label htmlFor="custom-style" className="sr-only">Custom Style</label>
                <textarea 
                    id="custom-style" 
                    value={customStyle} 
                    onChange={(e) => setCustomStyle(e.target.value)} 
                    disabled={isLoading} 
                    rows={3}
                    placeholder="e.g., Psychedelic, vaporwave aesthetic, VHS glitch effects"
                    className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
             </div>
          )}
          <div>
            <label htmlFor="camera-select" className="block text-sm font-medium text-gray-300 mb-2">Camera Setup</label>
            <select
                id="camera-select"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
            >
                {CAMERA_SETUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
                ))}
            </select>
          </div>
          {selectedCamera === 'custom' && (
             <div>
                <label htmlFor="custom-camera" className="sr-only">Custom Camera Setup</label>
                <textarea 
                    id="custom-camera" 
                    value={customCamera} 
                    onChange={(e) => setCustomCamera(e.target.value)} 
                    disabled={isLoading} 
                    rows={3}
                    placeholder="e.g., Fast-paced whip pans, rack focus"
                    className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
             </div>
          )}
           <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Negative Prompts</span>
              <button onClick={() => setUseNegatives(!useNegatives)} disabled={isLoading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 ${useNegatives ? 'bg-purple-600' : 'bg-gray-600'}`}
                aria-pressed={useNegatives}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useNegatives ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {useNegatives && (
              <textarea id="negatives" value={negatives} onChange={(e) => setNegatives(e.target.value)} disabled={isLoading} rows={2}
                className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50" />
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-300">JSON Output</span>
              <button onClick={() => setIsJson(!isJson)} disabled={isLoading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 ${isJson ? 'bg-purple-600' : 'bg-gray-600'}`}
                aria-pressed={isJson}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isJson ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Variations</label>
            <div className="grid grid-cols-4 gap-2">
                {VARIATION_OPTIONS.map((option) => (
                <button
                    key={option}
                    onClick={() => setNumberOfVariations(option)}
                    disabled={isLoading || isMultiIdeaMode}
                    className={`py-2 px-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                    numberOfVariations === option
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-gray-900/70 text-gray-400 hover:bg-gray-700/50'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                    {option}
                </button>
                ))}
            </div>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={isLoading || !apiKey || !idea.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500">
          <GenerateIcon className="w-5 h-5" />
          {isLoading ? 'Generating...' : (isMultiIdeaMode ? 'Generate Prompts' : 'Generate Prompt')}
        </button>
      </div>

      <div className="flex-1 lg:min-w-0">
         <div className="w-full h-full bg-gray-900/50 backdrop-blur-sm border border-dashed border-gray-700 rounded-2xl flex items-center justify-center transition-all duration-300 min-h-[400px] lg:min-h-full">
            {renderResult()}
          </div>
      </div>
    </div>
  );
};

export default PromptGenerator;