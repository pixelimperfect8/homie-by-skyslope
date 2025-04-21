import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

export default function TypingIndicator() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: '#F4F8FC' }]}>
        <Text style={[styles.text, { color: '#033291' }]}>
          {dots}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    maxWidth: '80%',
  },
  text: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: 2,
  },
}); 