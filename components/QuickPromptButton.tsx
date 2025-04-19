import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface QuickPromptButtonProps {
  text: string;
  onPress: () => void;
}

export default function QuickPromptButton({ text, onPress }: QuickPromptButtonProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  // Check if this is the Explore Timelines button to give it a special appearance
  const isTimelineButton = text.includes('🧭 Explore');

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { 
          backgroundColor: isTimelineButton ? colors.primary + '20' : colors.card, 
          borderColor: isTimelineButton ? colors.primary : colors.border 
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.text, 
          { 
            color: isTimelineButton ? colors.primary : colors.text,
            fontWeight: isTimelineButton ? '600' : '500'
          }
        ]} 
        numberOfLines={2}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 180,
    minHeight: 64,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});