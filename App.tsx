import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppMode, ImageToVideoResult } from './types';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import ImageToVideoGenerator from './components/ImageToVideoGenerator';
import PromptGenerator from './components/PromptGenerator';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import { MagicWandIcon, ImageIcon, VideoIcon, ImageToVideoIcon, SparklesIcon, SignOutIcon, KeyIcon, EditIcon, EyeIcon, EyeOffIcon } from './components/icons';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<AppMode>('image');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);

  // State for passing data between components
  const [imageForVideo, setImageForVideo] = useState<string | null>(null);
  const [promptForVideo, setPromptForVideo] = useState<{ content: string; isBulk: boolean } | null>(null);

  // Collections
  const [imageCollection, setImageCollection] = useState<string[]>([]);
  const [videoCollection, setVideoCollection] = useState<string[]>([]);
  const [imageToVideoCollection, setImageToVideoCollection] = useState<ImageToVideoResult[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const MAX_COLLECTION_SIZE = 5;
  
  // === Lifted State for Generators ===
  
  // Image Generator State
  const [imageIsLoading, setImageIsLoading] = useState(false);
  const [imageProgress, setImageProgress] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [latestImage, setLatestImage] = useState<string | null>(null);

  // Video Generator State
  const [videoIsLoading, setVideoIsLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [latestVideo, setLatestVideo] = useState<string | null>(null);

  // Image-to-Video Generator State
  const [i2vIsLoading, setI2VIsLoading] = useState(false);
  const [i2vProgress, setI2VProgress] = useState<string | null>(null);
  const [i2vError, setI2VError] = useState<string | null>(null);
  const [latestI2VResult, setLatestI2VResult] = useState<ImageToVideoResult | null>(null);

  // Prompt Generator State
  const [promptIsLoading, setPromptIsLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       if (!session) {
        // Clear API key on logout
        setApiKey(null);
        localStorage.removeItem('geminiApiKey');
      }
    });
    
    // Load API key from local storage on startup
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        setApiKey(savedApiKey);
    } else {
        setIsEditingKey(true); // Prompt for key if not set
    }


    return () => subscription.unsubscribe();
  }, []);


  const handleSaveKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem('geminiApiKey', tempApiKey.trim());
      setIsEditingKey(false);
      setShowKey(false);
    }
  };

  const handleEditKey = () => {
    setTempApiKey(apiKey || '');
    setIsEditingKey(true);
  };
  
  const handleCancelEdit = () => {
    setTempApiKey('');
    setIsEditingKey(false);
    setShowKey(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSendToVideo = (imageData: string) => {
    setImageForVideo(imageData);
    setMode('video');
  };

  const handleSendPromptToVideo = (prompts: string[], isBulk: boolean) => {
    setPromptForVideo({ content: prompts.join('\n'), isBulk });
    setMode('video');
  };

  const clearImageForVideo = () => {
    setImageForVideo(null);
  }

  const clearPromptForVideo = () => {
    setPromptForVideo(null);
  }
  
  const handleAddImageToCollection = (imageUrl: string) => {
    setImageCollection(prev => [imageUrl, ...prev].slice(0, MAX_COLLECTION_SIZE));
  };

  const handleAddVideoToCollection = (videoUrl: string) => {
    setVideoCollection(prev => {
      const newCollection = [videoUrl, ...prev];
      if (newCollection.length > MAX_COLLECTION_SIZE) {
        const removedUrl = newCollection.pop();
        if (removedUrl) URL.revokeObjectURL(removedUrl);
      }
      return newCollection;
    });
  };

  const handleAddImageToVideoToCollection = (result: ImageToVideoResult) => {
    setImageToVideoCollection(prev => {
      const newCollection = [result, ...prev];
      if (newCollection.length > MAX_COLLECTION_SIZE) {
        const removedResult = newCollection.pop();
        if (removedResult) URL.revokeObjectURL(removedResult.video);
      }
      return newCollection;
    });
  };


  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <main className="mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center gap-3">
            <MagicWandIcon className="w-10 h-10" />
            aistudio-mesinpintar
          </h1>
          <p className="text-gray-400 mt-2">Powered by Google's Imagen & VEO Models</p>
        </header>

        <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800/50 border border-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${session.user.email}&background=1f2937&color=d1d5db&rounded=true`} alt="user avatar" className="w-8 h-8 rounded-full" />
                    <p className="text-sm text-gray-300 truncate">
                        {session.user.email}
                    </p>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={handleSignOut} className="flex items-center text-sm py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500">
                        <SignOutIcon className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </div>
            
             <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                {isEditingKey ? (
                    <div className="space-y-3">
                        <label htmlFor="api-key-input" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <KeyIcon className="w-4 h-4"/>
                            Gemini API Key
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <input
                                    id="api-key-input"
                                    type={showKey ? 'text' : 'password'}
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API Key"
                                    className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition pr-10"
                                />
                                <button onClick={() => setShowKey(!showKey)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200" aria-label={showKey ? 'Hide key' : 'Show key'}>
                                    {showKey ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <button onClick={handleSaveKey} disabled={!tempApiKey.trim()} className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                            {apiKey && <button onClick={handleCancelEdit} className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm transition-colors">Cancel</button>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <KeyIcon className="w-4 h-4 text-green-400" />
                            <span>API Key: </span>
                            <span className="font-mono bg-gray-900/50 px-2 py-1 rounded">
                                {`••••••••${apiKey ? apiKey.slice(-4) : ''}`}
                            </span>
                        </div>
                        <button onClick={handleEditKey} className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500">
                            <EditIcon className="w-4 h-4" />
                            Edit
                        </button>
                    </div>
                )}
            </div>
        </div>

        <>
            <div className="mb-8 flex justify-center">
              <div className="flex bg-gray-800/50 border border-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setMode('prompt')}
                  className={`flex items-center gap-2 justify-center py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                    mode === 'prompt'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <SparklesIcon className="w-5 h-5" />
                  Prompt Ideation
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`flex items-center gap-2 justify-center py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                    mode === 'image'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  Image
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={`flex items-center gap-2 justify-center py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                    mode === 'video'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <VideoIcon className="w-5 h-5" />
                  Video
                </button>
                <button
                  onClick={() => setMode('image-to-video')}
                  className={`flex items-center gap-2 justify-center py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                    mode === 'image-to-video'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <ImageToVideoIcon className="w-5 h-5" />
                  Image-to-Video
                </button>
              </div>
            </div>

            {mode === 'prompt' && <PromptGenerator 
              apiKey={apiKey}
              generatedPrompts={generatedPrompts}
              onPromptsChange={setGeneratedPrompts}
              onSendToVideo={handleSendPromptToVideo}
              isLoading={promptIsLoading}
              setIsLoading={setPromptIsLoading}
              error={promptError}
              setError={setPromptError}
            />}
            {mode === 'image' && (
              <ImageGenerator 
                apiKey={apiKey}
                onSendToVideo={handleSendToVideo}
                collection={imageCollection}
                onAddToCollection={handleAddImageToCollection}
                isLoading={imageIsLoading}
                setIsLoading={setImageIsLoading}
                progress={imageProgress}
                setProgress={setImageProgress}
                error={imageError}
                setError={setImageError}
                result={latestImage}
                setResult={setLatestImage}
              />
            )}
            {mode === 'video' && (
              <VideoGenerator
                apiKey={apiKey}
                initialImage={imageForVideo}
                onClearInitialImage={clearImageForVideo}
                initialPrompt={promptForVideo}
                onClearInitialPrompt={clearPromptForVideo}
                collection={videoCollection}
                onAddToCollection={handleAddVideoToCollection}
                isLoading={videoIsLoading}
                setIsLoading={setVideoIsLoading}
                progress={videoProgress}
                setProgress={setVideoProgress}
                error={videoError}
                setError={setVideoError}
                result={latestVideo}
                setResult={setLatestVideo}
              />
            )}
            {mode === 'image-to-video' && (
              <ImageToVideoGenerator 
                apiKey={apiKey}
                collection={imageToVideoCollection}
                onAddToCollection={handleAddImageToVideoToCollection}
                isLoading={i2vIsLoading}
                setIsLoading={setI2VIsLoading}
                progress={i2vProgress}
                setProgress={setI2VProgress}
                error={i2vError}
                setError={setI2VError}
                result={latestI2VResult}
                setResult={setLatestI2VResult}
              />
            )}
        </>
      </main>
    </div>
  );
};

export default App;
