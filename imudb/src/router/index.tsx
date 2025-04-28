// src/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout'; // Your main layout wrapper
import ProtectedRoute from '../components/layout/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import SitesPage from '../pages/SitesPage';
import SiteDetailPage from '../pages/SiteDetailPage';
import MapPage from '../pages/MapPage';
import NotFoundPage from '../pages/NotFoundPage'; // Import the NotFoundPage component
// Import other page components...
// Import Admin specific pages if needed

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // This path handles all protected routes under a common layout
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout /> {/* Wrap protected pages with main layout */}
      </ProtectedRoute>
    ),
    // Define child routes relative to the parent '/' path
    children: [
      {
        index: true, // Matches the parent path '/' exactly
        element: <HomePage />,
        // element: <Navigate to="/dashboard" replace />, // Or redirect index
      },
      {
        path: 'sites',
        element: <SitesPage />,
      },
      {
        path: 'sites/:siteId', // Dynamic route parameter
        element: <SiteDetailPage />,
      },
      {
        path: 'map',
        element: <MapPage />,
      },
      // Add routes for ODFs, Devices, Admin sections etc. here
      // Example Admin Route (could have its own ProtectedRoute check for role)
      // {
      //   path: 'admin',
      //   element: <AdminDashboard />, // Assuming Admin role checked inside ProtectedRoute or here
      //   children: [ ... admin sub-routes ... ]
      // }
    ],
  },
  // Add a 404 Not Found route
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);