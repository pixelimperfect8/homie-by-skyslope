import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
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

  useEffect(() => {
    let authTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set a timeout to prevent auth hanging indefinitely
        authTimeout = setTimeout(() => {
          console.log('Auth initialization timeout reached');
          setIsLoading(false);
        }, 5000);
        
        const { data } = await supabase.auth.getSession();
        console.log('Auth session loaded:', !!data.session);
        setSession(data.session);
        
        if (data.session?.user) {
          console.log('User is logged in, fetching profile');
          await fetchUser(data.session.user.id);
        } else {
          console.log('No active session');
          setUser(null);
        }
        
        clearTimeout(authTimeout);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        console.log('Auth initialization complete');
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        
        if (session?.user) {
          console.log('User session updated, fetching profile');
          await fetchUser(session.user.id);
        } else {
          console.log('User logged out or session expired');
          setUser(null);
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
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
        console.log('Profile not found, creating default profile');
        try {
          // Try to create a default profile
          const { error: insertError } = await supabase.auth.admin.createUser({
            email: 'default@example.com',
            password: 'password',
            email_confirm: true,
          });
          
          if (insertError) {
            console.error('Error creating default user:', insertError);
          }
          
          const { data: userData, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email: 'default@example.com',
                name: 'Default User',
                user_type: 'buyer',
                created_at: new Date().toISOString(),
              }
            ])
            .select();
          
          if (profileError) {
            console.error('Error creating default profile:', profileError);
            setUser(null);
          } else if (userData && userData.length > 0) {
            console.log('Created default user profile');
            setUser(userData[0]);
          }
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Creating new user account...');
      
      // For demo purposes, add a special check for demo@example.com
      if (email === "demo@example.com") {
        console.log('Creating demo account');
        
        // Try to delete existing demo user if it exists (for development/testing)
        try {
          const { data: existingUser } = await supabase.auth.signInWithPassword({
            email: "demo@example.com",
            password: "password"
          });
          
          if (existingUser.user) {
            console.log('Found existing demo user, cleaning up');
            // Cannot delete users without admin privileges, so we'll just use the existing account
          }
        } catch (e) {
          console.log('No existing demo user or cleanup failed, continuing');
        }
      }
      
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
        
        // Create a profile for the new user
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: email.trim(),
            name,
            user_type: 'buyer', // Default user type
            created_at: new Date().toISOString(),
          }
        ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }

        console.log('User profile created successfully');
        
        // Set the user and session directly to avoid navigation issues
        setSession(data.session);
        setUser({
          id: data.user.id,
          email: email.trim(),
          name,
          user_type: 'buyer',
          created_at: new Date().toISOString()
        });
        
        // Redirect to onboarding after signup
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1000);
      }

      return { error: null };
    } catch (error) {
      console.error('Error during signup:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email);
      
      // For demo purposes, also support demo credentials
      if (email === "demo@example.com" && password === "password") {
        try {
          console.log('Using demo credentials');
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!error) {
            console.log('Demo login successful');
            router.replace('/chat');
            return { error: null };
          }
        } catch (e) {
          console.log('Error with demo login, falling back to regular signin');
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        console.log('Login successful, navigating to chat');
        router.replace('/chat');
      } else {
        console.error('Login failed:', error);
      }

      return { error };
    } catch (error) {
      console.error('Error during sign in:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    console.log('User signed out, navigating to login');
    router.replace('/login');
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