import React from 'react';
import { GenerateIcon } from './icons';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isBulkMode: boolean;
  generationProgress: string | null;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  isLoading,
  isBulkMode,
  generationProgress
}) => {
    
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onGenerate();
    }
  };

  const buttonText = () => {
    if (isLoading) {
      return generationProgress || 'Generating...';
    }
    return isBulkMode ? 'Start Bulk Generation' : 'Generate';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
          Enter your prompt(s)
        </label>
      </div>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isBulkMode ? "Enter one prompt per line.\ne.g., A dog wearing a superhero cape\nA cat playing a tiny piano" : "e.g., A cute cat astronaut on the moon"}
        disabled={isLoading}
        rows={5}
        className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none disabled:opacity-50"
      />
      <button
        onClick={onGenerate}
        disabled={isLoading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
      >
        <GenerateIcon className="w-5 h-5" />
        {buttonText()}
      </button>
      <p className="text-xs text-center text-gray-500">
        Press <kbd className="font-sans border border-gray-600 rounded px-1.5 py-0.5">Ctrl</kbd> + <kbd className="font-sans border border-gray-600 rounded px-1.5 py-0.5">Enter</kbd> to generate.
      </p>
    </div>
  );
};

export default PromptInput;