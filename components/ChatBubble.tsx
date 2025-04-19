import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  // Guard against null or invalid messages
  if (!message || !message.role) {
    return null;
  }
  
  const isUser = message.role === 'user';

  if (message.role === 'system') {
    return null; // Don't render system messages
  }

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer,
      { alignSelf: isUser ? 'flex-end' : 'flex-start' }
    ]}>
      <View style={[
        styles.bubble,
        isUser 
          ? [styles.userBubble, { backgroundColor: colors.userBubble }] 
          : [styles.assistantBubble, { backgroundColor: colors.aiBubble }],
      ]}>
        <Text style={[
          styles.text,
          { color: colors.text }
        ]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});