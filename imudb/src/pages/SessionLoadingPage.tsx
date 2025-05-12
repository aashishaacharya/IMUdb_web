import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AUTH_ERRORS } from '../lib/errorMessages'; // Assuming you have this

const SessionLoadingPage: React.FC = () => {
  const { user, userProfile, loading, session } = useAuth(); // session is from AuthContextProps
  const navigate = useNavigate();
  const [profileWaitTime, setProfileWaitTime] = useState(0);
  
  // If user exists but profile doesn't, give it a bit more time before redirecting
  useEffect(() => {
    let timer: number | undefined;
    
    if (!loading && user && !userProfile && profileWaitTime < 3) { // Increased to 3 seconds to match ProtectedRoute
      console.log(`[SessionLoadingPage] User exists but no profile. Waiting ${profileWaitTime + 1}s before decision.`);
      timer = window.setTimeout(() => {
        setProfileWaitTime(prev => prev + 1);
      }, 1000); // Wait 1 second
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [user, userProfile, loading, profileWaitTime]);

  useEffect(() => {
    console.log('[SessionLoadingPage] State Check - loading:', loading, 'user:', !!user, 'userProfile:', !!userProfile, 'session:', session ? session.expires_at : null);
    
    // Only make decisions once AuthContext has finished its loading cycle
    if (loading === false) {
      if (user && userProfile) {
        console.log('[SessionLoadingPage] Condition Met: User and profile loaded. Navigating to /home.');
        navigate('/home', { replace: true });
      } else if (user && !userProfile) {
        // Only redirect if we've waited long enough
        if (profileWaitTime >= 3) { // Increased to 3 seconds to match ProtectedRoute
          console.log('[SessionLoadingPage] Condition Met: User loaded, no profile after wait. Navigating to /login with NO_PROFILE error.');
          navigate('/login', { 
            replace: true, 
            state: { message: AUTH_ERRORS.NO_PROFILE }
          });
        }
      } else if (!user) { // Covers session === null or other cases where user isn't established post-loading
        console.log('[SessionLoadingPage] Condition Met: No user after loading. Navigating to /login with LOGIN_REQUIRED error.');
        navigate('/login', { 
          replace: true, 
          state: { message: AUTH_ERRORS.LOGIN_REQUIRED }
        });
      } else {
        // This case should ideally not be hit if the logic above is comprehensive
        console.warn('[SessionLoadingPage] Unhandled state after loading - user:', !!user, 'userProfile:', !!userProfile);
      }
    }
  }, [user, userProfile, loading, session, navigate, profileWaitTime]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <img src="/src/assets/nt_logo.png" alt="Nepal Telecom Logo" className="h-16 w-auto mb-6" />
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg text-gray-700">Finalizing your session, please wait...</p>
      {!loading && user && !userProfile && profileWaitTime > 0 && (
        <p className="text-sm text-blue-600 mt-2">Fetching user profile... ({profileWaitTime}s)</p>
      )}
    </div>
  );
};

export default SessionLoadingPage; 