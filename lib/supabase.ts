import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

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
  }
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
};

console.log(`Initializing Supabase client for ${Platform.OS} platform`);

// Add custom fetch with retry logic
const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Supabase fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error,
          attempt: attempt + 1,
        });
        
        // Only retry on specific status codes
        if (response.status === 429 || response.status >= 500) {
          attempt++;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('Max retries reached');
};

// Create the Supabase client with platform-specific configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'homie-real-estate-assistant',
    },
  },
  db: {
    schema: 'public'
  },
});

// Set debug mode in development
if (__DEV__) {
  console.log('Supabase client in debug mode');
}

let isConnected = false;

// Add a health check function
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    console.log('Performing Supabase health check...');
    
    // First check if we have a valid session
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.log('No valid session found');
      isConnected = false;
      return false;
    }

    // Try to fetch a small amount of data to verify connection
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase health check failed:', error.message);
      isConnected = false;
      return false;
    }

    console.log('Supabase health check passed');
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Supabase health check error:', error);
    isConnected = false;
    return false;
  }
};

// Add a function to get connection status
export const getConnectionStatus = () => isConnected;

// Initialize connection status
checkSupabaseHealth().then(status => {
  console.log('Initial connection status:', status);
});

console.log('Supabase client initialized');