import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function SplashScreen() {
  const { session, isLoading } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [forceNavigate, setForceNavigate] = useState(false);

  // Debug timer to show how long we've been on the splash screen
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
      
      // Force navigation after 5 seconds if still loading
      if (timer > 5 && isLoading) {
        setForceNavigate(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, isLoading]);

  useEffect(() => {
    console.log('Splash screen - Auth state:', { isLoading, sessionExists: !!session });
    
    // Navigate when auth state is resolved or when forceNavigate is true
    if (!isLoading || forceNavigate) {
      try {
        const navigateTimeout = setTimeout(() => {
          if (session) {
            console.log('Navigating to chat screen');
            router.replace('/chat');
          } else {
            console.log('Navigating to login screen');
            router.replace('/login');
          }
        }, 500); // Reduced to half a second for faster loading
        
        return () => clearTimeout(navigateTimeout);
      } catch (err) {
        console.error('Navigation error:', err);
        setError('Failed to navigate. Please restart the app.');
      }
    }
  }, [session, isLoading, forceNavigate]);

  const handleManualContinue = () => {
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300' }}
        style={styles.logo}
      />
      
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      
      <Text style={styles.appName}>Homie</Text>
      <Text style={styles.tagline}>Your AI Real Estate Assistant</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {/* Show manual continue button after 8 seconds */}
      {timer > 8 && (
        <TouchableOpacity style={styles.continueButton} onPress={handleManualContinue}>
          <Text style={styles.continueText}>Continue to Login</Text>
        </TouchableOpacity>
      )}
      
      {/* Debug info */}
      {Platform.OS === 'web' && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Loading: {isLoading ? 'Yes' : 'No'} | 
            Session: {session ? 'Yes' : 'No'} | 
            Time: {timer}s
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066FF',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  loader: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  continueButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  continueText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  },
});