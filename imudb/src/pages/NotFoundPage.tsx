import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center text-center p-4">
      <img src="/src/assets/nt_logo.png" alt="Nepal Telecom Logo" className="h-20 w-auto mb-8" /> 
      <h1 className="text-6xl font-bold text-blue-700 mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-blue-600 mb-6">Page Not Found</h2>
      <p className="text-lg text-gray-700 mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors duration-300 ease-in-out"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage; 