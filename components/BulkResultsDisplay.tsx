import React from 'react';
import { VideoIcon } from './icons';

interface BulkResultsDisplayProps {
  results: string[];
  mode: 'image' | 'video';
  onSendToVideo?: (imageData: string) => void;
}

const BulkResultsDisplay: React.FC<BulkResultsDisplayProps> = ({ results, mode, onSendToVideo }) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
        Bulk Generation Results ({results.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((result, index) => (
          <div key={index} className="bg-gray-800/50 rounded-lg overflow-hidden shadow-md group relative aspect-square">
            {mode === 'image' ? (
              <>
                <img 
                  src={result} 
                  alt={`Generated result ${index + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                {onSendToVideo && (
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg p-2">
                    <button
                      onClick={() => onSendToVideo(result)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                    >
                      <VideoIcon className="w-4 h-4" />
                      Use
                    </button>
                  </div>
                )}
              </>
            ) : (
              <video 
                src={result} 
                controls 
                loop 
                muted
                className="w-full h-full object-cover" 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkResultsDisplay;
