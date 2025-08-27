import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MagicWandIcon, ErrorIcon, CheckIcon } from './icons';
import SignUpCodeModal from './SignUpCodeModal';
import Notification from './Notification';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Check for a sign-up code in the URL on initial render
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('signup_code');
    if (urlCode) {
      setCode(urlCode);
      setIsSignUp(true); // Automatically switch to sign-up mode
    }
  }, []);
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification(null);
    }, 5000);
  };

  const handleAuthAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
        if (isSignUp) {
            // 1. Validate the sign-up code against the Supabase table
            const { data: codeData, error: codeError } = await supabase
                .from('signup_codes')
                .select('code')
                .eq('code', code)
                .single();

            if (codeError || !codeData) {
                throw new Error('Invalid sign-up code. Please check the code and try again.');
            }
            
            // 2. If code is valid, proceed with sign-up
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
              throw error;
            }
            if (data.user) {
              setSuccessMessage('Sign-up successful! Please check your email to verify your account.');
              setEmail('');
              setPassword('');
              setCode('');
            }

        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
              throw error;
            }
        }
        
    } catch (error: any) {
        setError(error.error_description || error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCodePurchased = (purchasedCode: string) => {
    setCode(purchasedCode);
    setIsSignUp(true);
    setIsCodeModalOpen(false);
    showNotification(`Successfully acquired sign-up code!`, 'success');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <Notification notification={notification} />
        <SignUpCodeModal 
            isOpen={isCodeModalOpen}
            onClose={() => setIsCodeModalOpen(false)}
            onSuccess={handleCodePurchased}
            showNotification={showNotification}
        />
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center gap-3">
            <MagicWandIcon className="w-10 h-10" />
            aistudio-mesinpintar
          </h1>
          <p className="text-gray-400 mt-2">Powered by Google's Imagen & VEO Models</p>
        </header>

      <div className="w-full max-w-sm mx-auto p-8 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h2>

        {error && (
            <div className="bg-red-900/30 text-red-300 border border-red-700/50 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}
        
        {successMessage && (
            <div className="bg-green-900/30 text-green-300 border border-green-700/50 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                <CheckIcon className="w-5 h-5 flex-shrink-0" />
                <span>{successMessage}</span>
            </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
              />
            </div>
          </div>
          
          {isSignUp && (
            <div>
              <label htmlFor="signup-code" className="block text-sm font-medium text-gray-300">
                Sign-up Code
              </label>
              <div className="mt-1">
                <input
                  id="signup-code"
                  name="signup-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  placeholder="Enter the code you purchased"
                  className="w-full bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>
            </div>
          )}


          <div>
            <button
              type="submit"
              disabled={loading || !email || !password || (isSignUp && !code)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
            >
              {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>

        {isSignUp ? (
            <>
                <div className="mt-6 border-t border-gray-700 pt-6 text-center space-y-3">
                    <p className="text-sm text-gray-400">
                        Interested in joining? Get the sign-up code
                    </p>
                    <button
                        onClick={() => setIsCodeModalOpen(true)}
                        disabled={loading}
                        className="w-full text-center py-2 px-4 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                    >
                        Get Sign-up Code
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">
                        Already have an account?{' '}
                        <button
                            onClick={() => {
                                setIsSignUp(false);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            disabled={loading}
                            className="font-medium text-purple-400 hover:text-purple-300 focus:outline-none focus:underline disabled:opacity-50"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </>
        ) : (
            <div className="mt-6 border-t border-gray-700 pt-6">
                <p className="text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button
                        onClick={() => {
                            setIsSignUp(true);
                            setError(null);
                            setSuccessMessage(null);
                        }}
                        disabled={loading}
                        className="font-medium text-purple-400 hover:text-purple-300 focus:outline-none focus:underline disabled:opacity-50"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        )}

      </div>
    </div>
  );
};

export default Auth;