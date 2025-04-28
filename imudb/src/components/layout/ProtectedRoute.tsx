// src/components/layout/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return <div>Loading...</div>;
  }

  if (!session) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is logged in, render the child route component
  return <Outlet />; // Outlet renders the matched child route element
};

export default ProtectedRoute;