import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { Platform, Alert } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateUserType: (userType: 'buyer' | 'owner') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  // Helper function to check current route
  const isInAuthGroup = () => segments.includes('(auth)');
  const isInOnboarding = () => segments.includes('onboarding');

  useEffect(() => {
    let authTimeout: NodeJS.Timeout;
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Increase timeout to 30 seconds for slower connections
        authTimeout = setTimeout(() => {
          if (mounted) {
            console.log('Auth initialization timeout reached');
            setIsLoading(false);
            setAuthInitialized(true);
          }
        }, 30000);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        console.log('Auth session loaded:', !!session);
        
        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('User is logged in, fetching profile');
            await fetchUser(session.user.id);
          } else {
            console.log('No active session');
            setUser(null);
            // Redirect to login if not in onboarding
            if (!isInOnboarding() && !isInAuthGroup()) {
              router.replace('/login');
            }
          }
          
          setIsLoading(false);
          setAuthInitialized(true);
          clearTimeout(authTimeout);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('User session updated, fetching profile');
            await fetchUser(session.user.id);
            
            // Navigate to chat if coming from login
            if (isInAuthGroup()) {
              router.replace('/chat');
            }
          } else {
            console.log('User logged out or session expired');
            setUser(null);
            // Redirect to login unless already there or in onboarding
            if (!isInOnboarding() && !isInAuthGroup()) {
              router.replace('/login');
            }
          }
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      mounted = false;
      clearTimeout(authTimeout);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string) => {
    if (!userId) {
      console.log('No user ID provided for fetching user data');
      setUser(null);
      return;
    }

    try {
      console.log('Fetching user profile for ID:', userId);
      // Remove .single() to avoid PGRST116 error when no profile is found
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (error) {
        console.error('Database error fetching user profile:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('User profile loaded successfully');
        setUser(data[0]);
      } else {
        // Profile not found - this indicates an issue, likely during signup.
        // Do not attempt to create a default profile here.
        console.error('Profile not found for user ID:', userId, '. This likely means profile creation failed during signup.');
        setUser(null); // Set user to null as the state is inconsistent
        // Consider adding more robust error handling or reporting here
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Creating new user account...');
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            user_type: 'buyer'
          }
        }
      });

      if (error) {
        console.error('Error during signup:', error);
        return { error };
      }

      if (data.user) {
        console.log('User created with ID:', data.user.id);
        
        // Retry profile creation up to 3 times
        let profileError = null;
        for (let i = 0; i < 3; i++) {
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              email: email.trim(),
              name: name.trim(),
              user_type: 'buyer',
              created_at: new Date().toISOString(),
            }
          ]);
          
          if (!insertError) {
            console.log('User profile created successfully');
            profileError = null;
            break;
          }
          
          console.error(`Profile creation attempt ${i + 1} failed:`, insertError);
          profileError = insertError;
          
          if (i < 2) { // Don't wait on the last attempt
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
          }
        }

        if (profileError) {
          return { error: { message: 'Failed to create user profile. Please try again.' } };
        }

        setSession(data.session);
        setUser({
          id: data.user.id,
          email: email.trim(),
          name: name.trim(),
          user_type: 'buyer',
          created_at: new Date().toISOString()
        });
        
        router.replace('/onboarding');
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error during signup:', error);
      return { error: { message: error.message || 'An unexpected error occurred during signup.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email);
      setIsLoading(true);
      
      // Increase timeout to 20 seconds
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Sign-in request timed out. Please check your connection and try again.'));
        }, 20000);
      });

      // Race between the sign-in and timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        timeoutPromise
      ]);

      if (error) {
        console.error('Login failed:', error);
        // Return more specific error messages
        if (error.message.includes('timeout')) {
          return { error: { message: 'Connection timeout. Please try again.' } };
        } else if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email or password.' } };
        } else {
          return { error: { message: 'Login failed. Please try again.' } };
        }
      }

      if (data?.user) {
        console.log('Login successful, fetching user profile');
        await fetchUser(data.user.id);
        console.log('Profile fetched, navigating to chat');
        router.replace('/chat');
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error during sign in:', error);
      return { error: { message: error.message || 'An unexpected error occurred.' } };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setIsLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      console.log('User signed out, navigating to login');
      router.replace('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Sending password reset email to:', email);
      const redirectTo = Platform.OS === 'web' 
        ? window.location.origin + '/reset-password'
        : 'homie://reset-password';
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (!error) {
        console.log('Password reset email sent successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  const updateUserType = async (userType: 'buyer' | 'owner') => {
    if (!user) {
      console.log('Cannot update user type: No user is currently logged in');
      return;
    }
    
    try {
      console.log('Updating user type to:', userType);
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: userType })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user type in database:', error);
        throw error;
      }

      setUser({ ...user, user_type: userType });
      console.log('User type updated successfully to:', userType);
    } catch (error) {
      console.error('Error updating user type:', error);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserType,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}