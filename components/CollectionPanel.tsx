
import React from 'react';
import type { ImageToVideoResult } from '../types';
import { GalleryIcon, DownloadIcon } from './icons';
import { downloadFile } from '../utils';

interface CollectionPanelProps {
  collection: (string | ImageToVideoResult)[];
  mode: 'image' | 'video' | 'image-to-video';
  onSelect: (item: string | ImageToVideoResult) => void;
  className?: string;
}

const CollectionPanel: React.FC<CollectionPanelProps> = ({ collection, mode, onSelect, className }) => {
  
  const handleDownload = (e: React.MouseEvent, url: string) => {
      e.stopPropagation(); // Prevent the main button's onClick from firing
      const filename = `generated_image_${Date.now()}.jpeg`;
      downloadFile(url, filename);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex-shrink-0">
          Recent Generations
        </h3>
        <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 overflow-y-auto">
            {collection.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500">
                    <GalleryIcon className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm font-medium">Your recent results will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {collection.map((item, index) => (
                    <button 
                        key={index} 
                        onClick={() => onSelect(item)} 
                        className="block w-full rounded-lg overflow-hidden group relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-transform duration-200 ease-in-out hover:scale-[1.02] aspect-video bg-black"
                        aria-label={`View result ${index + 1}`}
                    >
                        {mode === 'image' && typeof item === 'string' && (
                            <img src={item} alt={`Result ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                        {mode === 'video' && typeof item === 'string' && (
                            <video src={item} muted loop playsInline className="w-full h-full object-cover bg-black" onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()}/>
                        )}
                        {mode === 'image-to-video' && typeof item === 'object' && 'image' in item && (
                            <>
                                <img src={item.image} alt={`Image for result ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                            </>
                        )}
                        
                        {/* Conditional hover overlay */}
                        {mode === 'image' && typeof item === 'string' ? (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-2">
                                <button 
                                    onClick={(e) => handleDownload(e, item)}
                                    className="flex items-center gap-1.5 bg-gray-100/90 hover:bg-white text-gray-900 font-bold py-1.5 px-3 rounded-full text-xs transition-all transform hover:scale-105"
                                    aria-label="Download image"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Download
                                </button>
                                <p className="text-white font-semibold text-xs mt-1">Click to view larger</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-bold text-sm">View Details</p>
                            </div>
                        )}
                    </button>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default CollectionPanel;
