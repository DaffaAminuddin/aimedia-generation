import React, { useState } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient';
import { CloseIcon, TicketIcon, CheckIcon, CopyIcon } from './icons';


// --- REQUIRED SUPABASE EDGE FUNCTION ---
// To make this payment flow work securely, you must create the following Supabase Edge Functions.
// Create the files in your Supabase project under the `supabase/functions/` directory and deploy them.
// You also need to set the `MIDTRANS_SERVER_KEY` in your Supabase project's environment variables.

/*
// File: supabase/functions/create-midtrans-transaction/index.ts
//
// This function securely creates a Midtrans transaction token on the server-side.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (_req) => {
  // Handle CORS preflight requests
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get Midtrans Server Key from environment variables.
    // SET THIS in your Supabase Project -> Settings -> Environment Variables
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!midtransServerKey) {
      throw new Error('MIDTRANS_SERVER_KEY is not set in environment variables.')
    }

    // 2. Generate a unique Order ID for tracking.
    const orderId = `SIGNUP-${new Date().getTime()}-${Math.random().toString(36).substring(2, 8)}`

    // 3. Define transaction details for Midtrans.
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: 99000, // Amount in Rupiah
      },
      item_details: [{
        id: 'SIGNUP_CODE_01',
        price: 99000,
        quantity: 1,
        name: "AI Studio Sign-up Code",
      }],
    };

    // 4. Encode the server key for the Authorization header (Basic Auth).
    const authString = btoa(`${midtransServerKey}:`)

    // 5. Call the Midtrans API.
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(transactionDetails)
    })

    if (!midtransResponse.ok) {
        const errorBody = await midtransResponse.json();
        console.error('Midtrans API Error:', errorBody);
        throw new Error(`Midtrans API Error: ${JSON.stringify(errorBody.error_messages)}`);
    }

    const { token } = await midtransResponse.json();

    // 6. Return the token to the frontend.
    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})

*/

/*
// File: supabase/functions/_shared/cors.ts
//
// A helper file for CORS headers.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
*/


interface SignUpCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

// This function now securely calls our Supabase Edge Function to get a transaction token.
const createSignUpCodeTransaction = async (): Promise<{ token: string }> => {
  console.log("Invoking Supabase Function via fetch to create Midtrans transaction...");

  try {
    // Using fetch directly to bypass any potential issues with supabase.functions.invoke
    const response = await fetch(`${supabaseUrl}/functions/v1/create-midtrans-transaction`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Sending an empty JSON object as the body
    });
    
    // The preflight OPTIONS request will be handled automatically by the browser.
    // The Edge Function needs to have the correct CORS headers for this to work.

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch(e) {
        errorBody = { error: response.statusText };
      }
      console.error('Supabase function responded with an error:', response.status, errorBody);
      throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Error from inside the edge function:', data.error);
      throw new Error(data.error);
    }
    
    if (!data.token) {
        console.error('No token received from edge function:', data);
        throw new Error('Payment session could not be created. Missing token.');
    }

    return { token: data.token };
  } catch (error) {
    console.error('Error invoking Supabase function:', error);
    // This catches network errors (like CORS failures) which result in "Failed to fetch"
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Failed to send a request to the Edge Function. Please check your network connection and ensure you do not have ad-blockers interfering.');
    }
    throw new Error(`Failed to create payment session: ${error.message}`);
  }
};


// Generates a random sign-up code.
// NOTE: In production, this should be handled by your backend/webhook.
const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'STUDIO-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const SignUpCodeModal: React.FC<SignUpCodeModalProps> = ({ isOpen, onClose, onSuccess, showNotification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) {
    return null;
  }
  
  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // 1. Call your secure backend function to create a transaction and get a token.
      const { token } = await createSignUpCodeTransaction();

      if (!token) {
        throw new Error("Received an invalid token from the server.");
      }

      // 2. Use the token to open the Midtrans payment popup.
      (window as any).snap.pay(token, {
        onSuccess: function(result: any){
          console.log('success', result);
          
          // --- PRODUCTION TODO ---
          // The following client-side code generation is for DEMO purposes only and is INSECURE.
          // In a production environment, you MUST use Midtrans Webhooks.
          //
          // Your webhook flow:
          // 1. Midtrans sends a notification to a secure Supabase Edge Function (e.g., 'handle-midtrans-webhook').
          // 2. Your function verifies the notification is genuinely from Midtrans.
          // 3. If the payment status is 'settlement', your function generates a unique sign-up code.
          // 4. The code is then securely inserted into your 'signup_codes' table in Supabase.
          // 5. This modal should then show a success message. To display the code, you could use
          //    Supabase Realtime to listen for the new code being added to the database.
          
          // Simulating code generation on the client side for this demo.
          const newCode = generateRandomCode();
          setGeneratedCode(newCode); 
        },
        onPending: function(result: any){
          console.log('pending', result);
          showNotification('Your payment is pending. You will receive your code once confirmed.', 'success');
          onClose();
        },
        onError: function(result: any){
          console.log('error', result);
          showNotification('Payment failed. Please try again or contact support.', 'error');
        },
        onClose: function(){
           // This callback is triggered when the popup closes (before or after payment).
          console.log('Customer closed the popup.');
        }
      });

    } catch (error) {
      console.error("Error initiating transaction:", error);
      showNotification(error instanceof Error ? error.message : 'Could not initiate payment. Please try again later.', 'error');
    } finally {
      // The button's loading state can be turned off once the Snap popup is initiated.
      setIsLoading(false);
    }
  };
  
  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleFinish = () => {
    if (generatedCode) {
        onSuccess(generatedCode);
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-gray-900/80 border border-gray-700 rounded-2xl shadow-xl p-8 text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        
        {generatedCode ? (
            <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/40 border-2 border-green-500/50">
                    <CheckIcon className="h-8 w-8 text-green-400" />
                </div>
                <h2 id="modal-title" className="mt-4 text-2xl font-bold text-gray-100">
                    Payment Successful!
                </h2>
                <p className="mt-2 text-gray-400">
                    Here is your unique sign-up code. Keep it safe!
                </p>
                <div className="relative my-6 bg-gray-900/70 border border-dashed border-gray-600 rounded-lg p-4">
                    <p className="text-2xl font-mono tracking-widest text-purple-400">{generatedCode}</p>
                    <button onClick={handleCopyCode} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white">
                        {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
                <button
                    onClick={handleFinish}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                >
                    Use Code to Sign Up
                </button>
            </>
        ) : (
            <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40 border-2 border-purple-500/50">
                    <TicketIcon className="h-8 w-8 text-purple-400" />
                </div>
                <h2 id="modal-title" className="mt-4 text-2xl font-bold text-gray-100">
                    Get Your Sign-up Code
                </h2>
                <p className="mt-2 text-gray-400">
                    Purchase a one-time sign-up code to create your account and get access to the studio.
                </p>
                <div className="my-6">
                    <p className="text-4xl font-bold text-white">
                        Rp 99,000
                    </p>
                    <p className="text-sm text-gray-500">One-time payment</p>
                </div>

                <button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Pay and Get Code</span>
                    )}
                </button>
                <p className="mt-4 text-xs text-yellow-500/80">
                    Note: This is a demo using the Midtrans Sandbox. Do not use real card information.
                </p>
            </>
        )}
      </div>
    </div>
  );
};

export default SignUpCodeModal;