import React from 'react';
import type { ImageToVideoResult } from '../types';
import { DownloadIcon } from './icons';
import { downloadFile, sanitizeFilename } from '../utils';

interface ImageToVideoResultsDisplayProps {
  results: ImageToVideoResult[];
}

const ImageToVideoResultsDisplay: React.FC<ImageToVideoResultsDisplayProps> = ({ results }) => {
  if (results.length === 0) {
    return null;
  }

  const handleDownload = (url: string, prompt: string, extension: 'jpeg' | 'mp4') => {
      const filename = `${sanitizeFilename(prompt)}_${Date.now()}.${extension}`;
      downloadFile(url, filename);
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="space-y-6">
        {results.map((result, index) => (
          <div key={index} className="bg-gray-800/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-200">
              Result Pair {index + 1}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Result */}
              <div className="space-y-2">
                 <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                        src={result.image}
                        alt={`Generated image for: ${result.imagePrompt}`}
                        className="w-full h-full object-contain"
                    />
                 </div>
                 <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-xs text-gray-400 leading-snug break-words">
                        <span className='font-semibold text-gray-300'>Image Prompt:</span> {result.imagePrompt}
                    </p>
                    <button 
                        onClick={() => handleDownload(result.image, result.imagePrompt, 'jpeg')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors"
                        aria-label="Download Image"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Video Result */}
              <div className="space-y-2">
                 <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                        src={result.video}
                        controls
                        loop
                        muted
                        className="w-full h-full object-contain"
                    />
                 </div>
                 <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-xs text-gray-400 leading-snug break-words">
                        <span className='font-semibold text-gray-300'>Video Prompt:</span> {result.videoPrompt}
                    </p>
                     <button 
                        onClick={() => handleDownload(result.video, result.videoPrompt, 'mp4')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors"
                        aria-label="Download Video"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageToVideoResultsDisplay;