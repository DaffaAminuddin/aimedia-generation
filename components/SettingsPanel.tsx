
import React from 'react';
import type { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';

interface SettingsPanelProps {
  model: string;
  setModel: (model: any) => void;
  modelOptions: { id: string; name: string }[];
  aspectRatio?: AspectRatio;
  setAspectRatio?: (ratio: AspectRatio) => void;
  isLoading: boolean;
  showAspectRatio: boolean;
  isBulkMode?: boolean;
  setIsBulkMode?: (isBulk: boolean) => void;
  showBulkControls?: boolean;
  bulkDelay?: string;
  setBulkDelay?: (delay: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  model,
  setModel,
  modelOptions,
  aspectRatio,
  setAspectRatio,
  isLoading,
  showAspectRatio,
  isBulkMode,
  setIsBulkMode,
  showBulkControls,
  bulkDelay,
  setBulkDelay,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg space-y-6">
      <div>
        <label id="model-label" className="block text-sm font-medium text-gray-300 mb-2">
          Model
        </label>
        {modelOptions.length > 1 ? (
          <select
            aria-labelledby="model-label"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <p
            aria-labelledby="model-label"
            className="w-full bg-gray-900/70 text-gray-300 border border-gray-700 rounded-lg p-3 text-sm"
          >
            {modelOptions[0]?.name || 'N/A'}
          </p>
        )}
      </div>

      {showAspectRatio && aspectRatio && setAspectRatio && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-5 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
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
        </div>
      )}

      {showBulkControls && setIsBulkMode && (
        <div className="space-y-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <label htmlFor="bulk-toggle" className="text-sm font-medium text-gray-300">Bulk Generate</label>
            <button
                id="bulk-toggle"
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
          {isBulkMode && typeof bulkDelay === 'string' && setBulkDelay && (
            <div className="space-y-2">
              <label htmlFor="bulk-delay" className="block text-sm font-medium text-gray-300">
                Delay Between Generations (seconds)
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="bulk-delay"
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
      )}
    </div>
  );
};

export default SettingsPanel;
