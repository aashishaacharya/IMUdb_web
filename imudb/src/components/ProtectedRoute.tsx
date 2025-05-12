import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserProfile } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, loading, logout } = useAuth();
  const location = useLocation(); 
  const [profileWaitTime, setProfileWaitTime] = useState(0);

  // Define which roles are allowed to access protected routes
  const authorizedRoles: Array<UserProfile['role']> = ['admin', 'editor', 'viewer']; // Added 'viewer'

  console.log('[ProtectedRoute] State - loading:', loading, 'user:', !!user, 'userProfile:', userProfile);

  // Add wait timer if we have user but no profile
  useEffect(() => {
    let timer: number | undefined;
    
    if (!loading && user && !userProfile && profileWaitTime < 3) { // Wait up to 3 seconds
      console.log(`[ProtectedRoute] User exists but no profile. Waiting ${profileWaitTime + 1}s before logout decision.`);
      timer = window.setTimeout(() => {
        setProfileWaitTime(prev => prev + 1);
      }, 1000); // Wait 1 second
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [user, userProfile, loading, profileWaitTime]);

  // useEffect to handle side effects like logout based on user/userProfile changes
  useEffect(() => {
    if (!loading) { // Only run logic if not in initial loading state
      // Only proceed if we've waited enough time and still no profile
      if (user && !userProfile && profileWaitTime >= 3) {
        console.log('[ProtectedRoute] useEffect: User authenticated but no profile after wait. Triggering logout.');
        logout().catch(e => console.error("[ProtectedRoute] useEffect: Error during sign out (no profile for email):", e));
      } else if (user && userProfile && userProfile.role && !authorizedRoles.includes(userProfile.role)) {
        console.log('[ProtectedRoute] useEffect: User role not authorized. Triggering logout.');
        logout().catch(e => console.error("[ProtectedRoute] useEffect: Error during sign out (role not authorized):", e));
      }
    }
  }, [user, userProfile, loading, logout, authorizedRoles, profileWaitTime]); // Added profileWaitTime

  if (loading) {
    console.log('[ProtectedRoute] Render: AuthContext still loading, showing spinner.');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) { // Not authenticated with Supabase
    console.log('[ProtectedRoute] Render: No Supabase user. Navigating to /login.');
    return <Navigate to="/login" state={{ from: location, message: "Please log in to continue." }} replace />;
  }

  if (!userProfile) { // Authenticated with Supabase, but email not found in user_profiles
    // Show spinner while waiting to confirm no profile exists
    if (profileWaitTime < 3) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-blue-600">Verifying user profile... ({profileWaitTime}s)</p>
        </div>
      );
    }
    
    console.log('[ProtectedRoute] Render: User authenticated but no profile after wait. Redirecting.');
    return <Navigate to="/login" state={{ message: "Profile issue. Please contact an administrator or try logging in again." }} replace />;
  }

  // At this point, user and userProfile exist. Check the role.
  if (userProfile.role && authorizedRoles.includes(userProfile.role)) {
    console.log('[ProtectedRoute] Render: User role is authorized. Role:', userProfile.role, 'Rendering children.');
    return <>{children}</>; 
  } else {
    // User has a profile, but their role is not in the authorizedRoles list.
    const message = userProfile.role === 'pending_approval' 
      ? "Your account is awaiting admin approval. Please contact the administrator."
      : "Your account does not have sufficient permissions to access this page. Please contact the administrator.";
    console.log('[ProtectedRoute] Render: User role not authorized. Role:', userProfile.role, 'Message:', message, 'Waiting for useEffect to logout or navigating.');
    // The useEffect will handle logout. Show a message or redirect immediately.
    return <Navigate to="/login" state={{ message }} replace />;
  }
};

export default ProtectedRoute; 