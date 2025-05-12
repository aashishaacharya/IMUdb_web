import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoadingSession: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const navigate = useNavigate();

  // Set a timeout to avoid infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading || loadingTimeout) {
      if (user && userProfile) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (user && !userProfile) {
        navigate('/login', { 
          state: { message: 'Your account needs to be set up by an administrator.' }, 
          replace: true 
        });
        return;
      }

      if (!user) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, userProfile, loading, loadingTimeout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading your session...</h2>
        <p className="text-gray-500 mt-2">Please wait while we prepare your dashboard.</p>
      </div>
    </div>
  );
};

export default LoadingSession; 