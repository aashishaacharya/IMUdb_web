// src/pages/LoginPage.tsx
import React from 'react';
import { supabase } from '../lib/supabaseClient'; // Import your configured client

const LoginPage: React.FC = () => {

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Optional: Add options like redirectTo if needed
      // options: {
      //   redirectTo: window.location.origin // Redirect back after login
      // }
    });
    if (error) {
      console.error('Error logging in with Google:', error.message);
      // Handle error display to user
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 border rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Login with Google
        </button>
        {/* You might add other login methods here later */}
      </div>
    </div>
  );
};

export default LoginPage;