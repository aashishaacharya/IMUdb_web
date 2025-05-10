// src/router/index.tsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);