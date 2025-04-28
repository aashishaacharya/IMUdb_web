// src/components/layout/AppLayout.tsx
import React from 'react';
import { Navbar } from './Navbar'; // Import your Navbar component
import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
    children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = () => {
    return (
        <div className="flex h-screen">
            {/* Sidebar (if you have one) */}
            {/* <aside className="w-64 bg-gray-100">
        //  Your sidebar content here
            </aside> */}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <Navbar /> {/* Include the Navbar here, inside the main content area */}
                <div className="p-6">
                    <Outlet />  {/* This is where the child routes (pages) will be rendered */}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
```react
// src/components/layout/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                    My App
                </Link>
                <div className="space-x-4">
                    <Link to="/sites" className="text-gray-600 hover:text-blue-500 transition-colors">
                        Sites
                    </Link>
                    <Link to="/map" className="text-gray-600 hover:text-blue-500 transition-colors">
                        Map
                    </Link>
                    {/* Add more navigation links as needed */}
                </div>
                 <div>
                    {/* You could add a user profile icon or menu here */}
                    <button className="text-gray-600 hover:text-blue-500 transition-colors">Logout</button>
                </div>
            </div>
        </nav>
    );
};
```react
// src/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout'; // Your main layout wrapper
import ProtectedRoute from '../components/layout/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import SitesPage from '../pages/SitesPage';
import SiteDetailPage from '../pages/SiteDetailPage';
import MapPage from '../pages/MapPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>, // AppLayout within ProtectedRoute
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'sites',
                element: <SitesPage />,
            },
            {
                path: 'sites/:siteId',
                element: <SiteDetailPage />,
            },
            {
                path: 'map',
                element: <MapPage />,
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);
