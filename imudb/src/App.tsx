import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LoadingSession from './pages/LoadingSession';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleBasedRoute from './components/layout/RoleBasedRoute';
import Dashboard from './components/pages/Dashboard';
import SiteManagement from './components/pages/SiteManagement';
import SiteMap from './components/pages/SiteMap';
import PageLayout from './components/layout/PageLayout';
import RecentUpdates from './components/pages/RecentUpdates';
import SiteDetailPage from './pages/SiteDetailPage';
import AddSitePage from './pages/AddSitePage';
import EditSitePage from './pages/EditSitePage';
import PendingEditsPage from './pages/PendingEditsPage';
import './App.css';

// Placeholder components with proper mock content
const UserManagement = () => (
  <PageLayout title="User Management" actions={<button className="button">+ Add User</button>}>
    <div className="content-card">
      <div className="filter-row">
        <div className="search-box">
          <input type="text" placeholder="Search users..." className="form-control" />
        </div>
        <div className="filter-actions">
          <button className="button">Filter</button>
          <button className="link">Clear</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>USR-001</td>
              <td>John Admin</td>
              <td>john@example.com</td>
              <td>Admin</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">Edit</button>
                  <button className="link">Deactivate</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>USR-002</td>
              <td>Sarah Editor</td>
              <td>sarah@example.com</td>
              <td>Editor</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">Edit</button>
                  <button className="link">Deactivate</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>USR-003</td>
              <td>Mike Viewer</td>
              <td>mike@example.com</td>
              <td>Viewer</td>
              <td><span className="status-badge inactive">Inactive</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">Edit</button>
                  <button className="link">Activate</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </PageLayout>
);

const OpticalData = () => (
  <PageLayout title="Optical Data" actions={<button className="button">+ Add Data</button>}>
    <div className="content-card">
      <div className="filter-row">
        <div className="search-box">
          <input type="text" placeholder="Search connections..." className="form-control" />
        </div>
        <div className="filter-actions">
          <button className="button">Filter</button>
          <button className="link">Clear</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Connection ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Fiber Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CONN-001</td>
              <td>Birgunj Central</td>
              <td>Kathmandu Main</td>
              <td>Single Mode</td>
              <td>10 Gbps</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">View</button>
                  <button className="link">Edit</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>CONN-002</td>
              <td>Pokhara Exchange</td>
              <td>Kathmandu Main</td>
              <td>Multi Mode</td>
              <td>40 Gbps</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">View</button>
                  <button className="link">Edit</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>CONN-003</td>
              <td>Janakpur Link</td>
              <td>Birgunj Central</td>
              <td>Single Mode</td>
              <td>5 Gbps</td>
              <td><span className="status-badge maintenance">Maintenance</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">View</button>
                  <button className="link">Edit</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="content-card">
      <h2>Network Status</h2>
      <div className="content-card-row">
        <div className="stat-box">
          <div className="stat-value">45</div>
          <div className="stat-label">Total Connections</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">39</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">3</div>
          <div className="stat-label">Maintenance</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">3</div>
          <div className="stat-label">Inactive</div>
        </div>
      </div>
    </div>
  </PageLayout>
);

const BulkExport = () => (
  <PageLayout title="Bulk Export" actions={<button className="button">Start Export</button>}>
    <div className="content-card">
      <h2>Data Export Options</h2>
      
      <div className="form-group">
        <label>Export Type</label>
        <select className="form-control">
          <option value="all">All Data</option>
          <option value="sites">Sites Only</option>
          <option value="connections">Connections Only</option>
          <option value="equipment">Equipment Only</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Format</label>
        <select className="form-control">
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="json">JSON</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Date Range</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="date" className="form-control" placeholder="Start Date" />
          <input type="date" className="form-control" placeholder="End Date" />
        </div>
      </div>
    </div>
    
    <div className="content-card">
      <h2>Previous Exports</h2>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Export ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Format</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EXP-001</td>
              <td>2025-03-20</td>
              <td>All Data</td>
              <td>Excel</td>
              <td>2.4 MB</td>
              <td><span className="status-badge active">Completed</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">Download</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>EXP-002</td>
              <td>2025-03-15</td>
              <td>Sites Only</td>
              <td>CSV</td>
              <td>1.1 MB</td>
              <td><span className="status-badge active">Completed</span></td>
              <td>
                <div className="row-actions">
                  <button className="link">Download</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </PageLayout>
);

const Settings = () => (
  <PageLayout title="System Settings">
    <div className="content-card">
      <h2>General Settings</h2>
      
      <div className="form-group">
        <label>System Name</label>
        <input type="text" className="form-control" value="IMU Birgunj" />
      </div>
      
      <div className="form-group">
        <label>Admin Email</label>
        <input type="email" className="form-control" value="admin@ntc.com.np" />
      </div>
      
      <div className="form-group">
        <label>Default Language</label>
        <select className="form-control">
          <option value="en">English</option>
          <option value="ne">Nepali</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Timezone</label>
        <select className="form-control">
          <option value="asia/kathmandu">Asia/Kathmandu (UTC+5:45)</option>
          <option value="utc">UTC</option>
        </select>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button className="button">Save Changes</button>
      </div>
    </div>
    
    <div className="content-card">
      <h2>Backup & Maintenance</h2>
      <div className="content-card-row">
        <div className="stat-box">
          <div className="stat-value">Daily</div>
          <div className="stat-label">Backup Schedule</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">15</div>
          <div className="stat-label">Backups Available</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">98%</div>
          <div className="stat-label">Database Health</div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button className="button">Backup Now</button>
        <button className="button">Restore</button>
        <button className="button">Clear Cache</button>
      </div>
    </div>
  </PageLayout>
);

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
        <Route path="/sites/new" element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <AddSitePage />
          </RoleBasedRoute>
        } />
        <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        <Route path="/sites/:siteId/edit" element={<EditSitePage />} />
        <Route path="/site-map" element={<SiteMap />} />
        <Route path="/optical-data" element={<OpticalData />} />
        <Route path="/recent-updates" element={<RecentUpdates />} />
        
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
            <PendingEditsPage />
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