import React, { useRef, useState } from 'react';
import { UploadIcon, TrashIcon, ImageIcon } from './icons';

interface ImageInputPanelProps {
  image: string | null;
  setImage: (image: string | null) => void;
  isLoading: boolean;
}

const ImageInputPanel: React.FC<ImageInputPanelProps> = ({ image, setImage, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };


  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Image Input (Optional)
      </label>
      {image ? (
        <div className="relative group">
          <img src={image} alt="Input for video generation" className="w-full h-auto rounded-lg object-contain max-h-48" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
                onClick={handleRemoveImage}
                disabled={isLoading}
                className="p-2 bg-red-600/80 hover:bg-red-700/80 text-white rounded-full backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:opacity-50"
                aria-label="Remove image"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`relative block w-full border-2 ${isDragging ? 'border-purple-500' : 'border-gray-600'} border-dashed rounded-lg p-8 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <div className="flex flex-col items-center">
            <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
              Upload an image
            </span>
            <span className="text-xs text-gray-500">or drag and drop</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageInputPanel;
