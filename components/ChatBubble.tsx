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
          ? [styles.userBubble, { backgroundColor: '#09256C' }] 
          : [styles.assistantBubble, { backgroundColor: '#F4F8FC' }],
      ]}>
        <Text style={[
          styles.text,
          isUser ? { color: '#EFFFFF' } : { color: '#3F5B77' }
        ]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
    paddingHorizontal: 0,
  },
  userContainer: {
    alignSelf: 'flex-end',
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 0,
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    width: '100%',
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  bubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 16,
    marginVertical: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
});