import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import SendIcon from '@/assets/images/send.svg';

// Keep props signature for compatibility, but ignore them
interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function MessageInput({ 
  onSend, 
  isLoading = false,
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={[
          styles.inputContainer,
          { 
            borderColor: isFocused ? colors.primary : 'transparent',
            borderWidth: 1
          }
        ]}>
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text,
                outline: 'none',
                WebkitAppearance: 'none',
              }
            ]}
            placeholder=""
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={1000}
            numberOfLines={1} 
            editable={!disabled}
            selectionColor="#F4F8FC"
            keyboardAppearance="light"
            cursorColor={colors.primary}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!message.trim() || disabled || isLoading}
        >
          <View style={styles.sendButtonContainer}>
            <SendIcon width={24} height={24} fill={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF', 
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    minHeight: 48, // Use minHeight to allow expansion
    backgroundColor: '#F4F8FC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Adjust padding per platform
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      ':focus-within': {
        outline: 'none',
      }
    } : {}),
  },
  input: {
    fontSize: 16,
    lineHeight: 20, // Ensure consistent line height
    maxHeight: 100, // Limit max height for multiline
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 16,
  },
  sendButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});