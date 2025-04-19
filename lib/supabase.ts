import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Use the provided Supabase URL and anon key
const supabaseUrl = 'https://qjkrnjfbpvbjjdjwyfsj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3JuamZicHZiampkand5ZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDAwMzEsImV4cCI6MjA2MDYxNjAzMX0.V2zEBc3h5FOFCAUss61kT1mfSkM6BKjKsfS6jRggUK0';

// Create a platform-specific storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web environments
    return {
      getItem: (key: string) => {
        try {
          const value = localStorage.getItem(key);
          return Promise.resolve(value);
        } catch (error) {
          console.error('LocalStorage getItem error:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.error('LocalStorage setItem error:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.error('LocalStorage removeItem error:', error);
          return Promise.resolve();
        }
      },
    };
  } else {
    // Use SecureStore for native environments
    return {
      getItem: (key: string) => {
        try {
          return SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('SecureStore getItem error:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          return SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('SecureStore setItem error:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          return SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('SecureStore removeItem error:', error);
          return Promise.resolve();
        }
      },
    };
  }
};

console.log(`Initializing Supabase client for ${Platform.OS} platform`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    // Set longer timeouts for slower networks/processing
    headers: {
      'X-Client-Info': 'homie-real-estate-assistant'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 1
    }
  },
});

// Set debug mode in development
if (__DEV__) {
  // Debug logging is available in the console without needing to call setLogLevel
  console.log('Supabase client in debug mode');
}

console.log('Supabase client initialized');