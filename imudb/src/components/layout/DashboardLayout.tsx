import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/DashboardLayout.css';

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  roles: Array<'admin' | 'editor' | 'viewer'>;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: ['admin', 'editor', 'viewer']
  },
  {
    label: 'Site Management',
    path: '/sites',
    icon: '🏢',
    roles: ['admin', 'editor', 'viewer']
  },
  {
    label: 'User Management',
    path: '/users',
    icon: '👥',
    roles: ['admin']
  },
  {
    label: 'Pending Edits',
    path: '/pending-edits',
    icon: '⏳',
    roles: ['admin', 'editor']
  },
  {
    label: 'Optical Data',
    path: '/optical-data',
    icon: '🔍',
    roles: ['admin', 'editor', 'viewer']
  },
  {
    label: 'Bulk Export',
    path: '/export',
    icon: '📤',
    roles: ['admin', 'editor']
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: '⚙️',
    roles: ['admin']
  }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => 
    userProfile?.role && item.roles.includes(userProfile.role as 'admin' | 'editor' | 'viewer')
  );

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src="/src/assets/nt_logo.png" alt="Nepal Telecom Logo" className="logo-img" />
          <h2>IMU Birgunj</h2>
        </div>
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <a href={item.path} onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}>
                {item.icon && <span className="menu-icon">{item.icon}</span>}
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}>
              <span className="menu-icon">🚪</span>
              Logout
            </a>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="top-bar">
          <h1>Welcome, {userProfile?.name || user?.email}</h1>
          <div className="user-info">
            <span>{userProfile?.role || 'User'}</span>
          </div>
        </header>

        <section className="dashboard-content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout; 