// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Increase timeout drastically to handle potential Supabase query delays
const PROFILE_FETCH_TIMEOUT = 60000; // 60 seconds - maximizing chance of successful fetch
const USER_PROFILE_CACHE_KEY = 'imudbUserProfile';
const USER_PROFILE_CACHE_TIMESTAMP_KEY = 'imudbUserProfileTimestamp';
const PROFILE_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours - aggressive caching
// Add new flag to track auth initialization
const AUTH_INITIALIZED_KEY = 'imudbAuthInitialized';

// Add tracking for auth events to optimize tab changes
const LAST_AUTH_EVENT_KEY = 'imudbLastAuthEvent';
const LAST_AUTH_EVENT_TIME_KEY = 'imudbLastAuthEventTime';
const AUTH_EVENT_COOLDOWN_MS = 2000; // 2 seconds cooldown between duplicate events

export interface UserProfile {
  user_id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'editor' | 'viewer' | 'pending_approval';
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
  console.log('[AuthProvider] Component body: Rendering or Re-rendering');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetchingProfileRef = useRef(false);
  const isInitializedRef = useRef(localStorage.getItem(AUTH_INITIALIZED_KEY) === 'true');

  // Helper to set profile state and update localStorage
  const updateProfileStateAndCache = (profile: UserProfile | null, callback?: () => void) => {
    console.log('[AuthContext] updateProfileStateAndCache:', profile ? 'Profile exists' : 'No profile');
    setUserProfile(profile);
    
    if (profile) {
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profile));
      localStorage.setItem(USER_PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      localStorage.removeItem(USER_PROFILE_CACHE_TIMESTAMP_KEY);
    }
    
    // If a callback was provided, call it after the state update
    if (callback) {
      setTimeout(callback, 0);
    }
  };

  // Get cached profile if available and valid
  const getCachedProfile = (userId: string): UserProfile | null => {
    try {
      const cachedProfileString = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      const cachedTimestampString = localStorage.getItem(USER_PROFILE_CACHE_TIMESTAMP_KEY);
      
      if (!cachedProfileString || !cachedTimestampString) return null;
      
      const cachedTimestamp = parseInt(cachedTimestampString, 10);
      if ((Date.now() - cachedTimestamp) > PROFILE_CACHE_DURATION_MS) return null;
      
      const parsedProfile = JSON.parse(cachedProfileString) as UserProfile;
      if (parsedProfile.user_id !== userId) return null;
      
      console.log('[AuthContext] getCachedProfile: Using valid profile from cache.');
      return parsedProfile;
    } catch (e) {
      console.error("[AuthContext] getCachedProfile: Error parsing cached profile:", e);
      localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      localStorage.removeItem(USER_PROFILE_CACHE_TIMESTAMP_KEY);
      return null;
    }
  };

  // Helper to check if an auth event should be processed or skipped (for tab changes)
  const shouldProcessAuthEvent = (event: string): boolean => {
    // Always process these critical events
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      return true;
    }
    
    const lastEvent = localStorage.getItem(LAST_AUTH_EVENT_KEY);
    const lastEventTimeString = localStorage.getItem(LAST_AUTH_EVENT_TIME_KEY);
    
    if (lastEvent === event && lastEventTimeString) {
      const lastEventTime = parseInt(lastEventTimeString, 10);
      const timeSinceLastEvent = Date.now() - lastEventTime;
      
      // If this is a duplicate event within the cooldown period, skip it
      if (timeSinceLastEvent < AUTH_EVENT_COOLDOWN_MS) {
        console.log(`[AuthContext] Skipping duplicate auth event "${event}" (${timeSinceLastEvent}ms since last one)`);
        return false;
      }
    }
    
    // Update the last event tracking
    localStorage.setItem(LAST_AUTH_EVENT_KEY, event);
    localStorage.setItem(LAST_AUTH_EVENT_TIME_KEY, Date.now().toString());
    return true;
  };

  const fetchUserProfile = async (currentSupabaseUser: SupabaseUser): Promise<UserProfile | null> => {
    if (isFetchingProfileRef.current) {
      console.log(`[AuthContext] fetchUserProfile: SKIPPING, fetch already in progress for user ID: ${currentSupabaseUser.id}`);
      return null;
    }
    
    // Try cache first
    const cachedProfile = getCachedProfile(currentSupabaseUser.id);
    if (cachedProfile) {
      console.log('[AuthContext] fetchUserProfile: Using cached profile, no network call needed');
      // Don't update state directly here - let the caller handle this 
      // so the loading state can be properly synchronized
      return cachedProfile;
    }
    
    isFetchingProfileRef.current = true;
    console.log(`[AuthContext] fetchUserProfile: ENTERING for user ID: ${currentSupabaseUser.id}`);

    const fetchPromise = supabase
      .from('user_profiles')
      .select('*')
      .filter('user_id', 'eq', currentSupabaseUser.id)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timed out')), PROFILE_FETCH_TIMEOUT)
    );

    try {
      console.log(`[AuthContext] fetchUserProfile: ATTEMPTING Supabase query for user_id: ${currentSupabaseUser.id}`);
      // @ts-ignore
      const { data: dbProfile, error: profileError } = await Promise.race([fetchPromise, timeoutPromise]);
      console.log(`[AuthContext] fetchUserProfile: Supabase query COMPLETED. Error: ${profileError}, Profile: ${!!dbProfile}`);

      if (profileError) {
        console.error('[AuthContext] fetchUserProfile: Supabase query error:', profileError.message);
        isFetchingProfileRef.current = false;
        return null;
      } else {
        if (dbProfile) {
          console.log('[AuthContext] fetchUserProfile: Profile data FOUND:', dbProfile);
          // Don't call updateProfileStateAndCache here - let the caller handle state updates
          // This ensures loading state coordination
          isFetchingProfileRef.current = false;
          return dbProfile as UserProfile;
        } else {
          console.log('[AuthContext] fetchUserProfile: No profile data returned from DB.');
          isFetchingProfileRef.current = false;
          return null;
        }
      }
    } catch (err: any) {
      console.error('[AuthContext] fetchUserProfile: UNEXPECTED JS error or TIMEOUT:', err.message);
      isFetchingProfileRef.current = false;
      
      // IMPORTANT: For initial login, if the fetch times out, check cache once more as a fallback
      const emergencyCachedProfile = getCachedProfile(currentSupabaseUser.id);
      if (emergencyCachedProfile) {
        console.log('[AuthContext] fetchUserProfile: Fetch failed but using emergency cached profile');
        return emergencyCachedProfile;
      }
      
      return null;
    }
  };

  // Single, simple effect to set up auth
  useEffect(() => {
    console.log('[AuthContext] useEffect: Setting up authentication...');
    let didUnmount = false;

    // This is the primary function that handles auth state changes
    const handleAuthChange = async (session: Session | null, event?: string) => {
      if (didUnmount) return;
      
      console.log('[AuthContext] handleAuthChange:', session ? 'Session exists' : 'No session');
      
      // If auth is already initialized and we have a valid session and profile in state,
      // we can optimize by avoiding full reinitialization on tab changes
      if (isInitializedRef.current && session && user && userProfile && 
          event && event !== 'SIGNED_OUT' && event !== 'USER_DELETED') {
        console.log('[AuthContext] handleAuthChange: Auth already initialized with valid session and profile. Optimizing for tab change.');
        return;
      }
      
      // Set loading true at the start of any auth change
      setLoading(true);
      
      // Always update session state
      setSession(session);
      
      // If no session, clear everything and we're done
      if (!session) {
        setUser(null);
        updateProfileStateAndCache(null, () => {
          if (!didUnmount) setLoading(false);
        });
        return;
      }
      
      // We have a session, update user
      const currentUser = session.user;
      setUser(currentUser);
      
      // IMPORTANT: Keep loading true until profile fetch completes
      // Try to get profile (first from cache, then from DB)
      try {
        console.log('[AuthContext] handleAuthChange: Fetching profile - keeping loading true');
        const profile = await fetchUserProfile(currentUser);
        if (didUnmount) return;
        
        // Now we need to ensure loading remains true until the state update for profile is processed
        // Use the new callback to ensure the sequence
        if (profile) {
          console.log('[AuthContext] handleAuthChange: Profile found, updating state with callback for loading');
          updateProfileStateAndCache(profile, () => {
            if (!didUnmount) {
              setLoading(false);
              // Mark as initialized after successful profile load
              isInitializedRef.current = true;
              localStorage.setItem(AUTH_INITIALIZED_KEY, 'true');
            }
          });
        } else {
          console.warn('[AuthContext] handleAuthChange: No profile found for user, setting loading false');
          if (!didUnmount) setLoading(false);
        }
      } catch (e) {
        console.error("[AuthContext] handleAuthChange: Error fetching profile:", e);
        // Error case - just set loading to false
        if (!didUnmount) setLoading(false);
      }
    };

    // Initial setup
    setLoading(true);
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (didUnmount) return;
        handleAuthChange(initialSession);
      })
      .catch(error => {
        console.error("[AuthContext] Initial getSession error:", error);
        if (didUnmount) return;
        setSession(null);
        setUser(null);
        updateProfileStateAndCache(null, () => {
          if (!didUnmount) setLoading(false);
        });
      });
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[AuthContext] onAuthStateChange event:', event);
        
        // Skip duplicate/unnecessary auth events
        if (!shouldProcessAuthEvent(event)) {
          console.log('[AuthContext] Skipping redundant auth event:', event);
          return;
        }
        
        handleAuthChange(newSession, event);
      }
    );

    // Cleanup
    return () => {
      didUnmount = true;
      authListener?.subscription.unsubscribe();
      console.log('[AuthContext] useEffect cleanup - unsubscribed auth listener');
    };
  }, []);  // Empty dependency array - run once on mount

  const logout = async () => {
    console.log('[AuthContext] logout: Attempting sign out...');
    updateProfileStateAndCache(null);
    isFetchingProfileRef.current = false;
    
    // Reset initialized state
    isInitializedRef.current = false;
    localStorage.removeItem(AUTH_INITIALIZED_KEY);
    localStorage.removeItem(LAST_AUTH_EVENT_KEY);
    localStorage.removeItem(LAST_AUTH_EVENT_TIME_KEY);

    const { error } = await supabase.auth.signOut();
    if (error) console.error("[AuthContext] logout: Error:", error.message);
  };

  const value = { session, user, userProfile, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};