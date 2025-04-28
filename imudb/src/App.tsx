// Example snippet in src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute'; // Import
import HomePage from './pages/HomePage';
import SitesPage from './pages/SitesPage';
import LoginPage from './pages/LoginPage';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sites" element={<SitesPage />} />
          {/* Add other protected pages here */}
          {/* <Route path="/map" element={<MapPage />} /> */}
          {/* <Route path="/sites/:siteId" element={<SiteDetailPage />} /> */}
        </Route>

        {/* Add public routes or 404 route if needed */}
      </Routes>
    </BrowserRouter>
  );
}