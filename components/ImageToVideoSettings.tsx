import React, { useEffect } from 'react';
import type { AspectRatio, ImageModelOption, VideoModelOption } from '../types';
import { IMAGE_MODEL_OPTIONS, VIDEO_MODEL_OPTIONS } from '../constants';

interface ImageToVideoSettingsProps {
  imageModel: ImageModelOption;
  setImageModel: (model: ImageModelOption) => void;
  videoModel: VideoModelOption;
  setVideoModel: (model: VideoModelOption) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  isLoading: boolean;
  isBulkMode: boolean;
  setIsBulkMode: (isBulk: boolean) => void;
  bulkDelay: string;
  setBulkDelay: (delay: string) => void;
}

const ImageToVideoSettings: React.FC<ImageToVideoSettingsProps> = ({
  imageModel,
  setImageModel,
  videoModel,
  setVideoModel,
  aspectRatio,
  setAspectRatio,
  isLoading,
  isBulkMode,
  setIsBulkMode,
  bulkDelay,
  setBulkDelay,
}) => {

  const availableAspectRatios: AspectRatio[] = videoModel.startsWith('veo-3') 
    ? ['16:9'] 
    : ['16:9', '9:16'];

  useEffect(() => {
    // If the selected aspect ratio is no longer available with the new model,
    // default to the first available option.
    if (!availableAspectRatios.includes(aspectRatio)) {
      setAspectRatio(availableAspectRatios[0]);
    }
  }, [videoModel, aspectRatio, setAspectRatio]);


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg space-y-6">
      <div>
        <label id="image-model-label" className="block text-sm font-medium text-gray-300 mb-2">
          Image Model
        </label>
        <select
          aria-labelledby="image-model-label"
          value={imageModel}
          onChange={(e) => setImageModel(e.target.value as ImageModelOption)}
          disabled={isLoading}
          className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
        >
          {IMAGE_MODEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label id="video-model-label" className="block text-sm font-medium text-gray-300 mb-2">
          Video Model
        </label>
        <select
          aria-labelledby="video-model-label"
          value={videoModel}
          onChange={(e) => setVideoModel(e.target.value as VideoModelOption)}
          disabled={isLoading}
          className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
        >
          {VIDEO_MODEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
        <div className={`grid gap-2 ${availableAspectRatios.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {availableAspectRatios.map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              disabled={isLoading}
              className={`py-2 px-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                aspectRatio === ratio
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-gray-900/70 text-gray-400 hover:bg-gray-700/50'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {ratio}
            </button>
          ))}
        </div>
         {videoModel.startsWith('veo-3') && <p className="text-xs text-gray-500 mt-2">VEO 3 models currently only support 16:9 aspect ratio.</p>}
      </div>
      <div className="space-y-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <label htmlFor="bulk-toggle-itv" className="text-sm font-medium text-gray-300">Bulk Mode</label>
          <button
            id="bulk-toggle-itv"
            onClick={() => setIsBulkMode(!isBulkMode)}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${isBulkMode ? 'bg-purple-600' : 'bg-gray-600'}`}
            aria-pressed={isBulkMode}
          >
            <span className="sr-only">Use setting</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isBulkMode ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
        {isBulkMode && (
          <div className="space-y-2">
            <label htmlFor="bulk-delay-itv" className="block text-sm font-medium text-gray-300">
              Delay Between Generations (seconds)
            </label>
            <input
              type="text"
              inputMode="numeric"
              id="bulk-delay-itv"
              value={bulkDelay}
              onChange={(e) => {
                setBulkDelay(e.target.value.replace(/[^0-9]/g, ''));
              }}
              onBlur={(e) => {
                let value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 40) {
                  value = 40;
                } else if (value > 200) {
                  value = 200;
                }
                setBulkDelay(String(value));
              }}
              disabled={isLoading}
              className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
            />
            <p className="text-xs text-gray-500">Min: 40s, Max: 200s.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToVideoSettings;