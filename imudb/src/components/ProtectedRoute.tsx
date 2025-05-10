import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserProfile } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, loading, logout } = useAuth();
  const location = useLocation(); 

  // Define which roles are allowed to access protected routes
  const authorizedRoles: Array<UserProfile['role']> = ['admin', 'editor', 'viewer']; // Added 'viewer'

  console.log('[ProtectedRoute] State - loading:', loading, 'user:', !!user, 'userProfile:', userProfile);

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
    console.log('[ProtectedRoute] Render: User authenticated but no profile in user_profiles. Email not registered. Signing out and navigating to /login.');
    logout().catch(e => console.error("[ProtectedRoute] Error during sign out (no profile for email):", e));
    return <Navigate to="/login" state={{ message: "Please contact an administrator to create your credentials or reset them." }} replace />;
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
    console.log('[ProtectedRoute] Render: User role not authorized. Role:', userProfile.role, 'Message:', message, 'Signing out and redirecting to login.');
    logout().catch(e => console.error("[ProtectedRoute] Error during sign out (role not authorized):", e));
    return <Navigate to="/login" state={{ message }} replace />;
  }
};

export default ProtectedRoute; 