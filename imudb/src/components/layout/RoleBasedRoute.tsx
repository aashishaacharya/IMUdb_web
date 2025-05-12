import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_ERRORS } from '../../lib/errorMessages';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'editor' | 'viewer'>;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: AUTH_ERRORS.LOGIN_REQUIRED }} replace />;
  }

  if (!userProfile) {
    return <Navigate to="/login" state={{ message: AUTH_ERRORS.NO_PROFILE }} replace />;
  }

  if (!allowedRoles.includes(userProfile.role as 'admin' | 'editor' | 'viewer')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute; 