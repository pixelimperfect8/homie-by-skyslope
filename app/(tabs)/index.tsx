import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

// Redirect tab index to chat
export default function TabIndexScreen() {
  useEffect(() => {
    router.replace('/chat');
  }, []);

  return <Text>Redirecting...</Text>;
}