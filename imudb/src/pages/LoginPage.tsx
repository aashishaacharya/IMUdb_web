// src/pages/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LoginPage.css';
import { AUTH_ERRORS } from '../lib/errorMessages';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const UNREGISTERED_EMAIL_MESSAGE = "Please contact an administrator to create your credentials or reset them.";

  useEffect(() => {
    document.title = 'IMU Birgunj Login Page';
    if (location.state?.message) {
      setError(location.state.message as string);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Get the session after password login
      // const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // if (sessionError || !session) {
      //   setError('Failed to get session');
      //   return;
      // }

      // Navigate to a loading page or home, AuthContext will handle profile loading
      navigate('/loading-session', { replace: true });
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin 
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      // For OAuth, Supabase handles the redirect.
      // The AuthContext will pick up the session change.
      // ProtectedRoute will then handle authorization.
      
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <img src="/src/assets/nt_logo.png" alt="Nepal Telecom Logo" className="logo-img" />
        <h1>Nepal Telecom</h1>
        <p>Welcome to IMU Birgunj</p>
      </div>

      <div className="right-panel">
        <div className="login-form">
          <h2>Login</h2>
          {error && (
            error === UNREGISTERED_EMAIL_MESSAGE ? 
            <p className="error-message" style={{ fontWeight: 'bold', color: 'red' }}>{error}</p> :
            <p className="error-message">{error}</p>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Email</label>
              <input type="email" id="username" name="username" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <div className="google-btn-content">
              <img
                src="https://placehold.co/20x20/white/black?text=G"
                alt="Google Logo"
                className="google-logo"
              />
              {loading ? 'Logging in...' : 'Login with Google'}
            </div>
          </button>

          <div className="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;