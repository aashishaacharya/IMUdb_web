// Example in src/components/layout/Navbar.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div>FiberApp</div>
      <div>
        {user ? (
          <>
            <span className="mr-4">{user.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <span>Not logged in</span> // Or link to login
        )}
      </div>
    </nav>
  );
};

export default Navbar;