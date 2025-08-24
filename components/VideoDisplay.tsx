
import React, { useState, useEffect } from 'react';
import { VideoIcon, ErrorIcon } from './icons';

interface VideoDisplayProps {
  video: string | null;
  isLoading: boolean;
  error: string | null;
  generationProgress: string | null;
}

const loadingMessages = [
  "Warming up the VEO engine...",
  "Storyboarding your scene...",
  "Rendering the first frames...",
  "This can take a few minutes...",
  "Compositing the shots...",
  "Adding the final touches...",
  "Almost there..."
];

const VideoDisplay: React.FC<VideoDisplayProps> = ({ video, isLoading, error, generationProgress }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (isLoading && !generationProgress) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading, generationProgress]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full text-gray-400 p-4">
          <div className="animate-pulse-fast">
            <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
          </div>
          <p className="font-medium text-lg">{generationProgress || 'Generating your video...'}</p>
          <p className="text-sm text-gray-500 mt-2 transition-opacity duration-500">
            {generationProgress ? 'This can take a few minutes...' : loadingMessages[currentMessageIndex]}
          </p>
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

    if (video) {
      return (
        <video
          src={video}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain rounded-lg transition-opacity duration-500 opacity-0"
          onLoadedData={(e) => e.currentTarget.style.opacity = '1'}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <VideoIcon className="w-24 h-24 mb-4 opacity-30" />
        <p className="text-lg font-medium">Your generated video will appear here</p>
        <p className="text-sm">Adjust settings and write a prompt to start</p>
      </div>
    );
  };

  return (
    <div className={`w-full bg-gray-900/50 backdrop-blur-sm border border-dashed border-gray-700 rounded-2xl p-4 flex items-center justify-center transition-all duration-300 aspect-video`}>
      {renderContent()}
    </div>
  );
};

export default VideoDisplay;
