import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LoadingSession from './pages/LoadingSession';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleBasedRoute from './components/layout/RoleBasedRoute';
import './App.css';

// Placeholder components - these will be created separately
const Dashboard = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Dashboard Content</h2><p>Welcome to the IMU Birgunj dashboard.</p></div>;
const SiteManagement = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Site Management</h2><p>Manage all your sites here.</p></div>;
const UserManagement = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">User Management</h2><p>Manage system users here.</p></div>;
const PendingEdits = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Pending Edits</h2><p>Review pending changes here.</p></div>;
const OpticalData = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Optical Data</h2><p>View and manage optical data here.</p></div>;
const BulkExport = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Bulk Export</h2><p>Export data in bulk here.</p></div>;
const Settings = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Settings</h2><p>Manage system settings here.</p></div>;

// Layout Route component that applies the dashboard layout
const ProtectedLayout = () => (
  <RoleBasedRoute allowedRoles={['admin', 'editor', 'viewer']}>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </RoleBasedRoute>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/loading-session" element={<LoadingSession />} />
      
      {/* Dashboard layout with nested routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sites" element={<SiteManagement />} />
        <Route path="/optical-data" element={<OpticalData />} />
        
        {/* Admin only routes */}
        <Route path="/users" element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <UserManagement />
          </RoleBasedRoute>
        } />
        <Route path="/settings" element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <Settings />
          </RoleBasedRoute>
        } />
        
        {/* Admin and Editor routes */}
        <Route path="/pending-edits" element={
          <RoleBasedRoute allowedRoles={['admin', 'editor']}>
            <PendingEdits />
          </RoleBasedRoute>
        } />
        <Route path="/export" element={
          <RoleBasedRoute allowedRoles={['admin', 'editor']}>
            <BulkExport />
          </RoleBasedRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;