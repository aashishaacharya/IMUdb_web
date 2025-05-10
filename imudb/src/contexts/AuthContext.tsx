// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  user_id: string; // Changed from id to user_id
  email: string;
  name?: string;
  role?: 'admin' | 'editor' | 'viewer' | 'pending_approval'; // Add 'pending_approval' if you use it
  avatar_url?: string;
  created_at?: string;
}

interface AuthContextProps {
  session: Session | null;
  user: SupabaseUser | null; 
  userProfile: UserProfile | null;
  loading: boolean; 
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (currentSupabaseUser: SupabaseUser) => {
      console.log('[AuthContext] fetchUserProfile: Fetching profile for user ID:', currentSupabaseUser.id);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentSupabaseUser.id)
          .single();

        if (profileError) {
          console.error('[AuthContext] fetchUserProfile: Error fetching user profile:', profileError.message);
          setUserProfile(null);
        } else {
          if (profile) {
            console.log('[AuthContext] fetchUserProfile: Profile fetched:', profile);
            setUserProfile(profile as UserProfile);
          } else {
            console.log('[AuthContext] fetchUserProfile: No profile found for user ID (data is null, no error from Supabase):', currentSupabaseUser.id);
            setUserProfile(null);
          }
        }
      } catch (err: any) {
        console.error('[AuthContext] fetchUserProfile: Unexpected error during Supabase query:', err.message);
        setUserProfile(null);
      }
    };

    // Initial session & profile check
    const fetchInitialData = async () => {
      console.log("[AuthContext] fetchInitialData: Starting...");
      setLoading(true);
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error("[AuthContext] fetchInitialData: Initial getSession error:", sessionError);
        
        setSession(initialSession);
        const initialSupabaseUser = initialSession?.user ?? null;
        setUser(initialSupabaseUser);

        if (initialSupabaseUser) {
          console.log("[AuthContext] fetchInitialData: User found, fetching profile...");
          await fetchUserProfile(initialSupabaseUser);
          console.log("[AuthContext] fetchInitialData: Profile fetch attempt complete.");
        } else {
          console.log("[AuthContext] fetchInitialData: No initial user.");
          setUserProfile(null);
        }
      } catch (error: any) {
        console.error("[AuthContext] fetchInitialData: Error during initial data fetch:", error.message);
        setUserProfile(null); // Ensure profile is null on error
      } finally {
        setLoading(false);
        console.log("[AuthContext] fetchInitialData: Finished, loading set to false.");
      }
    };

    fetchInitialData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[AuthContext] onAuthStateChange: Auth state changed. Event:', _event, 'New session:', !!newSession);
        setLoading(true); 
        try {
          setSession(newSession);
          const newSupabaseUser = newSession?.user ?? null;
          setUser(newSupabaseUser);

          if (newSupabaseUser) {
            console.log("[AuthContext] onAuthStateChange: User found, fetching profile...");
            await fetchUserProfile(newSupabaseUser);
            console.log("[AuthContext] onAuthStateChange: Profile fetch attempt complete.");
          } else {
            console.log("[AuthContext] onAuthStateChange: No new user.");
            setUserProfile(null); 
          }
        } catch (error: any) {
          console.error("[AuthContext] onAuthStateChange: Error during auth state change processing:", error.message);
          setUserProfile(null); // Ensure profile is null on error
        } finally {
          setLoading(false);
          console.log("[AuthContext] onAuthStateChange: Finished, loading set to false.");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
    // onAuthStateChange will handle setting user and userProfile to null
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};