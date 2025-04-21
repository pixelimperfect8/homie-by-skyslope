import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { QuickPrompt } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickPromptButtonProps {
  prompt: QuickPrompt;
  onPress: () => void;
  disabled?: boolean;
}

export default function QuickPromptButton({ 
  prompt,
  onPress,
  disabled = false 
}: QuickPromptButtonProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme as keyof typeof Colors];

  // Check if this is the Explore Timelines button to give it a special appearance
  const isTimelineButton = prompt.text.includes('🧭 Explore');

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#00439A', '#3E75C2', '#86ACE3', '#92DDE7', '#47E9FF']}
        locations={[0, 0.21, 0.46, 0.67, 0.99]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBorder}
      >
        <View style={styles.innerContainer}>
          <Text 
            style={[
              styles.text, 
              { 
                color: '#09256C',
                fontWeight: isTimelineButton ? '600' : '500'
              }
            ]} 
            numberOfLines={2}
          >
            {prompt.text}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
  },
  gradientBorder: {
    borderRadius: 8,
    padding: 1,
  },
  innerContainer: {
    borderRadius: 7,
    backgroundColor: 'white',
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 50,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
});